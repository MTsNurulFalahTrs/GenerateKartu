'use client';

import { useEffect, useRef, useState } from 'react';
import { maxBackupBytes, parseBackup } from '../../lib/cards/preferences';
import type { Heading, Preferences } from '../../lib/cards/preferences';
import { EditorIcon } from './editor-icon';

type ImportCandidate = { fileName: string; preferences: Preferences; heading?: Heading };

export function BackupPanel({ preferences, heading, onRestore, storageMessage, compact = false }: {
  preferences: Preferences;
  heading: Heading;
  onRestore: (preferences: Preferences, heading?: Heading) => void;
  storageMessage: string;
  compact?: boolean;
}) {
  const [includeHeading, setIncludeHeading] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ImportCandidate>();
  const generation = useRef(0);
  const importInput = useRef<HTMLInputElement>(null);
  const importButton = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const jobs = generation;
    return () => { jobs.current++; };
  }, []);

  useEffect(() => {
    if (pending) confirmation.current?.showModal();
  }, [pending]);

  async function inspectFile(file: File) {
    const job = ++generation.current;
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      if (file.size > maxBackupBytes) throw new Error('Ukuran backup maksimum 1 MiB.');
      const result = parseBackup(await file.text());
      if (job !== generation.current) return;
      setPending({ fileName: file.name, ...result });
    } catch (error) {
      if (job !== generation.current) return;
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Berkas backup tidak dapat dibaca.');
    } finally {
      if (job === generation.current) setBusy(false);
    }
  }

  function closeConfirmation() {
    setPending(undefined);
    requestAnimationFrame(() => importButton.current?.focus());
  }

  function restoreConfirmed() {
    if (!pending) return;
    try {
      onRestore(pending.preferences, pending.heading);
      setFailed(false);
      setMessage('Pengaturan berhasil dipulihkan dari ' + pending.fileName + '.');
      confirmation.current?.close();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Pemulihan gagal.');
    }
  }

  function download() {
    try {
      const raw = JSON.stringify({ ...preferences, ...(includeHeading ? { heading } : {}) }, null, 2);
      parseBackup(raw);
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'generate-kartu-pengaturan-v1.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFailed(false);
      setMessage('Backup konfigurasi berhasil dibuat. Simpan berkas JSON di tempat yang aman.');
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Backup gagal dibuat.');
    }
  }

  return <>
    <section className={compact ? 'layout-backup backup-console backup-console-compact' : 'panel backup-console'}
      aria-label="Backup dan pemulihan pengaturan">
      {!compact && <div className="backup-console-header">
        <span className="backup-console-badge"><EditorIcon name="document" /></span>
        <div><h2>Backup dan Pemulihan</h2>
          <p>Simpan konfigurasi untuk digunakan kembali atau pulihkan pengaturan dari berkas JSON.</p>
        </div>
      </div>}
      <div className="backup-console-actions">
        <div className="backup-action-card">
          <div className="backup-action-head"><span><EditorIcon name="download" /></span>
            <div><strong>Cadangkan Pengaturan</strong><small>Ekspor konfigurasi saat ini</small></div></div>
          <button type="button" className="action backup-action-button" onClick={download}>
            <EditorIcon name="download" /> Ekspor Konfigurasi
          </button>
        </div>
        <div className="backup-action-card">
          <div className="backup-action-head"><span><EditorIcon name="upload" /></span>
            <div><strong>Pulihkan Pengaturan</strong><small>Impor file .json (maks. 1 MiB)</small></div></div>
          <button type="button" ref={importButton} className="action backup-action-button backup-import-button"
            disabled={busy} onClick={() => importInput.current?.click()}>
            <EditorIcon name="upload" /> {busy ? 'Memeriksa berkas…' : 'Impor Konfigurasi'}
          </button>
        </div>
      </div>
      <input type="file" ref={importInput} className="sr-only" tabIndex={-1}
        aria-label="Pilih berkas konfigurasi JSON" accept=".json,application/json" disabled={busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void inspectFile(file);
          event.currentTarget.value = '';
        }} />
      <div className="backup-console-options">
        <label className="backup-heading-option">
          <input type="checkbox" checked={includeHeading} onChange={(event) => setIncludeHeading(event.currentTarget.checked)} />
          <span><strong>Sertakan identitas KOP dasar</strong>
            <small>Nama institusi, nama ujian dan tahun pelajaran ikut disimpan di backup.</small></span>
        </label>
        <div className="backup-privacy-note"><EditorIcon name="lock" />
          <p>Backup tidak berisi data murid, password, jadwal, foto, logo, tanda tangan, alamat atau NIP.
            Konfirmasi diperlukan sebelum pemulihan mengganti preferensi yang sedang digunakan.</p>
        </div>
      </div>
      {storageMessage && <p className="backup-inline-status" role="status">{storageMessage}</p>}
      {message && <p className="backup-inline-status" role={failed ? 'alert' : 'status'} data-error={failed}>{message}</p>}
    </section>
    {pending && <dialog ref={confirmation} className="format-dialog backup-confirm-dialog"
      aria-labelledby="backup-confirm-title" aria-describedby="backup-confirm-description"
      onClose={closeConfirmation}>
      <header className="backup-confirm-header">
        <span className="backup-console-badge"><EditorIcon name="upload" /></span>
        <div><h2 id="backup-confirm-title">Konfirmasi Pemulihan</h2>
          <p id="backup-confirm-description">Periksa detail konfigurasi sebelum mengganti pengaturan.</p></div>
        <button type="button" className="action" aria-label="Tutup konfirmasi pemulihan"
          onClick={() => confirmation.current?.close()}>×</button>
      </header>
      <div className="backup-confirm-content">
        <dl>
          <div><dt>Berkas</dt><dd>{pending.fileName}</dd></div>
          <div><dt>Format kartu</dt><dd>{pending.preferences.customAppearance?.name || (pending.preferences.format === 7 ? 'Format Kustom' : 'Format Bawaan')}</dd></div>
          <div><dt>Identitas KOP</dt><dd>{pending.heading ? 'Termasuk di berkas' : 'Tidak disertakan'}</dd></div>
        </dl>
        <p className="backup-confirm-warning"><EditorIcon name="lock" />
          Preferensi saat ini akan diganti. Data peserta dan foto yang sedang digunakan tidak akan diimpor atau dikirim.</p>
      </div>
      <footer className="backup-confirm-footer">
        <button className="action" type="button" onClick={() => confirmation.current?.close()}>Batal</button>
        <button id="confirm-backup-restore" className="action data-next" type="button"
          onClick={restoreConfirmed}>Ya, Pulihkan Pengaturan</button>
      </footer>
    </dialog>}
  </>;
}
