import assert from 'node:assert/strict';
import test from 'node:test';
import { formats, moveStep, steps } from '../lib/editor.ts';

test('legacy step order and seven formats', () => {
  assert.deepEqual(steps, ['Format', 'Data Murid', 'Pengaturan', 'Cetak Kartu']);
  assert.equal(new Set(formats).size, 7);
});

test('keyboard traversal wraps and supports Home and End', () => {
  assert.equal(moveStep(0, 'ArrowLeft'), 3);
  assert.equal(moveStep(3, 'ArrowRight'), 0);
  assert.equal(moveStep(2, 'Home'), 0);
  assert.equal(moveStep(1, 'End'), 3);
  assert.equal(moveStep(2, 'Enter'), 2);
});
