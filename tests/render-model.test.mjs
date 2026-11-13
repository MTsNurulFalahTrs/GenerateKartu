import assert from 'node:assert/strict';
import test from 'node:test';
import { filterPreview } from '../lib/cards/render-model.ts';

test('preview applies scope, keyword and facets without changing import order', () => {
  const rows = [
    { id: '02', name: 'Uji B', values: { Kelas: 'IX-B' } },
    { id: '01', name: 'Uji A', values: { Kelas: 'IX-A' } },
  ];
  const selected = new Set(['01']);
  assert.deepEqual(filterPreview(rows, selected, 'all', ' UJI ', {}).map((row) => row.id), ['02', '01']);
  assert.deepEqual(filterPreview(rows, selected, 'selected', '', {}).map((row) => row.id), ['01']);
  assert.deepEqual(filterPreview(rows, selected, 'all', '02', { Kelas: 'IX-A' }), []);
  assert.deepEqual(filterPreview(rows, new Set(), 'selected', '', {}), []);
});
