export const steps = ['Format', 'Data Murid', 'Pengaturan', 'Cetak Kartu'] as const;

export const formats = [
  'Standar CBT',
  'Lengkap Ruang',
  'Sederhana',
  'Identitas + Ruang',
  'Identitas Dasar',
  'Identitas + Ruang + Satdik',
  'Identitas + Satdik',
] as const;

export function moveStep(index: number, key: string): number {
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % steps.length;
    case 'ArrowLeft':
      return (index + steps.length - 1) % steps.length;
    case 'Home':
      return 0;
    case 'End':
      return steps.length - 1;
    default:
      return index;
  }
}
