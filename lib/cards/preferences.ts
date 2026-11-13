import { defaultCard, kopFields, kopSizes } from './settings.ts';
import type { CardSettings } from './settings.ts';
import { customFieldIds } from '../participants/model.ts';
import type { Field } from '../participants/model';

export const storageKey = 'generate-kartu:preferences:v1';
export const idleLimit = 2 * 60 * 60 * 1000;
export const maxBackupBytes = 1024 * 1024;
export const customFields: readonly Field[] = ['NoPeserta', 'NamaMurid', 'NISN', 'Kelas', 'Ruang', 'Sesi', 'Username', 'TglLahir', 'NamaSatdik', ...customFieldIds];
export const defaultCustom: Field[] = ['NoPeserta', 'NamaMurid', 'Kelas'];

const optionKeys = ['width', 'height', 'fontSize', 'align', 'monochrome', 'photo', 'qr', 'showSchedule'] as const;
const appearanceKeys = ['kopStyles', 'signatureSize', 'signatureOverlap'] as const;
const headingKeys = ['institution', 'exam', 'year'] as const;

export type CustomAppearance = {
  name: string;
  photoKey: Field;
  mono: Field[];
  labels?: Partial<Record<Field, string>>;
  excelHeaders?: Partial<Record<Field, string>>;
};

export type Preferences = {
  schemaVersion: 1;
  dark: boolean;
  format: number | null;
  custom: Field[];
  customAppearance?: CustomAppearance;
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
  if (hasHeading) keys.push('heading');
  if (parsed && typeof parsed === 'object' && Object.hasOwn(parsed, 'customAppearance')) keys.push('customAppearance');
  const value = object(parsed, keys);
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
    !fields(value.custom) ||
    !fields(value.hidden) ||
    !between(options.width, 60, 180) || !between(options.height, 40, 150) || !between(options.fontSize, 6, 12) ||
    !['left', 'center', 'right'].includes(String(options.align)) || typeof options.align !== 'string' ||
    ['monochrome', 'photo', 'qr', 'showSchedule'].some((key) => typeof options[key] !== 'boolean')) {
    throw new Error('Nilai pengaturan backup tidak valid.');
  }
  const { schemaVersion, dark, format, custom, hidden } = value;
  let customAppearance: CustomAppearance | undefined;
  if (keys.includes('customAppearance')) {
    const rawAppearance = value.customAppearance as Record<string, unknown>;
    const hasLabels = !!rawAppearance && Object.hasOwn(rawAppearance, 'labels');
    const hasHeaders = !!rawAppearance && Object.hasOwn(rawAppearance, 'excelHeaders');
    const appearance = object(value.customAppearance,
      ['name', 'photoKey', 'mono', ...(hasLabels ? ['labels'] : []), ...(hasHeaders ? ['excelHeaders'] : [])]);
    if (typeof appearance.name !== 'string' || !appearance.name.trim() || appearance.name.length > 60 ||
      !customFields.some((field) => field === appearance.photoKey && (custom as Field[]).includes(field)) ||
      !fields(appearance.mono) || !appearance.mono.every((field) => (custom as Field[]).includes(field)) ||
      (custom as Field[]).length > 6) throw new Error('Format kustom tidak valid.');
    for (const [key, prop] of [['labels', 60], ['excelHeaders', 64]] as const) {
      if (!Object.hasOwn(appearance, key)) continue;
      const values = appearance[key];
      if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Metadata format kustom tidak valid.');
      for (const [field, text] of Object.entries(values)) {
        if (!customFields.includes(field as Field) || !(custom as Field[]).includes(field as Field) ||
          typeof text !== 'string' || !text.trim() || text.trim().length > prop ||
          (key === 'excelHeaders' && text.trim().toLowerCase() === 'password')) {
          throw new Error('Metadata format kustom tidak valid.');
        }
      }
    }
    if ((custom as Field[]).some((field) => customFieldIds.includes(field as typeof customFieldIds[number]) &&
      (!appearance.labels || typeof (appearance.labels as Record<string, string>)[field] !== 'string' ||
       !appearance.excelHeaders || typeof (appearance.excelHeaders as Record<string, string>)[field] !== 'string'))) {
      throw new Error('Kolom buatan sendiri harus memiliki label dan header Excel.');
    }
    customAppearance = appearance as CustomAppearance;
  } else if (!(custom as Field[]).includes('NoPeserta') || !(custom as Field[]).includes('NamaMurid') ||
    (custom as Field[]).some((field) => customFieldIds.includes(field as typeof customFieldIds[number]))) {
    throw new Error('Format kustom tidak valid.');
  }
  const preferences = { schemaVersion, dark, format, custom, customAppearance, hidden, settings: { ...options, kopStyles: styles, signatureSize: appearance.signatureSize, signatureOverlap: appearance.signatureOverlap } } as Preferences;
  if (!hasHeading) return { preferences };
  const heading = object(value.heading, headingKeys);
  if (headingKeys.some((key) => typeof heading[key] !== 'string' || heading[key].length > 160)) {
    throw new Error('Kop backup tidak valid.');
  }
  return { preferences, heading: heading as Heading };
}
