import { readZip } from './zip';

const MiB = 1024 * 1024;

export async function normalizeImage(source: Blob) {
  if (!source.size || source.size > 5 * MiB) throw new Error('Ukuran gambar harus 1 byte–5 MiB.');
  const signature = new Uint8Array(await source.slice(0, 8).arrayBuffer());
  const png = signature.join() === '137,80,78,71,13,10,26,10';
  const jpeg = signature[0] === 255 && signature[1] === 216 && signature[2] === 255;
  const mime = png ? 'image/png' : 'image/jpeg';
  if ((!png && !jpeg) || (source.type && source.type !== mime)) throw new Error('Pilih gambar PNG atau JPEG yang valid.');
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' }).catch(() => {
    throw new Error('Gambar rusak atau gagal dibaca.');
  });
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 12_000_000) throw new Error('Dimensi gambar melebihi 12 megapiksel.');
    const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser gagal menyiapkan gambar.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Gambar gagal diproses.')), mime, 0.88);
    });
  } finally {
    bitmap.close();
  }
}

export async function importPhotoZip(file: File, participantIds: Set<string>) {
  if (file.size > 50 * MiB) throw new Error('Ukuran ZIP maksimum 50 MiB.');
  const candidates = new Map<string, Blob>();
  const unmatched: string[] = [];
  await readZip(await file.arrayBuffer(), 100 * MiB, 1200, (name, data) => {
    const path = name.replaceAll('\\', '/');
    if (/^(?:\/|[a-z]:)/i.test(path) || path.split('/').includes('..') || path.includes('\0')) throw new Error('ZIP mengandung jalur yang tidak aman.');
    if (path.endsWith('/') || path.startsWith('__MACOSX/')) return;
    if (/\.(?:zip|7z|rar)$/i.test(path)) throw new Error('Arsip bertingkat tidak didukung.');
    const base = path.split('/').at(-1) ?? '';
    if (!/\.(?:jpe?g|png)$/i.test(base)) return;
    const id = base.replace(/\.[^.]+$/, '').trim();
    if (!participantIds.has(id)) {
      unmatched.push(base);
      return;
    }
    if (candidates.has(id)) throw new Error(`Lebih dari satu foto cocok dengan ID ${id}.`);
    candidates.set(id, data.slice(0, data.size, /\.png$/i.test(base) ? 'image/png' : 'image/jpeg'));
  });
  const photos = new Map<string, Blob>();
  for (const [id, image] of candidates) {
    try {
      photos.set(id, await normalizeImage(image));
    } catch (error) {
      throw new Error(`Foto ID ${id}: ${error instanceof Error ? error.message : 'Gagal diproses.'}`);
    }
  }
  return { photos, unmatched };
}
