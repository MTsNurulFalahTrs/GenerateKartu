import assert from 'node:assert/strict';
import test from 'node:test';
import { cardPages } from '../lib/cards/print-layout.ts';

test('A4 pagination preserves every participant in order, including the final page', () => {
  for (const [width, height, capacity] of [[86, 54, 9], [90, 60, 9], [100, 70, 4], [180, 150, 1]]) {
    for (const count of [0, 1, 9, 10, 60, 132, 500]) {
      const input = Array.from({ length: count }, (_, i) => i + 1);
      const { pages } = cardPages(input, width, height);
      assert.equal(pages.length, Math.ceil(count / capacity));
      assert.deepEqual(pages.flat(), input);
      assert.ok(pages.every((page) => page.length <= capacity));
    }
  }
  assert.throws(() => cardPages([1], NaN, 54));
  assert.throws(() => cardPages([1], 181, 54));
});
