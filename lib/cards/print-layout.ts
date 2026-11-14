export const paperSizes = {
  A4: [210, 297],
  A5: [148, 210],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  F4: [210, 330],
} as const;

export const paperEdges = ['top', 'right', 'bottom', 'left'] as const;
export const paperAlignments = ['start', 'center', 'end'] as const;

export type PaperSettings = {
  size: keyof typeof paperSizes;
  orientation: 'portrait' | 'landscape';
  margins: Record<(typeof paperEdges)[number], number>;
  horizontal: (typeof paperAlignments)[number];
  vertical: (typeof paperAlignments)[number];
};

export const defaultPaper: PaperSettings = {
  size: 'A4',
  orientation: 'landscape',
  margins: { top: 8, right: 8, bottom: 8, left: 8 },
  horizontal: 'start',
  vertical: 'start',
};

const gap = 3;

export function paperDimensions(paper: PaperSettings) {
  const [short, long] = paperSizes[paper.size];
  return paper.orientation === 'landscape' ? { width: long, height: short } : { width: short, height: long };
}

export function paperArea(paper: PaperSettings) {
  const { width, height } = paperDimensions(paper);
  return {
    width: width - paper.margins.left - paper.margins.right,
    height: height - paper.margins.top - paper.margins.bottom,
  };
}

export function paperLayoutError(paper: PaperSettings, width: number, height: number) {
  if (paperEdges.some((edge) => !Number.isFinite(paper.margins[edge]) || paper.margins[edge] < 0 || paper.margins[edge] > 50)) {
    return 'Masukkan margin antara 0 dan 50 mm pada setiap sisi.';
  }
  const area = paperArea(paper);
  if (width > area.width || height > area.height) {
    return 'Kartu tidak muat. Kurangi margin atau ukuran kartu, atau pilih kertas yang lebih besar.';
  }
  return '';
}

export function cardPages<T>(cards: readonly T[], width: number, height: number, paper = defaultPaper) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 60 || width > 180 || height < 40 || height > 150) {
    throw new Error('Gunakan ukuran kartu 60–180 × 40–150 mm.');
  }
  const error = paperLayoutError(paper, width, height);
  if (error) throw new Error(error);

  const area = paperArea(paper);
  const columns = Math.floor((area.width + gap) / (width + gap));
  const rows = Math.floor((area.height + gap) / (height + gap));
  const capacity = columns * rows;
  const pages: T[][] = [];
  for (let offset = 0; offset < cards.length; offset += capacity) {
    pages.push(cards.slice(offset, offset + capacity));
  }
  return { columns, rows, pages, paper, sheet: paperDimensions(paper), area, width, height, gap };
}

export type PrintLayout = ReturnType<typeof cardPages<unknown>>;

export function pageGrid(layout: PrintLayout, count: number) {
  const { columns, width, height, area, gap, paper } = layout;
  const pageColumns = Math.min(columns, count);
  const pageRows = Math.ceil(count / columns);
  const freeX = Math.max(0, area.width - pageColumns * width - (pageColumns - 1) * gap);
  const freeY = Math.max(0, area.height - pageRows * height - (pageRows - 1) * gap);
  return {
    columns: pageColumns,
    left: paper.margins.left + freeX * paperAlignments.indexOf(paper.horizontal) / 2,
    top: paper.margins.top + freeY * paperAlignments.indexOf(paper.vertical) / 2,
  };
}
