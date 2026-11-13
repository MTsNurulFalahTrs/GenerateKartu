import type { CardSettings, ScheduleTable } from './settings.ts';
import { idleLimit } from './preferences.ts';

export const sessionCardKey = 'generate-kartu:card-session:v1';
const textKeys = ['institution', 'exam', 'year', 'address', 'city', 'date', 'signer', 'nip', 'schedule'] as const;
type SessionCardData = Pick<CardSettings, (typeof textKeys)[number] | 'scheduleTable'>;

export function packSessionCard(card: CardSettings, at = Date.now()): string {
  const data = Object.fromEntries(textKeys.map((key) => [key, card[key]])) as Omit<SessionCardData, 'scheduleTable'>;
  return JSON.stringify({ at, data: { ...data, scheduleTable: card.scheduleTable } });
}

function validSchedule(value: unknown): value is ScheduleTable | null {
  if (value === null) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.columns) || !Array.isArray(data.rows) || data.columns.length > 10 ||
    typeof data.rowCount !== 'number' || !Number.isInteger(data.rowCount) || data.rowCount < 0 ||
    data.rowCount > 100 || data.rows.length > 100) return false;
  return data.columns.every((v: unknown) => typeof v === 'string' && v.length <= 120) &&
    data.rows.every((row: unknown) => Array.isArray(row) && row.length <= 10 &&
      row.every((cell: unknown) => typeof cell === 'string' && cell.length <= 160));
}

export function unpackSessionCard(raw: string, now = Date.now()): SessionCardData | null {
  if (raw.length > 100_000) return null;
  let record: unknown;
  try { record = JSON.parse(raw); } catch { return null; }
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const { at, data } = record as Record<string, unknown>;
  if (typeof at !== 'number' || !Number.isFinite(at) || at > now || now - at >= idleLimit ||
    !data || typeof data !== 'object' || Array.isArray(data)) return null;
  const current = data as Record<string, unknown>;
  for (const key of textKeys) {
    const value = current[key];
    if (typeof value !== 'string' || value.length > (key === 'schedule' ? 8000 : 160) ||
      /[\p{Cc}\p{Cf}]/u.test(value.replace(/\n/g, ''))) return null;
  }
  if (!validSchedule(current.scheduleTable)) return null;
  return current as SessionCardData;
}
