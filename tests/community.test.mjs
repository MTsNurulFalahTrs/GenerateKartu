import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanContributorInput, parseCommunityAttribution, parseCommunityFormat, properContributorName, validCommunityName } from '../lib/cards/community.ts';

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

test('public community names accept only ASCII letters, numbers, minus and underscore', () => {
  for (const name of ['KARTU-1', 'Kartu_Ujian_2026', 'A', 'A'.repeat(60)]) assert.equal(validCommunityName(name), true);
  for (const name of ['Format Kustom', 'Nama.Baru', 'Nama!', '', 'A'.repeat(61), 'Kartué']) assert.equal(validCommunityName(name), false);
  const original = { name: 'Format Kustom', fields: ['NamaMurid'], photoKey: 'NamaMurid', mono: [] };
  assert.deepEqual(parseCommunityFormat(original), original, 'legacy catalog names remain readable');
  assert.equal(parseCommunityFormat(original, true), null, 'new publication rejects spaces');
  assert.ok(parseCommunityFormat({ ...original, name: 'Format_Kustom' }, true));
});

test('contributor names allow letters and spaces and become proper case', () => {
  assert.equal(cleanContributorInput('rANDY  pRATAMA 123!*'), 'Randy Pratama ');
  assert.equal(properContributorName('gURU uJI'), 'Guru Uji');
  assert.deepEqual(parseCommunityAttribution({ anonymous: false, contributorName: '  gURU uJI ' }),
    { anonymous: false, contributorName: 'Guru Uji' });
  for (const name of ['Guru123', 'Guru_B', 'Nama-Depan', 'Guru  Uji', '!guru', '123'])
    assert.equal(parseCommunityAttribution({ anonymous: false, contributorName: name }), null);
  assert.ok(parseCommunityAttribution({ anonymous: false, contributorName: 'Éka Putri' }));
});

test('Password can be selected as a field but cannot identify the photograph', () => {
  const value = {
    name: 'Kartu-Password_2026', fields: ['NoPeserta', 'NamaMurid', 'Password'],
    photoKey: 'NoPeserta', mono: ['Password'],
    labels: { Password: 'Sandi Ujian' }, excelHeaders: { Password: 'Password' },
  };
  assert.deepEqual(parseCommunityFormat(value, true), value);
  assert.equal(parseCommunityFormat({ ...value, photoKey: 'Password' }, true), null);
  assert.equal(parseCommunityFormat({ ...value, excelHeaders: { Password: 'Pwd', NamaMurid: 'Password' } }, true), null);
});
