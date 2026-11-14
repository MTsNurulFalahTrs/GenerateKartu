import { EditorIcon } from './editor-icon';
import { notify } from '../../lib/ui/notify';
import { useEffect, useRef, useState } from 'react';

export function CommunityDeleteDialog({ id, name, onClose, onDeleted }: {
  id: number;
  name: string;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [invalidPin, setInvalidPin] = useState(false);

  useEffect(() => { dialog.current?.showModal(); }, []);

  return <dialog ref={dialog} className="format-dialog community-delete-dialog"
    aria-labelledby="community-delete-title" aria-describedby="community-delete-description"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header>
      <span className="delete-format-symbol"><EditorIcon name="trash" /></span>
      <div>
        <h2 id="community-delete-title">Hapus Format Komunitas?</h2>
        <p id="community-delete-description">Akses khusus pengembang atau pemilik aplikasi.</p>
      </div>
      <button type="button" className="action action-icon delete-format-close" aria-label="Tutup modal hapus"
        disabled={busy} onClick={onClose}><EditorIcon name="close" /></button>
    </header>
    <form aria-busy={busy} onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      const form = event.currentTarget;
      const pin = new FormData(form).get('pin');
      form.reset();
      setShowPin(false);
      setInvalidPin(false);
      setBusy(true);

      try {
        const response = await fetch('/api/community-formats', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, pin }),
          signal: AbortSignal.timeout(12000),
        });
        if (response.status === 204) {
          onDeleted(id);
          return;
        }
        const data = await response.json().catch(() => ({}));
        if (response.status === 404 && data.message === 'Format sudah tidak tersedia di katalog.') {
          onDeleted(id);
          return;
        }
        if (response.status === 403) {
          setInvalidPin(true);
          return;
        }
        notify('error', data.message || 'Format belum berhasil dihapus.');
      } catch {
        notify('error', 'Status penghapusan belum dapat dipastikan. Coba lagi.');
      } finally {
        setBusy(false);
        requestAnimationFrame(() => input.current?.focus());
      }
    }}>
      <div className="delete-format-body">
        <div className="delete-format-target">
          <span className="delete-format-document"><EditorIcon name="document" /></span>
          <div><small>Format yang akan dihapus</small><strong>{name}</strong></div>
        </div>
        <p className="delete-format-impact">Format akan hilang dari katalog publik secara permanen. Salinan yang sudah diaktifkan di browser pengguna tetap bisa digunakan.</p>
        <div className="delete-format-pin">
          <label htmlFor="community-owner-pin">PIN pemilik</label>
          <div className="delete-format-input">
            <EditorIcon name="lock" />
            <input ref={input} id="community-owner-pin" name="pin" type={showPin ? 'text' : 'password'}
              inputMode="numeric" autoComplete="off" autoFocus required pattern="[0-9]{8,16}" minLength={8} maxLength={16}
              disabled={busy} aria-invalid={invalidPin} aria-describedby="community-pin-hint"
              placeholder="Masukkan PIN" onChange={() => setInvalidPin(false)} />
            <button type="button" className="action" disabled={busy}
              onClick={() => setShowPin(!showPin)}>{showPin ? 'Sembunyikan' : 'Tampilkan'}</button>
          </div>
          <small id="community-pin-hint" className={invalidPin ? 'field-error' : undefined} role={invalidPin ? 'alert' : undefined}>{invalidPin ? 'PIN salah. Periksa kembali sebelum mencoba lagi.' : 'Gunakan PIN yang terdiri dari 8–16 angka.'}</small>
        </div>
      </div>
      <footer className="delete-format-footer">
        <button type="button" className="action" disabled={busy} onClick={onClose}>Batal</button>
        <button type="submit" className="action action-danger delete-format-submit" disabled={busy}>
          <EditorIcon name="trash" /> {busy ? 'Menghapus…' : 'Hapus Format'}
        </button>
      </footer>
    </form>
  </dialog>;
}
