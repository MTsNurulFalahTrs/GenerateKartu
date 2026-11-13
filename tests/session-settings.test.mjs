import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultCard } from '../lib/cards/settings.ts';
import { idleLimit } from '../lib/cards/preferences.ts';
import { packSessionCard, unpackSessionCard } from '../lib/cards/session-settings.ts';

test('save and reload KOP and schedule text in this tab session only', () => {
  const now = 10000000000;
  const card = { ...defaultCard, institution: 'Madrasah Uji', nip: 'NIP-SINTETIS',
    exam: 'Ujian Akhir', schedule: 'Senin — Matematika', width: 90 };
  const restored = unpackSessionCard(packSessionCard(card, now), now + 3000);
  assert.equal(restored?.institution, 'Madrasah Uji');
  assert.equal(restored?.nip, 'NIP-SINTETIS');
  assert.equal(restored?.schedule, 'Senin — Matematika');
  assert.equal('width' in restored, false, 'non-session preferences use localStorage');
  assert.equal(unpackSessionCard(packSessionCard(card, now), now + idleLimit), null);
  assert.equal(unpackSessionCard('not json', now), null);
  assert.equal(unpackSessionCard(JSON.stringify({ at: now, data: { ...card, institution: 'x'.repeat(161) } }), now), null);
});
