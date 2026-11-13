'use client';

import { useEffect, useRef, useState } from 'react';
import { maxBackupBytes, parseBackup } from '../../lib/cards/preferences';
import type { Heading, Preferences } from '../../lib/cards/preferences';

export function BackupPanel({ preferences, heading, onRestore, storageMessage }: {
  preferences: Preferences;
  heading: Heading;
  onRestore: (preferences: Preferences, heading?: Heading) => void;
  storageMessage: string;
}) {
  const [includeHeading, setIncludeHeading] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    const pending = generation;
    return () => { pending.current++; };
  }, []);

  async function restore(file: File) {
    const job = ++generation.current;
    setBusy(true);
    setMessage('');
    try {
      if (file.size > maxBackupBytes) throw new Error('Ukuran backup maksimum 1 MiB.');
      const result = parseBackup(await file.text());
      if (job !== generation.current) return;
      if (!window.confirm('Pulihkan preferensi dari backup ini? Data peserta dan foto aktif tetap tersedia untuk format asalnya.')) return;
      onRestore(result.preferences, result.heading);
      setFailed(false);
      setMessage('Pengaturan dipulihkan.');
    } catch (error) {
      if (job !== generation.current) return;
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Backup gagal dibaca.');
    } finally {
      if (job === generation.current) setBusy(false);
    }
  }

  function download() {
    try {
      const raw = JSON.stringify({ ...preferences, ...(includeHeading ? { heading } : {}) }, null, 2);
      parseBackup(raw);
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'generate-kartu-pengaturan-v1.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFailed(false);
      setMessage('Backup pengaturan siap diunduh.');
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Backup gagal dibuat.');
    }
  }

  return <section className="panel mt-4">
    <h2>Backup dan pemulihan</h2>
    <p>Backup JSON menyimpan preferensi. Data peserta, jadwal, foto, logo, tanda tangan, alamat, dan NIP tetap di sesi ini.</p>
    <label className="block mb-3"><input type="checkbox" checked={includeHeading} onChange={(event) => setIncludeHeading(event.target.checked)} /> Sertakan nama institusi, nama ujian, dan tahun pelajaran</label>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="action" onClick={download}>Ekspor Konfigurasi</button>
      <label className="grid min-w-0 gap-1">Impor Konfigurasi
        <input className="max-w-full" type="file" accept=".json,application/json" disabled={busy} onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void restore(file);
          event.currentTarget.value = '';
        }} />
      </label>
    </div>
    {storageMessage && <p role="status">{storageMessage}</p>}
    {message && <p role={failed ? 'alert' : 'status'}>{message}</p>}
  </section>;
}
