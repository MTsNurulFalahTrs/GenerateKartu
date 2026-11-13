import assert from 'node:assert/strict';
import test from 'node:test';
import { utils, write, version } from 'xlsx';
import { createTemplate, inspectWorkbook, readSheet } from '../lib/participants/workbook.ts';
import { defaultMapping, fieldsFor, validateRows } from '../lib/participants/model.ts';

function workbook(rows, bookType = 'xlsx') {
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.aoa_to_sheet([['Keterangan'], ['Contoh']]), 'Petunjuk');
  utils.book_append_sheet(book, utils.aoa_to_sheet(rows), 'Peserta');
  return write(book, { type: 'array', bookType, compression: true });
}

function validate(bytes, format = 1) {
  const input = readSheet(bytes, 'Peserta');
  return validateRows(input, format, defaultMapping(input.headers, fieldsFor(format)));
}

test('seven XLSX templates round-trip with SheetJS 0.20.3', async () => {
  assert.equal(version, '0.20.3');
  for (let format = 0; format < 7; format++) {
    const bytes = createTemplate(format);
    assert.deepEqual(await inspectWorkbook(bytes, 'template.xlsx'), ['Peserta']);
    const result = validate(bytes, format);
    assert.equal(result.issues.length, 0);
    assert.equal(result.participants.length, 1);
  }
});

test('XLS and XLSX, selected sheet, remap and leading zeros', async () => {
  for (const [bookType, ext] of [['biff8', 'xls'], ['xlsx', 'xlsx']]) {
    const bytes = workbook([[' nopeserta ', 'NISN', 'NamaMurid', 'Kelas', 'Ruang'], ['0007', 123, 'Uji', 'IX-A', '1']], bookType);
    assert.deepEqual(await inspectWorkbook(bytes, 'uji.' + ext), ['Petunjuk', 'Peserta']);
    const result = validate(bytes);
    assert.equal(result.participants[0]?.id, '0007');
    assert.equal(result.participants[0]?.values.NISN, '0000000123');
  }
});

test('invalid rows reject the entire candidate, including duplicates and missing required fields', () => {
  const bytes = workbook([[...fieldsFor(1)], ['01', '123', 'Uji', 'IX', '1'], ['01', '', 'Uji 2', '', '']]);
  const result = validate(bytes);
  assert.equal(result.participants.length, 0);
  assert.deepEqual(result.issues.map((item) => [item.row, item.column]), [[3, 'NISN'], [3, 'Kelas'], [3, 'Ruang'], [3, 'NoPeserta']]);
});

test('legacy Password never leaves the worksheet reader', () => {
  const bytes = workbook([[...fieldsFor(0), ' Password '], ['Uji', 'IX-A', '1', 'u01', 'RAHASIA-SINTETIS']]);
  const input = readSheet(bytes, 'Peserta');
  assert.equal(input.rows[0].cells.at(-1), '');
  assert.equal(validate(bytes, 0).participants[0]?.id, 'u01');
});

test('rejects wrong signatures, truncated ZIP, and row limits', async () => {
  const bytes = workbook([[...fieldsFor(1)], ['01', '123', 'Uji', 'IX', '1']]);
  await assert.rejects(inspectWorkbook(bytes, 'rusak.xls'));
  await assert.rejects(inspectWorkbook(bytes.slice(0, 64), 'rusak.xlsx'));
  const oversized = workbook([[...fieldsFor(1)], ...Array.from({ length: 1001 }, (_, i) => [String(i), '123', 'Uji', 'IX', '1'])]);
  assert.throws(() => readSheet(oversized, 'Peserta'), /1.?000/);
});

test('500 synthetic participants are imported without loss and report process metrics', async (t) => {
  const bytes = workbook([[...fieldsFor(1)], ...Array.from({ length: 500 }, (_, i) => [String(i).padStart(4, '0'), '0000000123', 'Peserta Uji ' + i, 'IX', '1'])]);
  const memory = process.memoryUsage().heapUsed;
  const started = performance.now();
  await inspectWorkbook(bytes, '500.xlsx');
  const { participants, issues } = validate(bytes);
  t.diagnostic(`500 rows: ${(performance.now() - started).toFixed(1)} ms; heap delta ${((process.memoryUsage().heapUsed - memory) / 1048576).toFixed(2)} MiB`);
  assert.equal(participants.length, 500);
  assert.equal(issues.length, 0);
});


test('custom Excel headers round-trip without importing Password data', () => {
  const selected = ['NoPeserta', 'NamaMurid', 'Custom1'];
  const excelHeaders = { Custom1: 'NomorBangku' };
  const template = createTemplate(7, selected, excelHeaders);
  const generated = readSheet(template, 'Peserta');
  assert.deepEqual(generated.headers, ['NoPeserta', 'NamaMurid', 'NomorBangku']);

  const bytes = workbook([
    ['NoPeserta', 'NamaMurid', 'NomorBangku', 'Password'],
    ['0007', 'Murid Contoh', 'A-12', 'RAHASIA'],
  ]);
  const input = readSheet(bytes, 'Peserta');
  assert.equal(input.rows[0].cells[3], '');
  const mapping = defaultMapping(input.headers, selected, excelHeaders);
  const result = validateRows(input, 7, mapping, selected, 'NoPeserta');
  assert.equal(result.issues.length, 0);
  assert.equal(result.participants[0].values.Custom1, 'A-12');
  assert.doesNotMatch(JSON.stringify(result), /RAHASIA/);
});
