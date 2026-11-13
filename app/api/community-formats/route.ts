import { neon } from '@neondatabase/serverless';
import { parseCommunityAttribution, parseCommunityFormat, validCommunityName } from '../../../lib/cards/community';

import { communityIcons, validIco } from '../../../lib/cards/community-icons';
import type { CommunityIcon } from '../../../lib/cards/community-icons';

const maxBodyBytes = 350000;

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Community database is not configured');
  return neon(url, { fetchOptions: { cache: 'no-store', signal: AbortSignal.timeout(8000) } });
}

function failure(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const name = params.get('name');
  const icon = params.get('icon');
  if (icon !== null && (!/^[1-9][0-9]{0,9}$/.test(icon) || Number(icon) > 2147483647)) {
    return failure('ID ikon tidak valid.', 400);
  }
  if (name !== null && !validCommunityName(name)) return failure('Nama format hanya boleh huruf, angka, - dan _ (maks. 60 karakter).', 400);
  if (!process.env.DATABASE_URL) {
    if (name !== null || icon !== null) return failure('Katalog komunitas belum tersedia.', 503);
    return Response.json([], { headers: { 'X-Community-Unavailable': 'true', 'Cache-Control': 'no-store' } });
  }
  try {
    const sql = database();
    if (icon !== null) {
      const [row] = await sql`select encode(icon_ico, 'base64') as ico from public.community_formats where id = ${Number(icon)}`;
      if (!row?.ico) return failure('Ikon tidak tersedia.', 404);
      return new Response(Uint8Array.from(Buffer.from(row.ico, 'base64')), { headers: {
        'Content-Type': 'image/vnd.microsoft.icon', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=300',
      } });
    }
    if (name !== null) {
      const [row] = await sql`select exists(select 1 from public.community_formats where lower(btrim(definition->>'name')) = lower(${name})) as exists`;
      return Response.json({ exists: Boolean(row?.exists) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const rows = await sql`select id, definition, contributor_name, created_at, icon_preset, icon_ico is not null as has_custom_icon from public.community_formats order by id desc limit 100` as {
      id: number;
      definition: unknown;
      contributor_name: string;
      created_at: string;
      icon_preset: CommunityIcon;
      has_custom_icon: boolean;
    }[];
    return Response.json(rows.flatMap(({ id, definition, contributor_name, created_at, icon_preset, has_custom_icon }) => {
      const format = parseCommunityFormat(definition);
      return format ? [{ id, ...format, contributor: contributor_name, createdAt: created_at, iconPreset: icon_preset, hasCustomIcon: has_custom_icon }] : [];
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
  let preset: CommunityIcon = 'users';
  let ico: string | null = null;
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
    if (input?.iconPreset !== undefined) {
      if (typeof input.iconPreset !== 'string' || !Object.hasOwn(communityIcons, input.iconPreset)) {
        return failure('Ikon bawaan tidak valid.', 400);
      }
      preset = input.iconPreset;
    }
    if (input?.iconIco !== undefined) {
      if (typeof input.iconIco !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.iconIco) ||
        !validIco(Buffer.from(input.iconIco, 'base64'))) return failure('Gunakan berkas .ico berukuran 10–250 KB.', 400);
      ico = input.iconIco;
    }
  } catch {
    return failure('Format tidak valid.', 400);
  }
  if (!format || !attribution) return failure('Nama format hanya boleh huruf, angka, - dan _, sedangkan nama kontributor hanya huruf dan spasi. Periksa data format.', 400);

  try {
    const sql = database();
    const [result] = await sql`select public.publish_community_format(${JSON.stringify({ ...format, ...attribution })}::jsonb, ${preset}, decode(${ico}, 'base64')) as id`;
    return Response.json({ id: result.id });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PT412') {
      return failure('Urutan Kolom Excel sudah digunakan oleh format bawaan atau komunitas. Ubah urutan atau susunan kolom.', 409);
    }
    if (error && typeof error === 'object' && 'code' in error && (error.code === 'PT409' || error.code === '23505')) {
      return failure('Nama format sudah digunakan di komunitas. Gunakan nama lain.', 409);
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PT429') {
      return failure('Katalog sedang mencapai batas publikasi. Coba lagi nanti.', 429);
    }
    return failure('Format belum berhasil dibagikan. Coba lagi atau simpan secara lokal.', 503);
  }
}

export async function DELETE(req: Request) {
  if (req.headers.get('sec-fetch-site') === 'cross-site' ||
    !req.headers.get('content-type')?.startsWith('application/json')) {
    return failure('Permintaan hapus tidak valid.', 400);
  }

  const reader = req.body?.getReader();
  if (!reader) return failure('Permintaan hapus tidak valid.', 400);
  let id: unknown;
  let pin: unknown;
  try {
    const decoder = new TextDecoder();
    let body = '';
    let size = 0;
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      size += chunk.value.byteLength;
      if (size > 128) {
        await reader.cancel();
        return failure('Permintaan hapus terlalu besar.', 413);
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    ({ id, pin } = JSON.parse(body + decoder.decode()));
  } catch {
    return failure('Permintaan hapus tidak valid.', 400);
  }
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > 2147483647 ||
    typeof pin !== 'string' || !/^[0-9]{8,16}$/.test(pin)) {
    return failure('Masukkan PIN pemilik yang terdiri dari 8–16 angka.', 400);
  }

  try {
    const sql = database();
    const [result] = await sql`select public.delete_community_format(${id}::integer, ${pin}::text) as status`;
    switch (result?.status) {
      case 'deleted': return new Response(null, { status: 204 });
      case 'missing': return failure('Format sudah tidak tersedia di katalog.', 404);
      case 'invalid': return failure('PIN pemilik salah.', 403);
      case 'locked': return failure('Terlalu banyak percobaan. Coba lagi dalam beberapa menit.', 429);
      case 'unconfigured': return failure('PIN pemilik belum dikonfigurasi.', 503);
      default: return failure('Format belum berhasil dihapus. Coba lagi.', 503);
    }
  } catch {
    return failure('Format belum berhasil dihapus. Coba lagi.', 503);
  }
}
