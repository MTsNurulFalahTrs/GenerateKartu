import { readZip } from '../cards/zip.ts';
import { read, utils, write } from 'xlsx';
import { fieldsFor, maxColumns, maxParticipants } from './model.ts';
import type { Field, WorkbookRows } from './model.ts';

export const maxWorkbookBytes = 10 * 1024 * 1024;
const maxExpandedBytes = 64 * 1024 * 1024;
const maxSheets = 20;

export async function inspectWorkbook(bytes: ArrayBuffer, name: string) {
  if (bytes.byteLength > maxWorkbookBytes) throw new Error('Ukuran berkas maksimum 10 MiB.');
  if (bytes.byteLength < 8) throw new Error('Berkas Excel kosong atau rusak.');
  const ext = name.toLowerCase().split('.').at(-1);
  const prefix = Array.from(new Uint8Array(bytes, 0, 8));
  if (ext === 'xlsx' && prefix.slice(0, 4).join() === '80,75,3,4') await readZip(bytes, maxExpandedBytes, 2048);
  else if (!(ext === 'xls' && prefix.join() === '208,207,17,224,161,177,26,225')) throw new Error('Pilih XLSX atau XLS (Excel 97–2003) yang valid.');
  const names = read(bytes, { type: 'array', bookSheets: true }).SheetNames;
  if (!names.length || names.length > maxSheets) throw new Error('Workbook harus berisi 1–20 sheet.');
  return names;
}

export function readSheet(bytes: ArrayBuffer, name: string, maxRows = maxParticipants, columnLimit = maxColumns, omitPasswords = true): WorkbookRows {
  const sheet = read(bytes, { type: 'array', sheets: name, cellFormula: false, nodim: true, dateNF: 'yyyy-mm-dd' }).Sheets[name];
  if (!sheet?.['!ref']) throw new Error('Sheet kosong. Isi header dan minimal satu baris.');
  const range = utils.decode_range(sheet['!ref']);
  const width = range.e.c - range.s.c + 1;
  if (width > columnLimit || range.e.r - range.s.r > maxRows) throw new Error(`Batas ${maxRows} baris data dan ${columnLimit} kolom per sheet.`);
  function cellsAt(r: number) {
    return Array.from({ length: width }, (_, index) => {
      const address = utils.encode_cell({ r, c: range.s.c + index });
      const cell = sheet[address];
      if (!cell) return '';
      if (cell.t === 'e') throw new Error(`Sel ${address} berisi galat Excel. Perbaiki sel sebelum mengimpor.`);
      const text = utils.format_cell(cell);
      if (text.length > 32767) throw new Error('Salah satu sel melampaui batas Excel.');
      return text;
    });
  }
  const headers = cellsAt(range.s.r);
  const ignored = headers.map((header) => omitPasswords && header.trim().toLowerCase() === 'password');
  const rows: WorkbookRows['rows'] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const cells = cellsAt(r);
    if (cells.some((cell) => cell.trim())) rows.push({ number: r + 1, cells: cells.map((cell, index) => ignored[index] ? '' : cell) });
  }
  return { headers, rows, headerRow: range.s.r + 1 };
}

export function createTemplate(format: number, custom?: readonly Field[],
  excelHeaders: Partial<Record<Field, string>> = {}) {
  const examples = {
    NamaMurid: 'Peserta Uji 0001', Kelas: 'IX-A', Sesi: 'Sesi 1', Username: 'UJI-0001',
    NoPeserta: '0001', NISN: '0000000001', Ruang: 'Ruang 1', TglLahir: '2012-01-01', NamaSatdik: 'Madrasah Contoh',
  };
  const fields = fieldsFor(format, custom);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet([fields.map((field) => excelHeaders[field] || field), fields.map((field) => examples[field as keyof typeof examples] ?? '')]), 'Peserta');
  return write(workbook, { type: 'array', bookType: 'xlsx', compression: true }) as ArrayBuffer;
}

export function createScheduleTemplate(columns: string[], rowCount: number) {
  const workbook = utils.book_new();
  const rows = Array.from({ length: rowCount }, () => columns.map(() => ''));
  utils.book_append_sheet(workbook, utils.aoa_to_sheet([columns, ...rows]), 'Jadwal');
  return write(workbook, { type: 'array', bookType: 'xlsx', compression: true }) as ArrayBuffer;
}

export async function readScheduleWorkbook(file: File, columns: string[]) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran file jadwal maksimum 5 MiB.');
  const bytes = await file.arrayBuffer();
  const [sheet] = await inspectWorkbook(bytes, file.name);
  const { headers, rows } = readSheet(bytes, sheet, 20, 6, false);
  if (headers.length !== columns.length || headers.some((header, index) => header.trim() !== columns[index])) {
    throw new Error('Header Excel harus sama dengan kolom jadwal, termasuk urutannya.');
  }
  if (!rows.length) throw new Error('Isi minimal satu baris jadwal pada sheet pertama.');
  return rows.map(({ cells }) => cells.map((cell) => {
    if (cell.length > 100) throw new Error('Isi setiap sel jadwal maksimum 100 karakter.');
    return cell.trim();
  }));
}
