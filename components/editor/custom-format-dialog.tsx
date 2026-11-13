import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { customFieldIds } from '../../lib/participants/model';
import { findDuplicateExcelColumns } from '../../lib/cards/custom-format-order';
import type { Field } from '../../lib/participants/model';
import type { CustomAppearance } from '../../lib/cards/preferences';
import { EditorIcon } from './editor-icon';
import { CommunityShareDialog } from './community-share-dialog';
import { validCommunityName } from '../../lib/cards/community';
import type { CommunityAttribution } from '../../lib/cards/community';

function publicName(value: string) {
  return value.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60);
}

const maxRows = 6;
const builtInOptions: { value: Field; label: string }[] = [
  { value: 'NamaMurid', label: 'Nama Murid' },
  { value: 'NISN', label: 'NISN' },
  { value: 'NoPeserta', label: 'No. Peserta' },
  { value: 'Kelas', label: 'Kelas' },
  { value: 'Ruang', label: 'Ruang' },
  { value: 'TglLahir', label: 'Tgl. Lahir' },
  { value: 'Sesi', label: 'Sesi' },
  { value: 'Username', label: 'Username' },
  { value: 'Password', label: 'Password' },
  { value: 'NamaSatdik', label: 'Nama Satdik' },
];

type FormatRow = {
  id: string;
  field: Field | '';
  label: string;
  excel: string;
  mono: boolean;
};

export function CustomFormatDialog({ fields, appearance, labels, onSave, onClose }: {
  fields: readonly Field[];
  appearance?: CustomAppearance;
  labels: Record<Field, string>;
  onSave: (fields: Field[], appearance: CustomAppearance, attribution?: CommunityAttribution) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const sequence = useRef(Math.max(fields.length, 3));
  const [rows, setRows] = useState<FormatRow[]>(() => fields.length
    ? fields.map((field, index) => ({
      id: 'row-' + (index + 1),
      field,
      label: appearance?.labels?.[field] || labels[field],
      excel: appearance?.excelHeaders?.[field] || field,
      mono: appearance?.mono.includes(field) ?? false,
    }))
    : [
      { id: 'row-1', field: 'NamaMurid', label: labels.NamaMurid, excel: 'NamaMurid', mono: false },
      { id: 'row-2', field: '', label: '', excel: '', mono: false },
      { id: 'row-3', field: '', label: '', excel: '', mono: false },
    ]);
  const [name, setName] = useState(appearance?.name ?? 'Format Kustom');
  const [photoRow, setPhotoRow] = useState(() => {
    const selected = fields.findIndex((field) => field === appearance?.photoKey);
    return 'row-' + (selected < 0 ? 1 : selected + 1);
  });
  const [error, setError] = useState('');
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingShare, setPendingShare] = useState<{ fields: Field[]; appearance: CustomAppearance }>();
  const [shareError, setShareError] = useState('');
  const duplicateExcelColumns = findDuplicateExcelColumns(rows);

  useEffect(() => { dialog.current?.showModal(); }, []);

  function setField(id: string, selection: string) {
    setRows((previous) => {
      const current = previous.find((row) => row.id === id);
      if (!current) return previous;
      let next: Field | '' = '';
      if (selection === 'manual') {
        next = customFieldIds.find((field) =>
          field === current.field || !previous.some((row) => row.field === field)) ?? '';
      } else if (selection && builtInOptions.some((option) => option.value === selection)) {
        const candidate = selection as Field;
        if (previous.some((row) => row.id !== id && row.field === candidate)) return previous;
        next = candidate;
      }
      return previous.map((row) => row.id === id ? ({
        ...row,
        field: next,
        label: next === current.field ? current.label : next && !customFieldIds.includes(next as typeof customFieldIds[number]) ? labels[next] : '',
        excel: next === current.field ? current.excel : next && !customFieldIds.includes(next as typeof customFieldIds[number]) ? next : '',
        mono: next === current.field && current.mono,
      }) : row);
    });
    setError('');
  }

  function updateRow(id: string, change: Partial<Pick<FormatRow, 'label' | 'excel' | 'mono'>>) {
    setRows((previous) => previous.map((row) => row.id === id ? { ...row, ...change } : row));
    setError('');
  }

  function move(index: number, delta: -1 | 1) {
    setError('');
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    setRows((previous) => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addRow() {
    if (rows.length >= maxRows) return;
    setRows((previous) => [...previous, { id: 'row-' + ++sequence.current, field: '', label: '', excel: '', mono: false }]);
    setError('');
  }

  function removeRow(id: string) {
    setRows((previous) => previous.filter((row) => row.id !== id));
    if (photoRow === id) setPhotoRow(rows.find((row) => row.id !== id)?.id ?? '');
    setError('');
  }

  async function commit(fields: Field[], appearance: CustomAppearance, attribution?: CommunityAttribution) {
    setSaving(true);
    setShareError('');
    setError('');
    try {
      await onSave(fields, appearance, attribution);
      setPendingShare(undefined);
      dialog.current?.close();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Format belum berhasil disimpan.';
      if (attribution) setShareError(message);
      else setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || pendingShare) return;
    const selected = rows.filter((row) => row.field !== '');
    const duplicated = findDuplicateExcelColumns(rows);
    if (duplicated.size) {
      const first = [...duplicated.entries()][0];
      setError('Kolom Excel pada baris ' + first[1].join(' dan ') +
        ' sama. Setiap baris harus menggunakan header Excel yang unik; urutan 1–6 mengikuti posisi baris.');
      return;
    }
    if (!name.trim() || !rows.length || rows.length > maxRows || selected.length !== rows.length ||
      selected.some((row) => !row.label.trim() || !row.excel.trim() ||
        row.label.trim().length > 60 || row.excel.trim().length > 64 ||
        (row.excel.trim().toLowerCase() === 'password' && row.field !== 'Password')) ||
      new Set(selected.map((row) => row.field)).size !== selected.length ||
      new Set(selected.map((row) => row.excel.trim().toLowerCase())).size !== selected.length ||
      !selected.some((row) => row.id === photoRow && row.field !== 'Password')) {
      setError('Lengkapi setiap Field Bawaan, Label Tampilan, dan Kolom Excel (maks. 6 baris). Gunakan kolom Excel yang berbeda dan pilih satu Acuan Foto selain Password.');
      return;
    }
    const entries = selected as (FormatRow & { field: Field })[];
    const fields = entries.map((row) => row.field);
    const photoKey = entries.find((row) => row.id === photoRow)!.field;
    const appearance: CustomAppearance = {
      name: name.trim(),
      photoKey,
      mono: entries.filter((row) => row.mono).map((row) => row.field),
      labels: Object.fromEntries(entries.map((row) => [row.field, row.label.trim()])),
      excelHeaders: Object.fromEntries(entries.map((row) => [row.field, row.excel.trim()])),
    };
    setError('');
    if (share) {
      if (!validCommunityName(appearance.name)) {
        setError('Nama format komunitas hanya boleh huruf, angka, minus (-), dan underscore (_), tanpa spasi.');
        return;
      }
      setSaving(true);
      try {
        const response = await fetch('/api/community-formats?name=' + encodeURIComponent(appearance.name), {
          cache: 'no-store', signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error('Pemeriksaan nama format belum tersedia. Coba lagi.');
        const result: { exists: boolean } = await response.json();
        if (result.exists) {
          setError('Nama format sudah digunakan di komunitas. Gunakan nama lain.');
          return;
        }
        setShareError('');
        setPendingShare({ fields, appearance });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Nama format belum dapat diperiksa.');
      } finally {
        setSaving(false);
      }
    } else {
      void commit(fields, appearance);
    }
  }

  return <><dialog ref={dialog} className="format-dialog custom-format-dialog" aria-labelledby="custom-format-title" onClose={onClose}
    onCancel={(event) => { if (saving) event.preventDefault(); }}>
    <header>
      <span className="format-icon"><EditorIcon name="edit" /></span>
      <div><h2 id="custom-format-title">Buat Format Kustom</h2>
        <p>Tentukan sendiri field yang tampil di kartu ujian (maks. 6 baris)</p></div>
      <button className="action custom-format-close" type="button" disabled={saving} aria-label="Tutup Format Kustom"
        onClick={() => dialog.current?.close()}>×</button>
    </header>
    <form onSubmit={save} aria-busy={saving}>
      <div className="custom-format-body">
        <label className="custom-format-name">Nama Format
          <input required maxLength={60} value={name} onChange={(event) => setName(share ? publicName(event.currentTarget.value) : event.currentTarget.value)} />
          {share && <small className="custom-public-name-help">Hanya huruf, angka, minus (-) dan underscore (_). Nama harus unik di komunitas.</small>}
        </label>
        <div className="custom-format-fields-heading">
          <div><h3>Field yang Tampil di Kartu</h3>
            <p>Urutan kartu mengikuti posisi baris. Setiap Kolom Excel harus unik, termasuk huruf besar/kecil.</p></div>
          <span className="format-count" aria-live="polite">{rows.length} / {maxRows}</span>
          <button className="action custom-add" type="button" disabled={rows.length >= maxRows} onClick={addRow}>
            <span aria-hidden="true">＋</span> Tambah Baris
          </button>
        </div>
        {rows.length ? <ol className="custom-format-rows">
          {rows.map((row, index) => <li key={row.id} data-photo={photoRow === row.id}>
            <div className="custom-row-order">
              <button type="button" className="custom-row-move" disabled={index === 0}
                aria-label={`Naikkan ${row.field ? labels[row.field] : 'baris ' + (index + 1)}`}
                onClick={() => move(index, -1)}>⌃</button>
              <span aria-hidden="true" className="custom-row-number">{index + 1}</span>
              <button type="button" className="custom-row-move" disabled={index === rows.length - 1}
                aria-label={`Turunkan ${row.field ? labels[row.field] : 'baris ' + (index + 1)}`}
                onClick={() => move(index, 1)}>⌄</button>
            </div>
            <label className="custom-row-field">
              <span className="custom-row-caption">Field Bawaan</span>
              <select aria-label={`Field Bawaan baris ${index + 1}`}
                value={customFieldIds.some((field) => field === row.field) ? 'manual' : row.field}
                onChange={(event) => setField(row.id, event.currentTarget.value)}>
                <option value="">— Pilih —</option>
                {builtInOptions.map((option) => <option key={option.value} value={option.value}
                  disabled={rows.some((candidate) => candidate.id !== row.id && candidate.field === option.value)}>
                  {option.label}
                </option>)}
                <option value="manual">-- Tulis Sendiri</option>
              </select>
            </label>
            <label className="custom-row-field">
              <span className="custom-row-caption">Label Tampilan</span>
              <input type="text" maxLength={60} placeholder="e.g. Nama Murid"
                aria-label={`Label Tampilan baris ${index + 1}`} value={row.label}
                onChange={(event) => updateRow(row.id, { label: event.currentTarget.value })} />
            </label>
            <label className="custom-row-field">
              <span className="custom-row-caption">Kolom Excel <small>(header .xlsx)</small></span>
              <input type="text" maxLength={64} placeholder="e.g. NamaMurid"
                aria-label={`Kolom Excel baris ${index + 1}`} value={row.excel}
                aria-invalid={duplicateExcelColumns.has(row.id)}
                aria-describedby={duplicateExcelColumns.has(row.id) ? 'custom-excel-error-' + row.id : undefined}
                onChange={(event) => updateRow(row.id, { excel: event.currentTarget.value })} />
              {duplicateExcelColumns.has(row.id) && <small className="custom-excel-duplicate"
                id={'custom-excel-error-' + row.id} role="alert">
                Header ini digunakan pada baris {duplicateExcelColumns.get(row.id)?.join(' dan ')}.
                Gunakan Kolom Excel yang berbeda.
              </small>}
            </label>
            <div className="custom-row-meta">
              <label><input type="radio" name="custom-photo-key" checked={photoRow === row.id}
                onChange={() => setPhotoRow(row.id)} disabled={row.field === 'Password'} aria-label={`Acuan Foto ${row.field ? labels[row.field] : 'baris ' + (index + 1)}`} />
                <span aria-hidden="true">📷</span> Acuan Foto</label>
              <label><input type="checkbox" checked={row.mono} onChange={(event) => updateRow(row.id, { mono: event.currentTarget.checked })}
                aria-label={`Monospace ${row.field ? labels[row.field] : 'baris ' + (index + 1)}`} />
                Monospace</label>
              <button className="custom-row-remove" type="button"
                aria-label={`Hapus ${row.field ? labels[row.field] : 'baris ' + (index + 1)}`}
                onClick={() => removeRow(row.id)} title="Hapus baris">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16 M10 4h4 M6 7l1 13h10l1-13 M10 11v6 M14 11v6" />
                </svg>
              </button>
            </div>
          </li>)}
        </ol> : <div className="custom-format-empty">
          <span><EditorIcon name="plus" /></span><strong>Belum ada baris</strong>
          <p>Klik “Tambah Baris” untuk mulai menambahkan field.</p>
        </div>}
        <aside className="custom-format-note">
          <h3>Perlu Diperhatikan</h3>
          <ul>
            <li>Field bertanda <strong>📷 Acuan Foto</strong> digunakan sebagai nama file foto di ZIP — wajib ada satu.</li>
            <li><strong>Kolom Excel</strong> harus sama persis dengan header kolom di file .xlsx (case-sensitive, tanpa spasi).</li>
            <li>Centang <strong>Mono</strong> untuk tampilan kode seperti NISN, No. Peserta, Username, dsb.</li>
            <li>Format ini akan tersimpan otomatis ke sesi lokal bersama pengaturan lainnya.</li>
          </ul>
        </aside>
        {error && <p className="custom-format-error" role="alert">{error}</p>}
      </div>
      <footer className="custom-format-footer">
        <label className="custom-community"><input type="checkbox" checked={share} disabled={saving}
          onChange={(event) => { const checked = event.currentTarget.checked; setShare(checked); if (checked) setName((previous) => publicName(previous)); setError(''); }} />
          <span className="community-share-icon"><EditorIcon name="users" /></span>
          <span><strong>Bagikan format ini ke komunitas</strong>
            <small>Publikasikan nama dan susunan kolom agar format dapat dipakai pengguna lain. Anda dapat memilih ikon dan berbagi secara anonim.</small></span></label>
        <div>
          <button className="action" type="button" disabled={saving} onClick={() => dialog.current?.close()}>Batal</button>
          <button className="action custom-save" type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : '✓ Simpan & Aktifkan'}
          </button>
        </div>
      </footer>
    </form>
  </dialog>
    {pendingShare && <CommunityShareDialog formatName={pendingShare.appearance.name} busy={saving} error={shareError}
      onCancel={() => setPendingShare(undefined)}
      onConfirm={(attribution) => void commit(pendingShare.fields, pendingShare.appearance, attribution)} />}
  </>;
}
