'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { CardPreview } from './card-preview';
import { filterPreview, previewFilters } from '../../lib/cards/render-model';
import type { CardRenderModel, PreviewFilter, PreviewScope } from '../../lib/cards/render-model';
import type { Participant } from '../../lib/participants/model';

export function PreviewPanel({ participants, selected, renderCard, active }: {
  active: boolean;
  participants: Participant[];
  selected: ReadonlySet<string>;
  renderCard: (participant: Participant) => CardRenderModel;
}) {
  const [scope, setScope] = useState<PreviewScope>('selected');
  const [mode, setMode] = useState<'single' | 'batch'>('batch');
  const [query, setQuery] = useState('');
  const [facets, setFacets] = useState<Partial<Record<PreviewFilter, string>>>({});
  const [page, setPage] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => filterPreview(participants, selected, scope, deferredQuery, facets),
    [participants, selected, scope, deferredQuery, facets]);
  const size = mode === 'single' ? 1 : 9;
  const pages = Math.ceil(filtered.length / size);
  const current = Math.min(page, Math.max(0, pages - 1));
  const visible = filtered.slice(current * size, (current + 1) * size);

  return <div className="mt-4 grid min-w-0 gap-3">
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1">Cakupan
        <select value={scope} onChange={(event) => {
          setScope(event.target.value === 'all' ? 'all' : 'selected');
          setPage(0);
        }}>
          <option value="selected">Peserta terpilih</option>
          <option value="all">Semua peserta</option>
        </select>
      </label>
      <label className="grid gap-1">Tampilan
        <select value={mode} onChange={(event) => {
          setMode(event.target.value === 'single' ? 'single' : 'batch');
          setPage(0);
        }}>
          <option value="batch">Banyak kartu</option>
          <option value="single">Satu kartu</option>
        </select>
      </label>
      <label className="grid min-w-0 gap-1">Cari kartu
        <input className="max-w-full" value={query} placeholder="Nama atau ID peserta" onChange={(event) => {
          setQuery(event.target.value);
          setPage(0);
        }} />
      </label>
      {previewFilters.map((field) => {
        const values = [...new Set(participants.map((participant) => participant.values[field]).filter(Boolean))].sort();
        if (!values.length) return null;
        return <label key={field} className="grid min-w-0 gap-1">{field} pratinjau
          <select className="max-w-full" value={facets[field] ?? ''} onChange={(event) => {
            setFacets((previous) => ({ ...previous, [field]: event.target.value }));
            setPage(0);
          }}>
            <option value="">Semua</option>
            {values.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>;
      })}
    </div>
    <p role="status">{filtered.length} dari {participants.length} peserta ditampilkan{pages ? ` · Halaman ${current + 1}/${pages}` : ''}.</p>
    {!filtered.length && <p>{scope === 'selected' && !selected.size
      ? 'Belum ada peserta terpilih. Pilih peserta di Data Murid atau ubah cakupan.'
      : 'Tidak ada kartu yang cocok dengan pencarian dan filter.'}</p>}
    <div className="card-batch" aria-busy={query !== deferredQuery}>
      {active && visible.map((participant) => <CardPreview key={participant.id} {...renderCard(participant)} />)}
    </div>
    {pages > 1 && <nav className="flex flex-wrap gap-2" aria-label="Halaman pratinjau">
      <button type="button" className="action" disabled={current === 0} onClick={() => setPage(current - 1)}>Sebelumnya</button>
      <button type="button" className="action" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>Berikutnya</button>
    </nav>}
  </div>;
}
