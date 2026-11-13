import { neon } from '@neondatabase/serverless';
import { parseCommunityAttribution, parseCommunityFormat, validCommunityName } from '../../../lib/cards/community';

const maxBodyBytes = 4096;

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Community database is not configured');
  return neon(url, { fetchOptions: { cache: 'no-store', signal: AbortSignal.timeout(8000) } });
}

function failure(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name');
  if (name !== null && !validCommunityName(name)) return failure('Nama format hanya boleh huruf, angka, - dan _ (maks. 60 karakter).', 400);
  if (!process.env.DATABASE_URL) {
    return Response.json([], { headers: { 'X-Community-Unavailable': 'true', 'Cache-Control': 'no-store' } });
  }
  try {
    const sql = database();
    if (name !== null) {
      const [row] = await sql`select exists(select 1 from public.community_formats where lower(btrim(definition->>'name')) = lower(${name})) as exists`;
      return Response.json({ exists: Boolean(row?.exists) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const rows = await sql`select id, definition, contributor_name, created_at from public.community_formats order by id desc limit 100` as {
      id: number;
      definition: unknown;
      contributor_name: string;
      created_at: string;
    }[];
    return Response.json(rows.flatMap(({ id, definition, contributor_name, created_at }) => {
      const format = parseCommunityFormat(definition);
      return format ? [{ id, ...format, contributor: contributor_name, createdAt: created_at }] : [];
    }), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return failure('Katalog komunitas belum dapat dimuat. Coba lagi.', 503);
  }
}

export async function POST(req: Request) {
  if (req.headers.get('sec-fetch-site') === 'cross-site' || !req.headers.get('content-type')?.startsWith('application/json')) {
    return failure('Permintaan berbagi tidak valid.', 400);
  }

  const reader = req.body?.getReader();
  if (!reader) return failure('Format tidak valid.', 400);
  const decoder = new TextDecoder();
  let body = '';
  let bytes = 0;
  let format;
  let attribution;
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      bytes += chunk.value.byteLength;
      if (bytes > maxBodyBytes) {
        await reader.cancel();
        return failure('Ukuran format melebihi batas.', 413);
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    const input = JSON.parse(body + decoder.decode());
    format = parseCommunityFormat(input, true);
    attribution = parseCommunityAttribution(input);
  } catch {
    return failure('Format tidak valid.', 400);
  }
  if (!format || !attribution) return failure('Nama format hanya boleh huruf, angka, - dan _, sedangkan nama kontributor hanya huruf dan spasi. Periksa data format.', 400);

  try {
    const sql = database();
    const [result] = await sql`select public.publish_community_format(${JSON.stringify({ ...format, ...attribution })}::jsonb) as id`;
    return Response.json({ id: result.id });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error.code === 'PT409' || error.code === '23505')) {
      return failure('Nama format sudah digunakan di komunitas. Gunakan nama lain.', 409);
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PT429') {
      return failure('Katalog sedang mencapai batas publikasi. Coba lagi nanti.', 429);
    }
    return failure('Format belum berhasil dibagikan. Coba lagi atau simpan secara lokal.', 503);
  }
}
