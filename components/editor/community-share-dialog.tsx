import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { CommunityAttribution } from '../../lib/cards/community';
import { EditorIcon } from './editor-icon';

export function CommunityShareDialog({ formatName, busy, error, onCancel, onConfirm }: {
  formatName: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (contributor: CommunityAttribution) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [validation, setValidation] = useState('');

  useEffect(() => { dialog.current?.showModal(); }, []);

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const contributorName = name.trim();
    if (!anonymous && (!contributorName || contributorName.length > 60 ||
      /[\p{Cc}\p{Cf}]/u.test(contributorName))) {
      setValidation('Masukkan nama atau inisial kontributor, atau pilih bagikan secara anonim.');
      return;
    }
    setValidation('');
    onConfirm({ anonymous, contributorName: anonymous ? 'Anonim' : contributorName });
  }

  return <dialog ref={dialog} className="format-dialog community-share-dialog"
    aria-labelledby="community-share-title" aria-describedby="community-share-subtitle"
    onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
    <header className="community-share-header">
      <span className="community-share-icon"><EditorIcon name="users" /></span>
      <div>
        <h2 id="community-share-title">Bagikan ke Komunitas?</h2>
        <p id="community-share-subtitle">Format Anda akan tersedia untuk semua pengguna</p>
      </div>
    </header>
    <form onSubmit={confirm} aria-busy={busy}>
      <div className="community-share-body">
        <div className="community-share-notice">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <p>Format <strong>{formatName}</strong> akan disimpan ke database komunitas dan dapat digunakan oleh pengguna lain.
            Terima kasih atas kontribusi Anda! 🎉</p>
        </div>
        <label className="community-share-name" htmlFor="community-contributor-name">
          <strong>Nama / Inisial Kontributor</strong>
          <span>Masukkan nama atau inisial Anda sebagai bentuk apresiasi atas kontribusi kepada komunitas.
            Anda juga dapat membagikan secara anonim.</span>
        </label>
        <input id="community-contributor-name" autoFocus maxLength={60} disabled={anonymous || busy}
          placeholder="Masukkan nama atau inisial Anda" value={name}
          onChange={(event) => { setName(event.currentTarget.value); setValidation(''); }}
          aria-invalid={!!validation && !anonymous} />
        <label className="community-share-anonymous">
          <input type="checkbox" checked={anonymous} disabled={busy}
            onChange={(event) => { setAnonymous(event.currentTarget.checked); setValidation(''); }} />
          <span><strong>Bagikan secara Anonim</strong>
            <small>Nama Anda tidak akan ditampilkan — kontribusi tetap tercatat sebagai &quot;Anonim&quot;.</small>
          </span>
        </label>
        {(validation || error) && <p className="community-share-error" role="alert">{validation || error}</p>}
      </div>
      <footer className="community-share-footer">
        <button type="button" className="action community-share-cancel" disabled={busy} onClick={onCancel}>Batal</button>
        <button type="submit" className="action community-share-confirm" disabled={busy}>
          <span aria-hidden="true">✓</span>
          <span>{busy ? 'Membagikan…' : 'Ya, Bagikan Sekarang'}</span>
        </button>
      </footer>
    </form>
  </dialog>;
}
