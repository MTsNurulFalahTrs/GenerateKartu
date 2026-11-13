export const paper = { width: 297, height: 210, margin: 8, gap: 3 } as const;

export function cardPages<T>(cards: readonly T[], width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 60 || width > 180 || height < 40 || height > 150) {
    throw new Error('Gunakan ukuran kartu 60–180 × 40–150 mm.');
  }
  const columns = Math.floor((paper.width - 2 * paper.margin + paper.gap) / (width + paper.gap));
  const rows = Math.floor((paper.height - 2 * paper.margin + paper.gap) / (height + paper.gap));
  const capacity = columns * rows;
  const pages: T[][] = [];
  for (let offset = 0; offset < cards.length; offset += capacity) {
    pages.push(cards.slice(offset, offset + capacity));
  }
  return { columns, pages };
}
