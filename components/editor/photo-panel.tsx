'use client';

import { useEffect, useRef, useState } from 'react';
import { importPhotoZip, normalizeImage } from '../../lib/cards/assets';
import { EditorIcon } from './editor-icon';
import type { Participant } from '../../lib/participants/model';

export function PhotoPanel({ participants, photoKey, onPhotos }: {
  participants?: Participant[];
  photoKey: string;
  onPhotos: (photos: Map<string, Blob>) => void;
}) {
  const generation = useRef(0);
  const [photos, setPhotos] = useState(new Map<string, Blob>());
  const [id, setId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const activeId = participants?.some((p) => p.id === id) ? id : participants?.[0]?.id;

  useEffect(() => {
    const ref = generation;
    return () => { ref.current++; };
  }, []);

  function commit(next: Map<string, Blob>) {
    setPhotos(next);
    onPhotos(next);
  }

  async function load(file: File, zip: boolean) {
    if (!participants || !activeId || busy) return;
    const job = ++generation.current;
    setBusy(true);
    setMessage('');
    try {
      const result = zip
        ? await importPhotoZip(file, new Set(participants.map((p) => p.id)))
        : { photos: new Map([[activeId, await normalizeImage(file)]]), unmatched: [] };
      if (generation.current !== job) return;
      commit(new Map([...photos, ...result.photos]));
      setMessage(`${result.photos.size} foto diterapkan. ${result.unmatched.length} tidak cocok${result.unmatched.length ? ': ' + result.unmatched.slice(0, 10).join(', ') : ''}.`);
    } catch (error) {
      if (generation.current === job) setMessage(error instanceof Error ? error.message : 'Foto gagal diproses.');
    } finally {
      if (generation.current === job) setBusy(false);
    }
  }

  return <>
    <section className="panel data-zip">
      <div className="data-title"><span className="data-icon"><EditorIcon name="image" /></span>
        <div><h2>2. Foto Murid</h2><small>File .zip berisi foto murid</small></div>
      </div>
      <div className="data-note"><strong>Syarat nama file foto:</strong>
        <div>Nama file gambar harus <strong>sama persis</strong> dengan nilai di kolom <code>{photoKey}</code>.</div>
      </div>
      {!activeId ? <div className="data-drop data-locked"><span className="data-icon"><EditorIcon name="lock" /></span>
        <strong>Terkunci</strong><small>Upload Data Excel terlebih dahulu untuk mengaktifkan fitur ini</small>
      </div> : <label className="data-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) void load(file, true);
      }}>
        <span className="data-icon"><EditorIcon name="upload" /></span><strong>Klik atau seret arsip foto ZIP ke sini</strong>
        <input aria-label="Arsip foto ZIP" className="sr-only" type="file" accept=".zip" disabled={busy} onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void load(file, true);
          event.currentTarget.value = '';
        }} />
      </label>}
    </section>
    <section className="panel data-wide data-individual">
      <header className="data-title"><span className="data-icon"><EditorIcon name="user" /></span>
        <div><h2>3. Upload Foto Per Murid</h2><small>Alternatif ZIP — unggah satu per satu</small></div>
      </header>
      {!activeId ? <div className="data-empty"><EditorIcon name="plus" />
        <span>Upload Excel terlebih dahulu untuk melihat daftar murid</span>
      </div> : <div className="data-preview-controls grid gap-3">
        <label>Peserta <select className="max-w-full" value={activeId} disabled={busy} onChange={(event) => setId(event.target.value)}>
          {participants?.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}</option>)}
        </select></label>
        <label>Foto individual <input className="max-w-full" type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void load(file, false);
          event.currentTarget.value = '';
        }} /></label>
        <button type="button" className="action justify-self-start" disabled={busy || !photos.has(activeId)} onClick={() => {
          const next = new Map(photos);
          next.delete(activeId);
          commit(next);
          setMessage('Foto peserta dihapus.');
        }}>Hapus foto peserta</button>
        <p role="status">{busy ? 'Memproses foto…' : message || `${photos.size} foto tersimpan.`}</p>
      </div>}
    </section>
  </>;
}
