import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultCard } from '../lib/cards/settings.ts';
import { defaultCustom, pickOptions, pickHeading, parseBackup } from '../lib/cards/preferences.ts';

const preferences = {
  schemaVersion: 1, dark: true, format: 7, custom: defaultCustom, hidden: ['Kelas'],
  settings: pickOptions({ ...defaultCard, width: 100, nip: 'Rahasia', signer: 'Pejabat Uji' }),
};

test('preferences round-trip, with explicit opt-in for allowed heading metadata', () => {
  const heading = pickHeading({ ...defaultCard, institution: 'Madrasah Uji', nip: 'Rahasia' });
  assert.deepEqual(parseBackup(JSON.stringify(preferences), false), { preferences });
  assert.deepEqual(parseBackup(JSON.stringify({ ...preferences, heading })), { preferences, heading });
  assert.throws(() => parseBackup(JSON.stringify({ ...preferences, heading }), false));
  assert.doesNotMatch(JSON.stringify({ ...preferences, heading }), /Rahasia|Pejabat Uji/);
});

test('rejects malformed, unsupported, oversized and sensitive backup payloads', () => {
  for (const raw of [
    '{', 'null', 'x'.repeat(1024 * 1024 + 1),
    JSON.stringify({ ...preferences, schemaVersion: 2 }),
    JSON.stringify({ ...preferences, participants: [] }),
    JSON.stringify({ ...preferences, settings: { ...preferences.settings, width: 181 } }),
    JSON.stringify({ ...preferences, heading: { institution: '', exam: '', year: '', nip: '123' } }),
    JSON.stringify({ ...preferences, custom: ['NamaMurid', 'NamaMurid'] }),
  ]) assert.throws(() => parseBackup(raw));
});

test('restores pre-KOP preferences and validates new appearance settings', () => {
  const legacy = { ...preferences.settings };
  delete legacy.kopStyles;
  delete legacy.signatureSize;
  delete legacy.signatureOverlap;
  assert.deepEqual(parseBackup(JSON.stringify({ ...preferences, settings: legacy })).preferences, preferences);
  assert.throws(() => parseBackup(JSON.stringify({ ...preferences, settings: { ...preferences.settings, signatureSize: 3 } })));
});


test('custom format retains display labels and Excel headers while rejecting sensitive mappings', () => {
  const configured = {
    ...preferences,
    custom: ['NoPeserta', 'NamaMurid', 'Custom1'],
    customAppearance: {
      name: 'Kartu Ujian Kustom', photoKey: 'NoPeserta', mono: ['Custom1'],
      labels: { NoPeserta: 'No. Peserta', NamaMurid: 'Nama Murid', Custom1: 'Nomor Bangku' },
      excelHeaders: { NoPeserta: 'NoPeserta', NamaMurid: 'NamaMurid', Custom1: 'NomorBangku' },
    },
  };
  assert.deepEqual(parseBackup(JSON.stringify(configured)).preferences, configured);
  const bad = (appearance) => JSON.stringify({ ...configured, customAppearance: appearance });
  assert.throws(() => parseBackup(bad({ ...configured.customAppearance, excelHeaders: { Custom1: 'Password' } })));
  assert.throws(() => parseBackup(bad({ ...configured.customAppearance, labels: { Custom1: '' } })));
  assert.throws(() => parseBackup(bad({ ...configured.customAppearance, excelHeaders: { Custom1: 'NomorBangku', Unlisted: 'Kolom' } })));
  assert.throws(() => parseBackup(JSON.stringify({ ...configured, customAppearance: undefined })));
});

test('custom Password field persists only as field and label metadata', () => {
  const custom = ['NoPeserta', 'NamaMurid', 'Password'];
  const backup = {
    ...preferences, custom,
    customAppearance: {
      name: 'Kartu_Password', photoKey: 'NoPeserta', mono: ['Password'],
      labels: { Password: 'Sandi Ujian' }, excelHeaders: { Password: 'Password' },
    },
  };
  assert.deepEqual(parseBackup(JSON.stringify(backup)).preferences.custom, custom);
  assert.throws(() => parseBackup(JSON.stringify({
    ...backup, customAppearance: { ...backup.customAppearance, photoKey: 'Password' },
  })), /kustom/);
  assert.throws(() => parseBackup(JSON.stringify({
    ...backup, customAppearance: {
      ...backup.customAppearance, excelHeaders: { Password: 'Pwd', NamaMurid: 'Password' },
    },
  })), /Metadata/);
});
