'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { EditorIcon } from './editor-icon';
import { CardOutput } from './card-output';
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
  const [photo, setPhoto] = useState('');
  const [sort, setSort] = useState('excel');
  const [page, setPage] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => {
    const matches = filterPreview(participants, selected, scope, deferredQuery, facets).filter((participant) =>
      !photo || !!renderCard(participant).photo === (photo === 'with'));
    if (sort === 'name') matches.sort((a, b) => a.name.localeCompare(b.name, 'id', { numeric: true }));
    if (sort === 'number') matches.sort((a, b) => (a.values.NoPeserta || a.id).localeCompare(b.values.NoPeserta || b.id, 'id', { numeric: true }));
    return matches;
  }, [participants, selected, scope, deferredQuery, facets, photo, sort, renderCard]);
  const classCounts = new Map<string, number>();
  for (const participant of participants) {
    const name = participant.values.Kelas;
    if (name && (scope === 'all' || selected.has(participant.id))) {
      classCounts.set(name, (classCounts.get(name) ?? 0) + 1);
    }
  }

  function selectFacet(field: PreviewFilter, value: string) {
    setFacets((previous) => ({ ...previous, [field]: value }));
    setPage(0);
  }

  const filterOptions = useMemo(() => previewFilters.map((field) => ({
    field, values: [...new Set(participants.map((participant) => participant.values[field]).filter(Boolean))].sort(),
  })), [participants]);
  const size = mode === 'single' ? 1 : 9;
  const pages = Math.ceil(filtered.length / size);
  const current = Math.min(page, Math.max(0, pages - 1));
  const visible = filtered.slice(current * size, (current + 1) * size);

  return <div className="print-workspace">
    <CardOutput participants={filtered} renderCard={renderCard} pending={query !== deferredQuery} />
    <label className="print-search">
      <EditorIcon name="search" />
      <span className="sr-only">Cari nama, NISN, atau nomor peserta</span>
      <input value={query} placeholder="Cari nama, NISN, atau no. peserta…" onChange={(event) => {
        setQuery(event.target.value);
        setPage(0);
      }} />
    </label>
    {!!classCounts.size && <div className="print-chips" role="group" aria-label="Filter cepat kelas">
      {[['', scope === 'all' ? participants.length : selected.size] as const, ...classCounts].map(([name, count]) =>
        <button key={name} type="button" className="action" aria-pressed={(facets.Kelas ?? '') === name}
          onClick={() => selectFacet('Kelas', name)}>{name || 'Semua'} <span>{count}</span></button>)}
    </div>}
    <div className="panel print-filters">
      <strong><EditorIcon name="filter" /> Filter Cetak</strong>
      {filterOptions.map(({ field, values }) => <label key={field}>{field}
        <select id={`preview-${field}`} value={facets[field] ?? ''} onChange={(event) => selectFacet(field, event.target.value)}>
          <option value="">Semua {field}</option>
          {values.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>)}
      <label>Foto<select value={photo} onChange={(event) => { setPhoto(event.target.value); setPage(0); }}>
        <option value="">Semua Murid</option><option value="with">Dengan foto</option><option value="without">Tanpa foto</option>
      </select></label>
      <label>Sortir<select value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }}>
        <option value="excel">Urutan Excel</option><option value="name">Nama A–Z</option><option value="number">Nomor peserta</option>
      </select></label>
      <button className="action" type="button" onClick={() => {
        setQuery(''); setFacets({}); setPhoto(''); setSort('excel'); setScope('selected'); setMode('batch'); setPage(0);
      }}>Reset</button>
      <span className="print-count" role="status">{filtered.length} dari {participants.length} kartu{pages ? ` · Halaman ${current + 1}/${pages}` : ''}</span>
      <details className="print-view-options">
        <summary>Opsi tampilan</summary>
        <div>
          <label>Cakupan<select value={scope} onChange={(event) => { setScope(event.target.value === 'all' ? 'all' : 'selected'); setPage(0); }}>
            <option value="selected">Peserta terpilih</option><option value="all">Semua peserta</option>
          </select></label>
          <label>Tampilan<select value={mode} onChange={(event) => { setMode(event.target.value === 'single' ? 'single' : 'batch'); setPage(0); }}>
            <option value="batch">Banyak kartu</option><option value="single">Satu kartu</option>
          </select></label>
        </div>
      </details>
    </div>
    {!filtered.length && <p>{scope === 'selected' && !selected.size
      ? 'Belum ada peserta terpilih. Pilih peserta di Data Murid atau ubah cakupan.'
      : 'Tidak ada kartu yang cocok dengan pencarian dan filter.'}</p>}
    <div className="card-batch print-card-grid" aria-busy={query !== deferredQuery}>
      {active && visible.map((participant) => <CardPreview key={participant.id} {...renderCard(participant)} />)}
    </div>
    {pages > 1 && <nav className="flex flex-wrap gap-2" aria-label="Halaman pratinjau">
      <button type="button" className="action" disabled={current === 0} onClick={() => setPage(current - 1)}>Sebelumnya</button>
      <button type="button" className="action" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>Berikutnya</button>
    </nav>}
  </div>;
}
