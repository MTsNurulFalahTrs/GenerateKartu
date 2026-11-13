import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCommunityFormat } from '../lib/cards/community.ts';

test('community format preserves safe built-in and manual field metadata', () => {
  const candidate = {
    name: 'Kartu Ujian Kustom',
    fields: ['NoPeserta', 'NamaMurid', 'Custom1'],
    photoKey: 'NoPeserta',
    mono: ['Custom1'],
    labels: { NoPeserta: 'Nomor Peserta', NamaMurid: 'Nama Murid', Custom1: 'Nomor Bangku' },
    excelHeaders: { NoPeserta: 'NoPeserta', NamaMurid: 'NamaMurid', Custom1: 'NomorBangku' },
  };
  assert.deepEqual(parseCommunityFormat(candidate), candidate);
  assert.equal(parseCommunityFormat({ ...candidate, excelHeaders: { ...candidate.excelHeaders, Custom1: 'Password' } }), null);
  assert.equal(parseCommunityFormat({ ...candidate, labels: { ...candidate.labels, Custom1: '' } }), null);
  assert.equal(parseCommunityFormat({ ...candidate, excelHeaders: { NoPeserta: 'Duplikat', NamaMurid: 'Duplikat', Custom1: 'NomorBangku' } }), null);
  assert.equal(parseCommunityFormat({ ...candidate, fields: ['NoPeserta', 'Custom1'], labels: { NoPeserta: 'No. Peserta' } }), null);
});

test('community parser supports legacy built-in-only definitions', () => {
  const candidate = { name: 'Format Lama', fields: ['NoPeserta', 'NamaMurid'], photoKey: 'NoPeserta', mono: [] };
  assert.deepEqual(parseCommunityFormat(candidate), candidate);
  assert.equal(parseCommunityFormat({ ...candidate, fields: ['NoPeserta', 'Password'] }), null);
  assert.equal(parseCommunityFormat({ ...candidate, name: '\u0001' }), null);
});
