import { parseCommunityFormat } from '../../../lib/cards/community';

const maxBodyBytes = 1024;

function request(path: string, init?: RequestInit) {
  const url = process.env.COMMUNITY_SUPABASE_URL;
  const key = process.env.COMMUNITY_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Community database is not configured');
  return fetch(new URL(`/rest/v1/${path}`, url), {
    ...init,
    headers: { apikey: key, 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
}

function failure(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function GET() {
  try {
    const response = await request('community_formats?select=id,definition&order=id.desc&limit=100');
    if (!response.ok) throw new Error('Community read failed');
    const rows: { id: number; definition: unknown }[] = await response.json();
    return Response.json(rows.flatMap(({ id, definition }) => {
      const format = parseCommunityFormat(definition);
      return format ? [{ id, ...format }] : [];
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
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      bytes += chunk.value.byteLength;
      if (bytes > maxBodyBytes) {
        await reader.cancel();
        return failure('Ukuran format melebihi batas.', 413);
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    format = parseCommunityFormat(JSON.parse(body + decoder.decode()));
  } catch {
    return failure('Format tidak valid.', 400);
  }
  if (!format) return failure('Format tidak valid.', 400);

  try {
    const response = await request('rpc/publish_community_format', {
      method: 'POST',
      body: JSON.stringify({ input: format }),
    });
    if (response.status === 429) return failure('Katalog sedang mencapai batas publikasi. Coba lagi nanti.', 429);
    if (!response.ok) throw new Error('Community write failed');
    return Response.json({ id: await response.json() });
  } catch {
    return failure('Format belum berhasil dibagikan. Coba lagi atau simpan secara lokal.', 503);
  }
}
