import type { CardSettings, InstitutionAssets } from './settings';
import type { Field, Participant } from '../participants/model';

export const previewFilters = ['Kelas', 'Ruang', 'Sesi'] as const;
export type PreviewFilter = (typeof previewFilters)[number];
export type PreviewScope = 'all' | 'selected';

export type CardRenderModel = {
  format: number;
  custom: readonly Field[];
  participant: Participant;
  photo?: Blob;
  settings: CardSettings;
  assets: InstitutionAssets;
  hidden: readonly Field[];
};

export function filterPreview(
  participants: readonly Participant[],
  selected: ReadonlySet<string>,
  scope: PreviewScope,
  query: string,
  facets: Partial<Record<PreviewFilter, string>>,
) {
  const keyword = query.trim().toLocaleLowerCase('id');
  return participants.filter((participant) =>
    (scope === 'all' || selected.has(participant.id)) &&
    `${participant.id} ${participant.name}`.toLocaleLowerCase('id').includes(keyword) &&
    previewFilters.every((field) => !facets[field] || participant.values[field] === facets[field]),
  );
}
