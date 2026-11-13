export const communityIcons = {
  users: 'Komunitas',
  clipboard: 'Ujian',
  calendar: 'Jadwal',
  document: 'Dokumen',
} as const;
export type CommunityIcon = keyof typeof communityIcons;

export function validIco(bytes: Uint8Array) {
  if (bytes.length < 10240 || bytes.length > 256000) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint16(4, true);
  const directoryEnd = 6 + count * 16;
  if (view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1 || !count || directoryEnd > bytes.length) return false;
  for (let index = 0; index < count; index++) {
    const size = view.getUint32(14 + index * 16, true);
    const offset = view.getUint32(18 + index * 16, true);
    if (!size || offset < directoryEnd || offset + size > bytes.length) return false;
  }
  return true;
}
