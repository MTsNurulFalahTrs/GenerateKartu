import { useEffect, useRef, useState } from 'react';
import { customFields } from '../../lib/cards/preferences';
import type { CustomAppearance } from '../../lib/cards/preferences';
import type { Field } from '../../lib/participants/model';
import { EditorIcon } from './editor-icon';

const maxRows = 6;

export function CustomFormatDialog({ fields, appearance, labels, onSave, onClose }: {
  fields: readonly Field[];
  appearance?: CustomAppearance;
  labels: Record<Field, string>;
  onSave: (fields: Field[], appearance: CustomAppearance) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState([...fields]);
  const [name, setName] = useState(appearance?.name ?? 'Format Kustom');
  const [photoKey, setPhotoKey] = useState<Field | undefined>(appearance?.photoKey ?? (fields.includes('NoPeserta') ? 'NoPeserta' : undefined));
  const [mono, setMono] = useState<Field[]>(appearance?.mono ?? []);
  const [error, setError] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function replace(field: Field, next?: Field) {
    setRows(next ? rows.map((row) => row === field ? next : row) : rows.filter((row) => row !== field));
    if (photoKey === field) setPhotoKey(next);
    setMono(mono.flatMap((item) => item === field ? next ? [next] : [] : [item]));
  }

  function move(index: number, offset: number) {
    const next = [...rows];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setRows(next);
  }

  return <dialog ref={dialog} className="format-dialog custom-format-dialog" aria-labelledby="custom-format-title" onClose={onClose}>
    <header>
      <span className="format-icon"><EditorIcon name="edit" /></span>
      <div><h2 id="custom-format-title">Buat Format Kustom</h2>
        <p>Tentukan sendiri field yang tampil di kartu ujian (maks. 6 baris)</p></div>
      <button className="action" type="button" aria-label="Tutup Format Kustom" onClick={() => dialog.current?.close()}>×</button>
    </header>
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!name.trim() || !photoKey || !rows.includes(photoKey) || rows.length > maxRows) {
        setError('Isi nama format, tambahkan hingga 6 baris, dan pilih satu Acuan Foto.');
        return;
      }
      onSave(rows, { name: name.trim(), photoKey, mono });
      dialog.current?.close();
    }}>
      <div className="custom-format-body">
        <label className="custom-format-name">Nama Format<input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <div className="custom-format-fields-heading">
          <div><h3>Field yang Tampil di Kartu</h3><p>Susun field sesuai urutan yang diinginkan.</p></div>
          <span className="format-count" aria-live="polite">{rows.length} / {maxRows}</span>
          <button className="action custom-add" type="button" disabled={rows.length >= maxRows} onClick={() => {
            const next = customFields.find((field) => !rows.includes(field));
            if (next) setRows([...rows, next]);
          }}>＋ Tambah Baris</button>
        </div>
        {rows.length ? <ol className="custom-format-rows">
          {rows.map((field, index) => <li key={field}>
            <label>Kolom Excel <span className="sr-only">baris {index + 1}</span>
              <select value={field} onChange={(event) => replace(field, customFields.find((option) => option === event.target.value))}>
                {customFields.filter((option) => option === field || !rows.includes(option)).map((option) =>
                  <option key={option} value={option}>{option} · {labels[option]}</option>)}
              </select>
            </label>
            <label><input type="radio" name="custom-photo-key" checked={photoKey === field} onChange={() => setPhotoKey(field)} aria-label={`Acuan Foto ${labels[field]}`} /> Acuan Foto</label>
            <label><input type="checkbox" checked={mono.includes(field)} aria-label={`Mono ${labels[field]}`}
              onChange={(event) => setMono(event.target.checked ? [...mono, field] : mono.filter((item) => item !== field))} /> Mono</label>
            <div className="custom-row-actions">
              <button className="action" type="button" disabled={!index} onClick={() => move(index, -1)} aria-label={`Naikkan ${labels[field]}`}>↑</button>
              <button className="action" type="button" disabled={index === rows.length - 1} onClick={() => move(index, 1)} aria-label={`Turunkan ${labels[field]}`}>↓</button>
              <button className="action" type="button" onClick={() => replace(field)} aria-label={`Hapus ${labels[field]}`}>×</button>
            </div>
          </li>)}
        </ol> : <div className="custom-format-empty"><span><EditorIcon name="plus" /></span>
          <strong>Belum ada baris</strong><p>Klik “Tambah Baris” untuk mulai menambahkan field.</p></div>}
        <aside className="custom-format-note">
          <h3>Perlu Diperhatikan</h3>
          <ul>
            <li>Pilih satu <strong>Acuan Foto</strong> untuk mencocokkan nama file foto di ZIP.</li>
            <li>Gunakan nama <strong>Kolom Excel</strong> dari template aktif agar kolom terpetakan otomatis.</li>
            <li>Centang <strong>Mono</strong> untuk menampilkan kode dengan lebar karakter seragam.</li>
            <li>Format tersimpan otomatis bersama pengaturan lokal.</li>
          </ul>
        </aside>
        {error && <p className="custom-format-error" role="alert">{error}</p>}
      </div>
      <footer className="custom-format-footer">
        <label className="custom-community"><input type="checkbox" disabled />
          <span><strong>Bagikan format ini ke komunitas</strong><small>Berbagi ke katalog komunitas belum tersedia.</small></span></label>
        <div>
          <button className="action" type="button" onClick={() => dialog.current?.close()}>Batal</button>
          <button className="action custom-save" type="submit">✓ Simpan &amp; Aktifkan</button>
        </div>
      </footer>
    </form>
  </dialog>;
}
