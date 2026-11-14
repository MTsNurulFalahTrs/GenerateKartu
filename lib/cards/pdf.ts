import { PDFDocument } from 'pdf-lib';
import { pageGrid } from './print-layout';
import type { PrintLayout } from './print-layout';

const pt = (mm: number) => mm * 72 / 25.4;

function dataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Aset kartu gagal dibaca.'));
    reader.readAsDataURL(blob);
  });
}

async function rasterize(card: HTMLElement, assets: Map<string, Promise<string>>) {
  const { width, height } = card.getBoundingClientRect();
  const clone = card.cloneNode(true) as HTMLElement;
  const sourceNodes = [card, ...card.querySelectorAll('*')];
  const clonedNodes = [clone, ...clone.querySelectorAll('*')];
  for (const [index, node] of sourceNodes.entries()) {
    const computed = getComputedStyle(node);
    const style = Array.from(computed).filter((key) => !key.startsWith('--'))
      .map((key) => `${key}:${computed.getPropertyValue(key)}`).join(';');
    clonedNodes[index].setAttribute('style', style);
    if (node instanceof HTMLImageElement) {
      const url = node.currentSrc || node.src;
      if (!assets.has(url)) assets.set(url, fetch(url).then((response) => {
        if (!response.ok) throw new Error('Aset kartu gagal dimuat.');
        return response.blob();
      }).then(dataUrl));
      clonedNodes[index].setAttribute('src', (await assets.get(url))!);
    }
  }
  const markup = new XMLSerializer().serializeToString(clone);
  const image = new Image();
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`,
  );
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * 3);
  canvas.height = Math.ceil(height * 3);
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser gagal membuat kanvas PDF.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) =>
      value ? resolve(value) : reject(new Error('Gambar kartu gagal disimpan.')), 'image/png'));
    return blob.arrayBuffer();
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function buildCardPdf(
  pages: HTMLElement[][], layout: PrintLayout,
  signal: AbortSignal, progress: (count: number) => void,
) {
  const pdf = await PDFDocument.create();
  const assets = new Map<string, Promise<string>>();
  const { sheet, width, height, gap } = layout;
  let count = 0;
  for (const cards of pages) {
    const grid = pageGrid(layout, cards.length);
    const page = pdf.addPage([pt(sheet.width), pt(sheet.height)]);
    for (const [index, card] of cards.entries()) {
      signal.throwIfAborted();
      const image = await pdf.embedPng(await rasterize(card, assets));
      page.drawImage(image, {
        x: pt(grid.left + (index % grid.columns) * (width + gap)),
        y: pt(sheet.height - grid.top - height - Math.floor(index / grid.columns) * (height + gap)),
        width: pt(width), height: pt(height),
      });
      progress(++count);
    }
  }
  signal.throwIfAborted();
  return pdf.save();
}
