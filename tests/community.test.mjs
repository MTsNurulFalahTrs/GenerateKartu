import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCommunityAttribution, parseCommunityFormat } from '../lib/cards/community.ts';

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


test('community contribution requires a valid name or explicit anonymity', () => {
  assert.deepEqual(parseCommunityAttribution({ anonymous: false, contributorName: '  Guru NF  ' }),
    { anonymous: false, contributorName: 'Guru NF' });
  assert.deepEqual(parseCommunityAttribution({ anonymous: true, contributorName: 'Rahasia' }),
    { anonymous: true, contributorName: 'Anonim' });
  assert.deepEqual(parseCommunityAttribution({ fields: [] }),
    { anonymous: true, contributorName: 'Anonim' });
  assert.equal(parseCommunityAttribution({ anonymous: false, contributorName: ' ' }), null);
  assert.equal(parseCommunityAttribution({ anonymous: false, contributorName: 'Nama\nTerlarang' }), null);
  assert.equal(parseCommunityAttribution({ anonymous: 'true', contributorName: 'Nama' }), null);
  assert.equal(parseCommunityAttribution({ contributorName: 'Nama' }), null);
  assert.equal(parseCommunityAttribution({ anonymous: false, contributorName: 'a'.repeat(61) }), null);
});
