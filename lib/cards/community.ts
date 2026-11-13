import { customFields } from './preferences';
import type { CustomAppearance } from './preferences';
import type { Field } from '../participants/model';

export type CommunityFormat = CustomAppearance & { fields: Field[] };
export type CatalogFormat = CommunityFormat & { id: number };

export function parseCommunityFormat(value: unknown): CommunityFormat | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { name, fields, photoKey, mono } = value as Record<string, unknown>;
  const validFields = (items: unknown): items is Field[] => Array.isArray(items) &&
    items.every((item) => customFields.includes(item)) && new Set(items).size === items.length;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 60 ||
    /[\p{Cc}\p{Cf}]/u.test(name) || !validFields(fields) || !fields.length || fields.length > 6 ||
    !fields.includes(photoKey as Field) || !validFields(mono) || mono.some((field) => !fields.includes(field))) return null;
  return { name: name.trim(), fields, photoKey: photoKey as Field, mono: fields.filter((field) => mono.includes(field)) };
}
