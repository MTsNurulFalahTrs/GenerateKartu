import assert from 'node:assert/strict';
import test from 'node:test';
import { findDuplicateExcelColumns } from '../lib/cards/custom-format-order.ts';

test('field order derives from unique Excel headers, including case and whitespace collisions', () => {
  const rows = [
    { id: 'row-1', excel: 'NoPeserta' },
    { id: 'row-2', excel: 'Kelas' },
    { id: 'row-3', excel: ' nopeserta ' },
    { id: 'row-4', excel: 'Password' },
    { id: 'row-5', excel: '' },
  ];
  const conflicts = findDuplicateExcelColumns(rows);
  assert.deepEqual(conflicts.get('row-1'), [1, 3]);
  assert.deepEqual(conflicts.get('row-3'), [1, 3]);
  assert.equal(conflicts.has('row-2'), false);
  assert.equal(conflicts.has('row-5'), false);
  assert.equal(findDuplicateExcelColumns(rows.map((row, i) =>
    i === 2 ? { ...row, excel: 'NISN' } : row)).size, 0);
});
