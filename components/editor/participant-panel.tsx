'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultMapping, fieldsFor, photoFieldFor, validateRows } from '../../lib/participants/model';
import type { Field, Issue, Mapping, Participant, WorkbookRows } from '../../lib/participants/model';
import type { CustomAppearance } from '../../lib/cards/preferences';
import { newCardReference } from '../../lib/cards/qr';
import { EditorIcon } from './editor-icon';
import { PhotoPanel } from './photo-panel';
import type { WorkbookRequest } from '../../lib/participants/workbook.worker';

const MAX_FILE = 10 * 1024 * 1024;
const filters = ['Kelas', 'Ruang', 'Sesi'] as const;
const emptyExcelHeaders: Partial<Record<Field, string>> = {};
type WorkerResult =
  | { action: 'inspect'; names: string[] }
  | { action: 'read'; input: WorkbookRows }
  | { action: 'template'; template: ArrayBuffer }
  | { action: 'error'; message: string };

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string) {
  const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function ParticipantPanel({ active, format, custom, customPhotoKey, customAppearance, photos, onDataset, onPhotos }: {
  active: boolean;
  format: number | null;
  custom: readonly Field[];
  customPhotoKey?: Field;
  customAppearance?: CustomAppearance;
  photos: ReadonlyMap<string, Blob>;
  onDataset: (dataset: { participants: Participant[]; selected: Set<string> }) => void;
  onPhotos: (photos: Map<string, Blob>) => void;
}) {
  const importDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [sheet, setSheet] = useState('');
  const [input, setInput] = useState<WorkbookRows | null>(null);
  const [mapped, setMapped] = useState<{ schema: string; values: Mapping }>({ schema: '', values: {} });
  const [revision, setRevision] = useState(0);
  const [dataset, setDataset] = useState<{ format: number; schema: string; rows: Participant[] } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [facets, setFacets] = useState<Partial<Record<(typeof filters)[number], string>>>({});
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(0);
  const formatId = format ?? 0;
  const fields = fieldsFor(formatId, custom);
  const photoKey = photoFieldFor(formatId, customPhotoKey);
  const allowPasswords = formatId === 7 && custom.includes('Password');
  const excelHeaders = formatId === 7 ? customAppearance?.excelHeaders ?? emptyExcelHeaders : emptyExcelHeaders;
  const displayLabels = formatId === 7 ? customAppearance?.labels ?? {} : {};
  const schema = formatId === 7
    ? `7:${photoKey}:${JSON.stringify(fields.map((field) => [field, excelHeaders[field] || field]))}`
    : String(formatId);
  const mapping = useMemo(() => mapped.schema === schema ? mapped.values : defaultMapping(input?.headers ?? [], fields, excelHeaders, formatId === 7), [mapped, schema, input, fields, excelHeaders, formatId]);
  const validation = useMemo(() => input ? validateRows(input, formatId, mapping, custom, customPhotoKey) : null, [input, formatId, mapping, custom, customPhotoKey]);
  const participants = dataset?.schema === schema ? dataset?.rows : undefined;
  const rows = useMemo(() => (participants ?? []).filter((p) =>
    `${p.id} ${p.name}`.toLocaleLowerCase('id').includes(query.trim().toLocaleLowerCase('id')) &&
    filters.every((field) => !facets[field] || p.values[field] === facets[field]),
  ).sort((a, b) => (sort === 'id' ? a.id.localeCompare(b.id, 'id', { numeric: true }) : a.name.localeCompare(b.name, 'id'))), [participants, query, facets, sort]);

  useEffect(() => {
    onDataset({ participants: participants ?? [], selected: participants ? selected : new Set() });
  }, [onDataset, participants, selected]);

  useEffect(() => () => {
    worker.current?.terminate();
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const dialog = importDialog.current;
    if (!dialog) return;
    if (!active && dialog.open) dialog.close();
    if (active && names.length && !busy && !dialog.open) dialog.showModal();
  }, [active, names, busy]);

  function stop() {
    worker.current?.terminate();
    worker.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setBusy(false);
  }

  function send(current: Worker, request: WorkbookRequest) {
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    timer.current = setTimeout(() => {
      stop();
      setMessage('Waktu pemrosesan habis. Coba workbook yang lebih kecil.');
    }, 60000);
    current.postMessage(request);
  }

  function start(request: WorkbookRequest) {
    stop();
    setMessage('');
    const current = new Worker(new URL('../../lib/participants/workbook.worker.ts', import.meta.url));
    worker.current = current;
    current.onerror = () => {
      if (worker.current !== current) return;
      stop();
      setMessage('Pemrosesan Excel gagal. Coba ulangi.');
    };
    current.onmessage = ({ data }: MessageEvent<WorkerResult>) => {
      if (worker.current !== current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setBusy(false);
      if (data.action === 'error') {
        setMessage(data.message);
      } else if (data.action === 'inspect') {
        setNames(data.names);
        setSheet(data.names[0]);
        send(current, { action: 'read', sheet: data.names[0], allowPasswords });
      } else if (data.action === 'read') {
        setMapped({ schema, values: defaultMapping(data.input.headers, fields, excelHeaders, formatId === 7) });
        setInput(data.input);
      } else {
        download(new Blob([data.template], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `template-format-${formatId + 1}.xlsx`);
        if (request.action === 'template') stop();
      }
    };
    send(current, request);
  }

  function clearImport() {
    stop();
    setInput(null);
    setNames([]);
    setSheet('');
    setMessage('');
  }

  function closeImport() {
    clearImport();
    importDialog.current?.close();
    fileInput.current?.focus();
  }

  function choose(file: File) {
    setNames([]);
    setSheet('');
    setInput(null);
    if (file.size > MAX_FILE) {
      stop();
      setMessage('Ukuran berkas maksimum 10 MiB.');
      return;
    }
    start({ action: 'inspect', file });
  }

  function downloadIssues(issues: Issue[]) {
    const csv = [['Baris', 'Kolom', 'Perbaikan'], ...issues.map((issue) => [String(issue.row), issue.column, issue.message])]
      .map((row) => row.map(csvCell).join(',')).join('\r\n');
    download(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }), 'laporan-impor.csv');
  }

  function applyImport() {
    if (busy || !validation || validation.issues.length || format === null) return;
    onPhotos(new Map());
    setRevision((value) => value + 1);
    const imported = validation.participants.map((participant) => ({ ...participant, cardReference: newCardReference() }));
    setDataset({ format, schema, rows: imported });
    setSelected(new Set(validation.participants.map((p) => p.id)));
    setQuery('');
    setFacets({});
    setPage(0);
    closeImport();
  }

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (format === null) return <div className="panel"><p>Pilih format kartu untuk mengunduh templat atau mengimpor peserta.</p></div>;

  return (
    <div className="data-grid">
      <div className="panel data-excel">
        <div className="data-title"><span className="data-icon"><EditorIcon name="excel" /></span>
          <div><h2>1. Data Excel</h2><small>File Excel berisi data murid</small></div>
        </div>
        <div className="data-note"><strong>Kolom wajib di Excel:</strong>
          <div className="data-columns">{fields.map((field) => <code key={field}>{excelHeaders[field] || field}</code>)}</div>
        </div>
        <div className="grid gap-3">
          <button className="action data-download" type="button" disabled={busy} onClick={() => {
            if (worker.current && names.length) send(worker.current, { action: 'template', format, custom, excelHeaders });
            else start({ action: 'template', format, custom });
          }}>Unduh Template Aktif</button>
          <label className="data-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) choose(file);
          }}>
            <span className="data-icon"><EditorIcon name="upload" /></span>
            <strong>Klik atau seret file Excel ke sini</strong><small>Format: .xlsx atau .xls</small>
          <input ref={fileInput} aria-label="Berkas Excel peserta" className="sr-only" type="file" accept=".xlsx,.xls"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) choose(file);
              event.currentTarget.value = '';
            }} />
          </label>
        </div>
        {!names.length && busy && <p role="status">Memproses Excel… <button type="button" onClick={clearImport}>Batalkan</button></p>}
        {!names.length && message && <p role="alert">{message}</p>}
      </div>
      <dialog ref={importDialog} className="format-dialog import-dialog panel" aria-labelledby="participant-import-title"
        aria-describedby="participant-import-description"
        onCancel={(event) => { event.preventDefault(); closeImport(); }}>
        <header className="import-dialog-header">
          <span className="import-dialog-icon"><EditorIcon name="excel" /></span>
          <div className="import-dialog-heading">
            <h2 id="participant-import-title">Impor Data Murid</h2>
            <p id="participant-import-description">Periksa sheet, pemetaan kolom dan data sebelum diterapkan.</p>
          </div>
          <span className="import-dialog-private"><EditorIcon name="lock" /> Diproses lokal</span>
          <button type="button" className="action import-close" aria-label="Tutup impor data murid" onClick={closeImport}>×</button>
        </header>
        <div className="import-dialog-body">
          <ol className="import-steps" aria-label="Tahapan impor data">
            <li data-done={names.length > 0}><span>1</span> Pilih sheet</li>
            <li data-done={!!input}><span>2</span> Pemetaan</li>
            <li data-done={!!validation && validation.issues.length === 0}><span>3</span> Validasi</li>
          </ol>
          <p className="import-dialog-notice"><EditorIcon name="lock" />
            File Excel hanya dibaca di perangkat Anda. Tidak ada data murid yang diunggah ke server.</p>
          {busy && <div className="import-loading" role="status"><span className="import-spinner" />
            Memproses file dan menyiapkan pratinjau…</div>}
          {message && <p className="import-alert" role="alert">{message}</p>}
          {names.length > 0 && <label className="import-sheet-select">
            <span><strong>Sheet Excel</strong><small>Pilih lembar yang berisi data peserta.</small></span>
            <select id="participant-sheet" value={sheet} disabled={busy} onChange={(event) => {
            setSheet(event.target.value);
            setInput(null);
            setMessage('');
            if (worker.current) send(worker.current, { action: 'read', sheet: event.target.value, allowPasswords });
          }}>{names.map((name) => <option key={name}>{name}</option>)}</select></label>}
          {input && validation && (
            <div className="import-review">
              <dl className="import-summary">
                <div><dt>Baris data</dt><dd>{input.rows.length}</dd></div>
                <div><dt>Field format</dt><dd>{fields.length}</dd></div>
                <div data-error={validation.issues.length > 0}><dt>Perlu diperbaiki</dt><dd>{validation.issues.length}</dd></div>
              </dl>
              <div className="import-section-heading">
                <div><h3>2. Pemetaan Kolom</h3><p>Cocokkan field format dengan header pada file Excel Anda.</p></div>
                <span className="import-section-tag">{fields.filter((field) => mapping[field] !== undefined).length} / {fields.length} sesuai</span>
              </div>
              <div className="import-mapping-grid">
                {fields.map((field) => <label className="import-mapping-field" key={field}>
                  <span><strong>{displayLabels[field] || field}</strong>
                    <small>{mapping[field] !== undefined ? '✓ Kolom terpilih' : 'Perlu dipetakan'}</small></span>
                  <select aria-label={`Kolom Excel untuk ${displayLabels[field] || field}`}
                    aria-invalid={mapping[field] === undefined}
                    value={mapping[field] ?? ''} onChange={(event) => {
                  const value = event.target.value;
                  setMapped({ schema, values: { ...mapping, [field]: value === '' ? undefined : Number(value) } });
                }}>
                  <option value="">Pilih kolom</option>
                  {input.headers.map((header, index) => header.trim().toLowerCase() === 'password' && field !== 'Password' ? null :
                    <option key={index} value={index}>{header || 'Tanpa judul'} (kolom {index + 1})</option>)}
                </select></label>)}
              </div>
              <div className="import-section-heading">
                <div><h3>3. Pratinjau Data</h3><p>Lima baris pertama dari {input.rows.length} baris data.</p></div>
                <span className="import-section-tag">Pratinjau</span>
              </div>
              <div className="table-scroll import-preview-table" role="region" aria-label="Pratinjau impor Excel" tabIndex={0}>
                <table className="w-full text-left">
                  <thead><tr><th scope="col">Baris</th>{fields.map((field) => <th scope="col" className="px-2" key={field}>{displayLabels[field] || field}</th>)}</tr></thead>
                  <tbody>{input.rows.slice(0, 5).map((row) => <tr key={row.number}><td>{row.number}</td>{fields.map((field) => <td className="px-2 break-all" key={field}>{row.cells[mapping[field] ?? -1] || '—'}</td>)}</tr>)}</tbody>
                </table>
              </div>
              {validation.issues.length ? <div className="import-validation-error" role="alert">
                <h4>⚠ {validation.issues.length} masalah ditemukan</h4>
                <p>Perbaiki workbook atau pemetaan kolom, kemudian periksa ulang sebelum mengimpor.</p>
                <ul>{validation.issues.slice(0, 10).map((issue, index) =>
                  <li key={index}><strong>Baris {issue.row} · {issue.column}:</strong> {issue.message}</li>)}</ul>
                <button className="action" type="button" onClick={() => downloadIssues(validation.issues)}>
                  <EditorIcon name="download" /> Unduh Laporan Kesalahan
                </button>
              </div> : <div className="import-validation-ok" role="status"><span>✓</span>
                <div><strong>Data siap diimpor</strong>
                  <p>{validation.participants.length} murid telah lolos pemeriksaan dan siap digunakan pada kartu.</p></div>
              </div>}
            </div>
          )}
        </div>
        <footer className="import-dialog-actions">
          <span className="import-footer-status" role="status">
            {validation && !validation.issues.length ? `${validation.participants.length} murid siap diterapkan` :
              busy ? 'Sedang memproses…' : 'Periksa data sebelum mengimpor'}
          </span>
          <div className="import-footer-buttons">
            <button type="button" className="action" onClick={closeImport}>Batal</button>
            <button id="apply-participant-import" className="action data-next" type="button"
              disabled={busy || !validation || !!validation.issues.length} onClick={applyImport}>
              <EditorIcon name="table" /> {dataset ? 'Ganti Data Murid' : 'Terapkan Impor'}
            </button>
          </div>
        </footer>
      </dialog>
      {dataset && !participants && <p role="status">{dataset.format === formatId
        ? 'Format Kustom berubah. Impor ulang data murid untuk memakai kolom dan Acuan Foto yang baru.'
        : `Data tersimpan untuk Format ${dataset.format + 1}. Kembali ke format tersebut untuk melihatnya.`}</p>}
      <PhotoPanel key={revision} participants={participants} photoKey={photoKey} onPhotos={onPhotos} />
      <div className="panel data-wide data-preview">
        <header className="data-title"><span className="data-icon"><EditorIcon name="table" /></span>
          <div><h2>Preview Data Masuk</h2><small>Periksa data impor dan pilih peserta untuk dicetak.</small></div><span className="format-count">{participants?.length ?? 0} Murid</span>
        </header>
        {participants ? <div className="data-preview-controls">
        <div className="data-overview" role="status">
          <span><strong>{participants.length}</strong> Peserta</span>
          <span><strong>{rows.length}</strong> Hasil filter</span>
          <span><strong>{selected.size}</strong> Terpilih</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <label>Cari <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Nama atau ID" /></label>
          {filters.filter((field) => fields.some((candidate) => candidate === field)).map((field) => (
            <label key={field}>{field} <select value={facets[field] ?? ''} onChange={(event) => {
              setFacets((previous) => ({ ...previous, [field]: event.target.value }));
              setPage(0);
            }}>
              <option value="">Semua</option>
              {[...new Set(participants.map((p) => p.values[field]).filter(Boolean))].sort().map((value) => <option key={value}>{value}</option>)}
            </select></label>
          ))}
          <label>Urutkan <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }}>
            <option value="name">Nama A–Z</option><option value="id">ID naik</option>
          </select></label>
        </div>
        <div className="flex flex-wrap gap-2 my-3">
          <button className="action" type="button" disabled={!rows.length} onClick={() => setSelected((previous) => new Set([...previous, ...rows.map((p) => p.id)]))}>Pilih hasil filter</button>
          <button className="action" type="button" disabled={!selected.size} onClick={() => setSelected(new Set())}>Kosongkan pilihan</button>
        </div>
        {!rows.length && <p>Peserta tidak ditemukan.</p>}
        {rows.length > 25 && <div className="flex items-center gap-3 mt-3">
          <button type="button" className="action" disabled={page === 0} onClick={() => setPage(page - 1)}>Sebelumnya</button>
          <span>Halaman {page + 1} dari {Math.ceil(rows.length / 25)}</span>
          <button type="button" className="action" disabled={(page + 1) * 25 >= rows.length} onClick={() => setPage(page + 1)}>Berikutnya</button>
        </div>}
        </div> : null}
        <div className="table-scroll" role="region" aria-label="Daftar peserta" tabIndex={0}>
          <table className="w-full text-left">
            <thead><tr>{participants && <th scope="col">Pilih</th>}{fields.map((field) => <th scope="col" key={field}>{displayLabels[field] || field}</th>)}<th scope="col">Status Foto</th></tr></thead>
            <tbody>{participants ? rows.slice(page * 25, (page + 1) * 25).map((p) => <tr key={p.id}>
              <td><input type="checkbox" aria-label={`Pilih ${p.name} (${p.id})`} checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
              {fields.map((field) => <td key={field}>{p.values[field]}</td>)}
              <td><span className="data-photo-status" data-available={photos.has(p.id)}>{photos.has(p.id) ? 'Tersedia' : 'Belum ada'}</span></td>
            </tr>) : <tr><td colSpan={fields.length + 1}><div className="data-empty">
              <EditorIcon name="excel" /><strong>Data belum tersedia.</strong><small>Upload file Excel terlebih dahulu.</small>
            </div></td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
