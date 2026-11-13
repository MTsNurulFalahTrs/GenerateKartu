import { notify } from '../../lib/ui/notify';
import { useEffect, useRef, useState } from 'react';

export function CommunityDeleteDialog({ id, name, onClose, onDeleted }: {
  id: number;
  name: string;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { dialog.current?.showModal(); }, []);

  return <dialog ref={dialog} className="format-dialog community-share-dialog"
    aria-labelledby="community-delete-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="community-share-header">
      <h2 id="community-delete-title">Hapus Format Komunitas?</h2>
    </header>
    <form aria-busy={busy} onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      const form = event.currentTarget;
      const pin = new FormData(form).get('pin');
      form.reset();
      setBusy(true);

      try {
        const response = await fetch('/api/community-formats', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, pin }),
          signal: AbortSignal.timeout(12000),
        });
        if (response.status === 204 || response.status === 404) {
          onDeleted(id);
          return;
        }
        const data = await response.json();
        notify('error', data.message || 'Format belum berhasil dihapus.');
      } catch {
        notify('error', 'Status penghapusan belum dapat dipastikan. Coba lagi.');
      } finally {
        setBusy(false);
      }
    }}>
      <div className="community-share-body">
        <p><strong>{name}</strong> akan dihapus dari katalog publik.</p>
        <label className="community-share-name" htmlFor="community-owner-pin">PIN pengembang/pemilik</label>
        <input id="community-owner-pin" name="pin" type="password" inputMode="numeric" autoComplete="off"
          required pattern="[0-9]{8,16}" minLength={8} maxLength={16} disabled={busy}
          aria-describedby="community-pin-hint" />
        <small id="community-pin-hint">Masukkan 8–16 angka.</small>
      </div>
      <footer className="community-share-footer">
        <button type="button" className="action" disabled={busy} onClick={onClose}>Batal</button>
        <button type="submit" className="action" disabled={busy}>{busy ? 'Menghapus…' : 'Hapus Format'}</button>
      </footer>
    </form>
  </dialog>;
}
