const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

function updateCrc(crc: number, bytes: Uint8Array) {
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return crc;
}

export async function readZip(bytes: ArrayBuffer, maxExpandedBytes: number, maxEntries: number, onEntry?: (name: string, data: Blob) => void) {
  const view = new DataView(bytes);
  const u16 = (offset: number) => view.getUint16(offset, true);
  const u32 = (offset: number) => view.getUint32(offset, true);
  let end = view.byteLength - 22;
  const minimum = Math.max(0, end - 65535);
  while (end >= minimum && (u32(end) !== 0x06054b50 || end + 22 + u16(end + 20) !== view.byteLength)) end--;
  if (end < minimum || u16(end + 4) || u16(end + 6)) throw new Error('Struktur ZIP tidak valid.');
  const entries = u16(end + 10);
  const central = u32(end + 16);
  if (entries !== u16(end + 8) || entries > maxEntries || central + u32(end + 12) !== end) throw new Error('Direktori ZIP tidak valid atau melampaui batas.');
  let cursor = central;
  let expanded = 0;
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < entries; i++) {
    if (cursor + 46 > end || u32(cursor) !== 0x02014b50) throw new Error('Entri ZIP rusak.');
    const flags = u16(cursor + 8);
    const method = u16(cursor + 10);
    const compressed = u32(cursor + 20);
    const expected = u32(cursor + 24);
    const local = u32(cursor + 42);
    const nameLength = u16(cursor + 28);
    const next = cursor + 46 + nameLength + u16(cursor + 30) + u16(cursor + 32);
    if (next > end || (flags & 1) || (method !== 0 && method !== 8) || local + 30 > central || u32(local) !== 0x04034b50 || u16(local + 6) !== flags || u16(local + 8) !== method || u16(local + 26) !== nameLength) {
      throw new Error('Entri ZIP rusak, terenkripsi, atau tidak didukung.');
    }
    const name = new Uint8Array(bytes, cursor + 46, nameLength);
    const start = local + 30 + nameLength + u16(local + 28);
    const finish = start + compressed;
    if (finish > central || name.some((byte, offset) => byte !== view.getUint8(local + 30 + offset)) || (!(flags & 8) && (u32(local + 18) !== compressed || u32(local + 22) !== expected))) throw new Error('Metadata ZIP ZIP tidak konsisten.');
    ranges.push([local, finish]);
    if (expanded + expected > maxExpandedBytes) throw new Error('Ukuran ZIP setelah dekompresi melampaui batas.');
    const parts: ArrayBuffer[] = [];
    let crc = 0xffffffff;
    let actual = compressed;
    if (method === 8) {
      const reader = new Blob([bytes.slice(start, finish)]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      actual = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          actual += value.byteLength;
          crc = updateCrc(crc, value);
          if (actual > expected || expanded + actual > maxExpandedBytes) throw new Error('Ukuran dekompresi ZIP melampaui batas.');
          if (onEntry) parts.push(value.slice().buffer);
        }
      } finally {
        await reader.cancel();
      }
    }
    if (method === 0) crc = updateCrc(crc, new Uint8Array(bytes, start, compressed));
    if (((crc ^ 0xffffffff) >>> 0) !== u32(cursor + 16)) throw new Error('Checksum ZIP tidak cocok.');
    if (actual !== expected) throw new Error('Ukuran dekompresi ZIP tidak konsisten.');
    if (onEntry) onEntry(new TextDecoder('utf-8', { fatal: true }).decode(name), new Blob(method === 0 ? [bytes.slice(start, finish)] : parts));
    expanded += actual;
    cursor = next;
  }
  ranges.sort((a, b) => a[0] - b[0]);
  if (cursor !== end || ranges.some(([start], index) => index > 0 && start < ranges[index - 1][1])) throw new Error('Entri ZIP ZIP tumpang tindih atau rusak.');
}

