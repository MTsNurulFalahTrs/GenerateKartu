import { customFields } from './preferences.ts';
import { customFieldIds } from '../participants/model.ts';
import type { CustomAppearance } from './preferences.ts';
import type { Field } from '../participants/model.ts';

export type CommunityFormat = CustomAppearance & { fields: Field[] };
export type CatalogFormat = CommunityFormat & { id: number; contributor?: string; createdAt?: string };
export type CommunityAttribution = { anonymous: boolean; contributorName: string };

export function parseCommunityAttribution(value: unknown): CommunityAttribution | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  // Backward compatibility for formats submitted before contributor confirmation existed.
  if (!Object.hasOwn(data, 'anonymous') && !Object.hasOwn(data, 'contributorName')) {
    return { anonymous: true, contributorName: 'Anonim' };
  }
  if (typeof data.anonymous !== 'boolean') return null;
  if (data.anonymous) return { anonymous: true, contributorName: 'Anonim' };
  if (!safeValue(data.contributorName, 60)) return null;
  return { anonymous: false, contributorName: data.contributorName.trim() };
}


const safeValue = (value: unknown, max: number): value is string =>
  typeof value === 'string' && !!value.trim() && value.trim().length <= max &&
  !/[\p{Cc}\p{Cf}]/u.test(value);

export function parseCommunityFormat(value: unknown): CommunityFormat | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const { name, fields, photoKey, mono, labels, excelHeaders } = data;
  const validFields = (items: unknown): items is Field[] => Array.isArray(items) &&
    items.every((item) => typeof item === 'string' && customFields.includes(item as Field)) &&
    new Set(items).size === items.length;
  if (!safeValue(name, 60) || !validFields(fields) || !fields.length || fields.length > 6 ||
    !fields.includes(photoKey as Field) || !validFields(mono) || mono.some((field) => !fields.includes(field))) return null;

  const selectedFields: Field[] = fields;

  function map(input: unknown, max: number): Partial<Record<Field, string>> | null {
    if (input === undefined) return {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const result: Partial<Record<Field, string>> = {};
    for (const [field, text] of Object.entries(input)) {
      if (!selectedFields.includes(field as Field) || !safeValue(text, max) ||
        (max === 64 && text.trim().toLowerCase() === 'password')) return null;
      result[field as Field] = text.trim();
    }
    return result;
  }
  const labelMap = map(labels, 60), headerMap = map(excelHeaders, 64);
  if (!labelMap || !headerMap || fields.some((field) =>
    customFieldIds.includes(field as typeof customFieldIds[number]) && (!labelMap[field] || !headerMap[field]))) return null;
  const allHeaders = fields.map((field) => (headerMap[field] ?? field).trim().toLocaleLowerCase('id'));
  if (new Set(allHeaders).size !== allHeaders.length) return null;
  return {
    name: name.trim(),
    fields,
    photoKey: photoKey as Field,
    mono: fields.filter((field) => mono.includes(field)),
    ...(Object.keys(labelMap).length ? { labels: labelMap } : {}),
    ...(Object.keys(headerMap).length ? { excelHeaders: headerMap } : {}),
  };
}
