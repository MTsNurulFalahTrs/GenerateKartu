import { defaultCard, kopFields, kopSizes } from './settings.ts';
import type { CardSettings } from './settings.ts';
import type { Field } from '../participants/model';

export const storageKey = 'generate-kartu:preferences:v1';
export const idleLimit = 2 * 60 * 60 * 1000;
export const maxBackupBytes = 1024 * 1024;
export const customFields: readonly Field[] = ['NoPeserta', 'NamaMurid', 'NISN', 'Kelas', 'Ruang', 'Sesi', 'Username', 'TglLahir', 'NamaSatdik'];
export const defaultCustom: Field[] = ['NoPeserta', 'NamaMurid', 'Kelas'];

const optionKeys = ['width', 'height', 'fontSize', 'align', 'monochrome', 'photo', 'qr', 'showSchedule'] as const;
const appearanceKeys = ['kopStyles', 'signatureSize', 'signatureOverlap'] as const;
const headingKeys = ['institution', 'exam', 'year'] as const;

export type Preferences = {
  schemaVersion: 1;
  dark: boolean;
  format: number | null;
  custom: Field[];
  hidden: Field[];
  settings: Pick<CardSettings, (typeof optionKeys)[number] | (typeof appearanceKeys)[number]>;
};
export type Heading = Pick<CardSettings, (typeof headingKeys)[number]>;

export function pickOptions(settings: CardSettings): Preferences['settings'] {
  const { width, height, fontSize, align, monochrome, photo, qr, showSchedule } = settings;
  return { width, height, fontSize, align, monochrome, photo, qr, showSchedule, kopStyles: settings.kopStyles, signatureSize: settings.signatureSize, signatureOverlap: settings.signatureOverlap };
}

export function pickHeading(settings: CardSettings): Heading {
  const { institution, exam, year } = settings;
  return { institution, exam, year };
}

function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error('Struktur backup tidak sesuai.');
  }
  return value as Record<string, unknown>;
}

function fields(value: unknown): value is Field[] {
  return Array.isArray(value) && value.length <= customFields.length &&
    value.every((field) => customFields.includes(field)) && new Set(value).size === value.length;
}

function between(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export function parseBackup(raw: string, allowHeading = true): { preferences: Preferences; heading?: Heading } {
  if (new TextEncoder().encode(raw).byteLength > maxBackupBytes) throw new Error('Ukuran backup maksimum 1 MiB.');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Berkas JSON rusak atau tidak valid.'); }
  const keys = ['schemaVersion', 'dark', 'format', 'custom', 'hidden', 'settings'];
  const hasHeading = allowHeading && !!parsed && typeof parsed === 'object' && Object.hasOwn(parsed, 'heading');
  const value = object(parsed, hasHeading ? [...keys, 'heading'] : keys);
  if (value.schemaVersion !== 1) throw new Error('Versi backup tidak didukung.');
  const hasAppearance = !!value.settings && typeof value.settings === 'object' &&
    appearanceKeys.some((key) => Object.hasOwn(value.settings as object, key));
  const options = object(value.settings, hasAppearance ? [...optionKeys, ...appearanceKeys] : optionKeys);
  const appearance = hasAppearance ? options : defaultCard;
  const styles = object(appearance.kopStyles, kopFields);
  for (const key of kopFields) {
    const style = object(styles[key], ['size', 'bold', 'italic']);
    if (!kopSizes.some((size) => size === style.size) || typeof style.bold !== 'boolean' || typeof style.italic !== 'boolean') {
      throw new Error('Format teks KOP tidak valid.');
    }
  }
  if (!between(appearance.signatureSize, 0.4, 2) || typeof appearance.signatureOverlap !== 'boolean') {
    throw new Error('Pengaturan tanda tangan tidak valid.');
  }
  if (typeof value.dark !== 'boolean' ||
    (value.format !== null && (!between(value.format, 0, 7) || !Number.isInteger(value.format))) ||
    !fields(value.custom) || !value.custom.includes('NoPeserta') || !value.custom.includes('NamaMurid') ||
    !fields(value.hidden) ||
    !between(options.width, 60, 180) || !between(options.height, 40, 150) || !between(options.fontSize, 6, 12) ||
    !['left', 'center', 'right'].includes(String(options.align)) || typeof options.align !== 'string' ||
    ['monochrome', 'photo', 'qr', 'showSchedule'].some((key) => typeof options[key] !== 'boolean')) {
    throw new Error('Nilai pengaturan backup tidak valid.');
  }
  const { schemaVersion, dark, format, custom, hidden } = value;
  const preferences = { schemaVersion, dark, format, custom, hidden, settings: { ...options, kopStyles: styles, signatureSize: appearance.signatureSize, signatureOverlap: appearance.signatureOverlap } } as Preferences;
  if (!hasHeading) return { preferences };
  const heading = object(value.heading, headingKeys);
  if (headingKeys.some((key) => typeof heading[key] !== 'string' || heading[key].length > 160)) {
    throw new Error('Kop backup tidak valid.');
  }
  return { preferences, heading: heading as Heading };
}
