import { read, utils, write } from 'xlsx';
import { fieldsFor, maxColumns, maxParticipants } from './model.ts';
import type { WorkbookRows } from './model.ts';

export const maxWorkbookBytes = 10 * 1024 * 1024;
const maxExpandedBytes = 64 * 1024 * 1024;
const maxSheets = 20;

async function checkZip(bytes: ArrayBuffer) {
  const view = new DataView(bytes);
  const u16 = (offset: number) => view.getUint16(offset, true);
  const u32 = (offset: number) => view.getUint32(offset, true);
  let end = view.byteLength - 22;
  const minimum = Math.max(0, end - 65535);
  while (end >= minimum && (u32(end) !== 0x06054b50 || end + 22 + u16(end + 20) !== view.byteLength)) end--;
  if (end < minimum || u16(end + 4) || u16(end + 6)) throw new Error('Struktur ZIP workbook tidak valid.');
  const entries = u16(end + 10);
  const central = u32(end + 16);
  if (entries !== u16(end + 8) || entries > 2048 || central + u32(end + 12) !== end) throw new Error('Direktori workbook tidak valid atau melampaui batas.');
  let cursor = central;
  let expanded = 0;
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < entries; i++) {
    if (cursor + 46 > end || u32(cursor) !== 0x02014b50) throw new Error('Entri workbook rusak.');
    const flags = u16(cursor + 8);
    const method = u16(cursor + 10);
    const compressed = u32(cursor + 20);
    const expected = u32(cursor + 24);
    const local = u32(cursor + 42);
    const nameLength = u16(cursor + 28);
    const next = cursor + 46 + nameLength + u16(cursor + 30) + u16(cursor + 32);
    if (next > end || (flags & 1) || (method !== 0 && method !== 8) || local + 30 > central || u32(local) !== 0x04034b50 || u16(local + 6) !== flags || u16(local + 8) !== method || u16(local + 26) !== nameLength) {
      throw new Error('Entri workbook rusak, terenkripsi, atau tidak didukung.');
    }
    const name = new Uint8Array(bytes, cursor + 46, nameLength);
    const start = local + 30 + nameLength + u16(local + 28);
    const finish = start + compressed;
    if (finish > central || name.some((byte, offset) => byte !== view.getUint8(local + 30 + offset)) || (!(flags & 8) && (u32(local + 18) !== compressed || u32(local + 22) !== expected))) throw new Error('Metadata ZIP workbook tidak konsisten.');
    ranges.push([local, finish]);
    if (expanded + expected > maxExpandedBytes) throw new Error('Ukuran workbook setelah dekompresi melebihi 64 MiB.');
    let actual = compressed;
    if (method === 8) {
      const reader = new Blob([bytes.slice(start, finish)]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      actual = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          actual += value.byteLength;
          if (actual > expected || expanded + actual > maxExpandedBytes) throw new Error('Ukuran dekompresi workbook melampaui batas.');
        }
      } finally {
        await reader.cancel();
      }
    }
    if (actual !== expected) throw new Error('Ukuran dekompresi workbook tidak konsisten.');
    expanded += actual;
    cursor = next;
  }
  ranges.sort((a, b) => a[0] - b[0]);
  if (cursor !== end || ranges.some(([start], index) => index > 0 && start < ranges[index - 1][1])) throw new Error('Entri ZIP workbook tumpang tindih atau rusak.');
}

export async function inspectWorkbook(bytes: ArrayBuffer, name: string) {
  if (bytes.byteLength > maxWorkbookBytes) throw new Error('Ukuran berkas maksimum 10 MiB.');
  if (bytes.byteLength < 8) throw new Error('Berkas Excel kosong atau rusak.');
  const ext = name.toLowerCase().split('.').at(-1);
  const prefix = Array.from(new Uint8Array(bytes, 0, 8));
  if (ext === 'xlsx' && prefix.slice(0, 4).join() === '80,75,3,4') await checkZip(bytes);
  else if (!(ext === 'xls' && prefix.join() === '208,207,17,224,161,177,26,225')) throw new Error('Pilih XLSX atau XLS (Excel 97–2003) yang valid.');
  const names = read(bytes, { type: 'array', bookSheets: true }).SheetNames;
  if (!names.length || names.length > maxSheets) throw new Error('Workbook harus berisi 1–20 sheet.');
  return names;
}

export function readSheet(bytes: ArrayBuffer, name: string): WorkbookRows {
  const sheet = read(bytes, { type: 'array', sheets: name, cellFormula: false, dateNF: 'yyyy-mm-dd' }).Sheets[name];
  if (!sheet?.['!ref']) throw new Error('Sheet kosong. Isi header dan minimal satu baris.');
  const range = utils.decode_range(sheet['!ref']);
  const width = range.e.c - range.s.c + 1;
  if (width > maxColumns || range.e.r - range.s.r > maxParticipants) throw new Error('Batas 1.000 baris peserta dan 64 kolom per sheet.');
  function cellsAt(r: number) {
    return Array.from({ length: width }, (_, index) => {
      const cell = sheet[utils.encode_cell({ r, c: range.s.c + index })];
      if (!cell || cell.t === 'e') return '';
      const text = utils.format_cell(cell);
      if (text.length > 32767) throw new Error('Salah satu sel melampaui batas Excel.');
      return text;
    });
  }
  const headers = cellsAt(range.s.r);
  const ignored = headers.map((header) => header.trim().toLowerCase() === 'password');
  const rows: WorkbookRows['rows'] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const cells = cellsAt(r);
    if (cells.some((cell) => cell.trim())) rows.push({ number: r + 1, cells: cells.map((cell, index) => ignored[index] ? '' : cell) });
  }
  return { headers, rows, headerRow: range.s.r + 1 };
}

export function createTemplate(format: number) {
  const examples = {
    NamaMurid: 'Peserta Uji 0001', Kelas: 'IX-A', Sesi: 'Sesi 1', Username: 'UJI-0001',
    NoPeserta: '0001', NISN: '0000000001', Ruang: 'Ruang 1', TglLahir: '2012-01-01', NamaSatdik: 'Madrasah Contoh',
  };
  const fields = fieldsFor(format);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet([[...fields], fields.map((field) => examples[field])]), 'Peserta');
  return write(workbook, { type: 'array', bookType: 'xlsx', compression: true }) as ArrayBuffer;
}
