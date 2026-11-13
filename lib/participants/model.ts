export const maxParticipants = 1000;
export const maxColumns = 64;

const builtins = [
  ['NamaMurid', 'Kelas', 'Sesi', 'Username'],
  ['NoPeserta', 'NISN', 'NamaMurid', 'Kelas', 'Ruang'],
  ['NoPeserta', 'NISN', 'NamaMurid', 'Kelas'],
  ['NamaMurid', 'TglLahir', 'NISN', 'NoPeserta', 'Ruang'],
  ['NamaMurid', 'TglLahir', 'NISN', 'NoPeserta'],
  ['NamaMurid', 'TglLahir', 'NISN', 'NoPeserta', 'Ruang', 'NamaSatdik'],
  ['NamaMurid', 'TglLahir', 'NISN', 'NoPeserta', 'NamaSatdik'],
] as const;

export const customFieldIds = ['Custom1', 'Custom2', 'Custom3', 'Custom4', 'Custom5', 'Custom6'] as const;
export type Field = (typeof builtins)[number][number] | (typeof customFieldIds)[number] | 'Password';
export type Participant = { id: string; name: string; cardReference?: string; values: Partial<Record<Field, string>> };
export type Issue = { row: number; column: string; message: string };
export type Row = { number: number; cells: string[] };
export type WorkbookRows = { headers: string[]; rows: Row[]; headerRow: number };
export type Mapping = Partial<Record<Field, number>>;

export function fieldsFor(format: number, custom: readonly Field[] = []) {
  return format === 7 ? custom : builtins[format] ?? builtins[0];
}

export function defaultMapping(
  headers: string[], fields: readonly Field[], excelHeaders: Partial<Record<Field, string>> = {}, exact = false,
): Mapping {
  const mapping: Mapping = {};
  for (const field of fields) {
    const matches = headers.flatMap((header, index) => (exact ? header === (excelHeaders[field] || field) : header.trim().toLowerCase() === (excelHeaders[field]?.trim() || field).toLowerCase()) ? [index] : []);
    if (matches.length === 1) mapping[field] = matches[0];
  }
  return mapping;
}

export function photoFieldFor(format: number, customPhotoKey?: Field): Field {
  return format === 7 && customPhotoKey ? customPhotoKey : format === 0 ? 'Username' : 'NoPeserta';
}

export function validateRows(input: WorkbookRows, format: number, mapping: Mapping, custom: readonly Field[] = [], customPhotoKey?: Field) {
  const fields = fieldsFor(format, custom);
  const idField = photoFieldFor(format, customPhotoKey);
  if (idField === 'Password') return { participants: [] as Participant[], issues: [{ row: input.headerRow, column: 'Password', message: 'Password tidak boleh menjadi Acuan Foto.' }] as Issue[] };
  const issues: Issue[] = [];
  const participants: Participant[] = [];
  const usedColumns = new Set<number>();
  for (const field of fields) {
    const index = mapping[field];
    if (index === undefined || !Number.isInteger(index) || index < 0 || index >= input.headers.length) {
      issues.push({ row: input.headerRow, column: field, message: 'Pilih kolom sumber yang sesuai.' });
    } else if (usedColumns.has(index)) {
      issues.push({ row: input.headerRow, column: field, message: 'Pilih kolom sumber yang berbeda.' });
    } else if (input.headers[index].trim().toLowerCase() === 'password' && field !== 'Password') {
      issues.push({ row: input.headerRow, column: field, message: 'Pilih kolom selain Password.' });
    } else {
      usedColumns.add(index);
    }
  }
  if (!input.rows.length) issues.push({ row: input.headerRow, column: '—', message: 'Tambahkan minimal satu baris peserta.' });
  if (issues.length) return { participants, issues };
  const ids = new Map<string, number>();
  for (const row of input.rows) {
    const values: Participant['values'] = {};
    for (const field of fields) {
      const raw = row.cells[mapping[field]!] ?? '';
      let value = raw.trim();
      const max = field === idField ? 80 : 160;
      let message = '';
      if (!value) message = 'Isi nilai wajib ini.';
      else if (value.length > max) message = `Batasi nilai hingga ${max} karakter.`;
      else if (field === 'NISN') {
        if (!/^\d{1,10}$/.test(value)) message = 'Gunakan NISN dengan maksimal 10 digit.';
        else value = value.padStart(10, '0');
      } else if (field === 'TglLahir') {
        const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (parts) {
          const [year, month, day] = parts[1].length === 4 ? parts.slice(1) : [parts[3], parts[2], parts[1]];
          const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          const date = new Date(iso + 'T00:00:00Z');
          if (Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === iso) value = iso;
          else message = 'Masukkan tanggal kalender yang valid.';
        } else message = 'Gunakan YYYY-MM-DD atau DD-MM-YYYY.';
      }
      if (message) issues.push({ row: row.number, column: field, message });
      values[field] = value;
    }
    const id = values[idField] ?? '';
    if (id) {
      const earlier = ids.get(id);
      if (earlier !== undefined) issues.push({ row: row.number, column: idField, message: `Gunakan ID unik. ID sudah ada di baris ${earlier}.` });
      else ids.set(id, row.number);
    }
    participants.push({ id, name: values.NamaMurid ?? id, values });
  }
  return { participants: issues.length ? [] : participants, issues };
}
