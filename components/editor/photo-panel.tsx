'use client';

import { useEffect, useRef, useState } from 'react';
import { importPhotoZip, normalizeImage } from '../../lib/cards/assets';
import type { Participant } from '../../lib/participants/model';

export function PhotoPanel({ participants, onPhotos }: {
  participants?: Participant[];
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

  return <div className="panel">
    <h2>2. Foto Peserta</h2>
    {!activeId ? <p>Impor data peserta sebelum menambahkan foto.</p> : <>
      <p>{photos.size} foto tersimpan. Untuk ZIP, gunakan ID peserta sebagai nama foto.</p>
      <div className="grid gap-3">
        <label>Arsip foto ZIP <input className="max-w-full" type="file" accept=".zip" disabled={busy} onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void load(file, true);
          event.currentTarget.value = '';
        }} /></label>
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
      </div>
    </>}
    <p role="status">{busy ? 'Memproses foto…' : message}</p>
  </div>;
}
