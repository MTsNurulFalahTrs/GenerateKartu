import { notify } from '../../lib/ui/notify';
import { communityIcons, validIco } from '../../lib/cards/community-icons';
import type { CommunityIcon } from '../../lib/cards/community-icons';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { cleanContributorInput, properContributorName } from '../../lib/cards/community';
import type { CommunityAttribution } from '../../lib/cards/community';
import { EditorIcon } from './editor-icon';

export function CommunityShareDialog({ formatName, busy, onCancel, onConfirm }: {
  formatName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (contributor: CommunityAttribution) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [iconPreset, setIconPreset] = useState<CommunityIcon>('users');
  const [iconIco, setIconIco] = useState<string>();
  const [reading, setReading] = useState(false);

  useEffect(() => { dialog.current?.showModal(); }, []);

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reading) return;
    const contributorName = properContributorName(name.trim());
    if (!anonymous && (!contributorName || contributorName.length > 60 ||
      !/^\p{L}+(?: \p{L}+)*$/u.test(contributorName))) {
      notify('error', 'Nama atau inisial hanya boleh menggunakan huruf dan spasi, atau pilih anonim.');
      return;
    }

    onConfirm({ anonymous, contributorName: anonymous ? 'Anonim' : contributorName, iconPreset, ...(iconIco ? { iconIco } : {}) });
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
            Nama otomatis ditulis dengan huruf kapital di awal setiap kata. Anda juga dapat berbagi anonim.</span>
        </label>
        <input id="community-contributor-name" autoFocus maxLength={60} disabled={anonymous || busy}
          placeholder="Masukkan nama atau inisial Anda" value={name}
          onChange={(event) => { setName(cleanContributorInput(event.currentTarget.value)); }}
          />
        <label className="community-share-anonymous">
          <input type="checkbox" checked={anonymous} disabled={busy}
            onChange={(event) => { setAnonymous(event.currentTarget.checked); }} />
          <span><strong>Bagikan secara Anonim</strong>
            <small>Nama Anda tidak akan ditampilkan — kontribusi tetap tercatat sebagai &quot;Anonim&quot;.</small>
          </span>
        </label>
        <fieldset className="community-icon-picker" disabled={busy || reading}>
          <legend>Ikon format</legend>
          <div>{Object.entries(communityIcons).map(([key, label]) =>
            <button key={key} type="button" className="action" aria-pressed={!iconIco && iconPreset === key}
              onClick={() => { setIconPreset(key as CommunityIcon); setIconIco(undefined); }}>
              <EditorIcon name={key as CommunityIcon} /> {label}
            </button>)}</div>
          <label>Unggah ikon sendiri (.ico, 10–250 KB)
            <input type="file" accept=".ico" onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (!file) return;
              setReading(true);

              try {
                if (!/\.ico$/i.test(file.name) || file.size < 10240 || file.size > 256000) throw new Error();
                const bytes = new Uint8Array(await file.arrayBuffer());
                if (!validIco(bytes)) throw new Error();
                let binary = '';
                for (const byte of bytes) binary += String.fromCharCode(byte);
                setIconIco(btoa(binary));
                notify('success', 'Ikon unggahan dipilih.');
              } catch {
                setIconIco(undefined);
                notify('error', 'Pilih berkas .ico yang valid berukuran 10–250 KB.');
              } finally { setReading(false); }
            }} />
          </label>
          {iconIco && <small>Ikon unggahan dipilih</small>}
        </fieldset>
      </div>
      <footer className="community-share-footer">
        <button type="button" className="action community-share-cancel" disabled={busy} onClick={onCancel}>Batal</button>
        <button type="submit" className="action community-share-confirm" disabled={busy || reading}>
          <span aria-hidden="true">✓</span>
          <span>{busy ? 'Membagikan…' : 'Ya, Bagikan Sekarang'}</span>
        </button>
      </footer>
    </form>
  </dialog>;
}
