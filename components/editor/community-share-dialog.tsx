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
  const [nameError, setNameError] = useState(false);
  const [iconError, setIconError] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [iconPreset, setIconPreset] = useState<CommunityIcon>('users');
  const [uploadedIcon, setUploadedIcon] = useState<{ name: string; size: number; data: string }>();
  const uploadInput = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  useEffect(() => { dialog.current?.showModal(); }, []);

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reading) return;
    const contributorName = properContributorName(name.trim());
    if (!anonymous && (!contributorName || contributorName.length > 60 ||
      !/^\p{L}+(?: \p{L}+)*$/u.test(contributorName))) {
      setNameError(true);
      nameInput.current?.focus();
      return;
    }

    onConfirm({ anonymous, contributorName: anonymous ? 'Anonim' : contributorName, iconPreset, ...(uploadedIcon ? { iconIco: uploadedIcon.data } : {}) });
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
        <input ref={nameInput} id="community-contributor-name" aria-invalid={nameError}
          aria-describedby={nameError ? 'contributor-name-error' : undefined} autoFocus maxLength={60} disabled={anonymous || busy}
          placeholder="Masukkan nama atau inisial Anda" value={name}
          onChange={(event) => { setName(cleanContributorInput(event.currentTarget.value)); setNameError(false); }}
          />
        {nameError && <p id="contributor-name-error" className="field-error" role="alert">
          Masukkan nama atau inisial dengan huruf dan spasi, atau pilih opsi anonim.
        </p>}
        <label className="community-share-anonymous">
          <input type="checkbox" checked={anonymous} disabled={busy}
            onChange={(event) => { setAnonymous(event.currentTarget.checked); setNameError(false); }} />
          <span><strong>Bagikan secara Anonim</strong>
            <small>Nama Anda tidak akan ditampilkan — kontribusi tetap tercatat sebagai &quot;Anonim&quot;.</small>
          </span>
        </label>
        <fieldset className="community-icon-picker" disabled={busy || reading}>
          <legend>Ikon format</legend>
          <p className="community-icon-hint">Ikon ini tampil di samping nama format di katalog komunitas.</p>
          <div className="community-icon-options">
            {(Object.keys(communityIcons) as CommunityIcon[]).map((key) => {
              const selected = !uploadedIcon && iconPreset === key;
              return <button key={key} type="button" aria-pressed={selected} className="community-icon-option"
                onClick={() => { setIconPreset(key); setUploadedIcon(undefined); setIconError(false); }}>
                <span className="community-icon-tile"><EditorIcon name={key} /></span>
                <span>{communityIcons[key]}</span>
                {selected && <span className="community-icon-check" aria-hidden="true">✓</span>}
              </button>;
            })}
          </div>
          <div className="community-icon-upload" data-selected={!!uploadedIcon}>
            <span className="community-icon-tile">
              {uploadedIcon
                // The validated local ICO is previewed without uploading it.
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={`data:image/vnd.microsoft.icon;base64,${uploadedIcon.data}`} alt="" width={24} height={24} />
                : <EditorIcon name="upload" />}
            </span>
            <div className="community-icon-file" aria-live="polite">
              <strong>{reading ? 'Memeriksa ikon…' : uploadedIcon?.name ?? 'Unggah ikon sendiri'}</strong>
              <small>{uploadedIcon ? `Dipilih · ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(uploadedIcon.size / 1024)} KB` : 'Format .ico · 10–250 KB'}</small>
            </div>
            <button type="button" className="action" aria-label={uploadedIcon ? 'Ganti berkas ikon' : 'Pilih berkas ikon'}
              onClick={() => uploadInput.current?.click()}>{uploadedIcon ? 'Ganti' : 'Pilih berkas'}</button>
            {uploadedIcon && <button type="button" className="action" aria-label="Hapus ikon unggahan"
              onClick={() => { setUploadedIcon(undefined); setIconError(false); }}>Hapus</button>}
            <input ref={uploadInput} type="file" accept=".ico" hidden onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (!file) return;
              setReading(true);
              setIconError(false);
              try {
                if (!/\.ico$/i.test(file.name) || file.size < 10240 || file.size > 256000) throw new Error();
                const bytes = new Uint8Array(await file.arrayBuffer());
                if (!validIco(bytes)) throw new Error();
                let binary = '';
                for (const byte of bytes) binary += String.fromCharCode(byte);
                setUploadedIcon({ name: file.name, size: file.size, data: btoa(binary) });
              } catch {
                setIconError(true);
              } finally { setReading(false); }
            }} />
          </div>
          {iconError && <p className="field-error" role="alert">
            Pilih berkas .ico yang valid berukuran 10–250 KB.
          </p>}
        </fieldset>
      </div>
      <footer className="community-share-footer">
        <button type="button" className="action community-share-cancel" disabled={busy} onClick={onCancel}>Batal</button>
        <button type="submit" className="action action-primary community-share-confirm" disabled={busy || reading}>
          <EditorIcon name="check" />
          <span>{busy ? 'Membagikan…' : 'Ya, Bagikan Sekarang'}</span>
        </button>
      </footer>
    </form>
  </dialog>;
}
