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
