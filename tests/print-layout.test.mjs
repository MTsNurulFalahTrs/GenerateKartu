import assert from 'node:assert/strict';
import test from 'node:test';
import { cardPages, defaultPaper, pageGrid } from '../lib/cards/print-layout.ts';

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

test('custom paper uses four margins and aligns each page within the printable area', () => {
  const config = {
    ...defaultPaper,
    size: 'A5',
    orientation: 'portrait',
    margins: { top: 10, right: 12, bottom: 14, left: 16 },
    horizontal: 'center',
    vertical: 'end',
  };
  const layout = cardPages([1, 2, 3, 4], 86, 54, config);
  assert.deepEqual(layout.sheet, { width: 148, height: 210 });
  assert.deepEqual(layout.pages, [[1, 2, 3], [4]]);
  assert.deepEqual(pageGrid(layout, 3), { columns: 1, left: 33, top: 28 });
  assert.deepEqual(pageGrid(layout, 1), { columns: 1, left: 33, top: 142 });
  assert.throws(() => cardPages([1], 150, 54, config), /Kartu tidak muat/);
  assert.throws(() => cardPages([1], 86, 54, { ...config, margins: { ...config.margins, top: -1 } }), /0 dan 50/);
});
