import assert from 'node:assert/strict';
import test from 'node:test';
import { createTemplate, inspectWorkbook, readSheet } from '../lib/participants/workbook.ts';
import { defaultMapping, validateRows } from '../lib/participants/model.ts';
import { newCardReference, qrPath } from '../lib/cards/qr.ts';
import { readZip } from '../lib/cards/zip.ts';

test('QR accepts only an opaque card reference and reserves a quiet zone', () => {
  const reference = newCardReference();
  assert.match(reference, /^GK1:[0-9a-f]{32}$/);
  assert.notEqual(reference, newCardReference());
  assert.equal(qrPath(reference).size, 37);
  assert.match(qrPath(reference).path, /^M4,4/);
  assert.throws(() => qrPath('Nama: Peserta Uji'));
});

test('custom template preserves selected column order and required identity', async () => {
  const columns = ['Kelas', 'NamaMurid', 'NoPeserta'];
  const bytes = createTemplate(7, columns);
  await inspectWorkbook(bytes, 'kustom.xlsx');
  const sheet = readSheet(bytes, 'Peserta');
  assert.deepEqual(sheet.headers, columns);
  assert.equal(validateRows(sheet, 7, defaultMapping(sheet.headers, columns), columns).participants[0].id, '0001');
});

test('ZIP reader rejects byte and entry budgets and provides verified entries', async () => {
  const bytes = createTemplate(1);
  const entries = [];
  await readZip(bytes, 1024 * 1024, 50, (name, blob) => entries.push([name, blob.size]));
  assert.ok(entries.some(([name, size]) => name === 'xl/workbook.xml' && size > 0));
  await assert.rejects(readZip(bytes, 1, 50));
  await assert.rejects(readZip(bytes, 1024 * 1024, 1));
});
