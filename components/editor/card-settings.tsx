'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import { normalizeImage } from '../../lib/cards/assets';
import type { AssetName, CardSettings, InstitutionAssets } from '../../lib/cards/settings';

import { defaultCard, kopSizes } from '../../lib/cards/settings';
import { CardImage, KopText } from './card-preview';
import { EditorIcon } from './editor-icon';

const kopInputs = [
  ['institution', 'Nama Lembaga', 160], ['exam', 'Jenis Ujian', 45],
  ['year', 'Tahun Ajaran', 160], ['address', 'Alamat (opsional)', 65],
] as const;
const signerInputs = [
  ['city', 'Lokasi (Kab/Kota)', 'Contoh: Musi Rawas'],
  ['date', 'Tanggal Cetak', 'Kosong = hari ini'],
  ['signer', 'Nama Kepala Sekolah', ''],
  ['nip', 'NIP Kepala Sekolah (opsional)', 'Masukkan NIP jika ada'],
] as const;

export function CardSettingsPanel({ section, value, onChange, assets, onAssets }: {
  section: number;
  value: CardSettings;
  onChange: Dispatch<SetStateAction<CardSettings>>;
  assets: InstitutionAssets;
  onAssets: (name: AssetName, asset?: Blob) => void;
}) {
  const assetJob = useRef(0);
  const assetPending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const pending = assetJob;
    return () => { pending.current++; };
  }, []);
  function update<K extends keyof CardSettings>(key: K, next: CardSettings[K]) {
    onChange((previous) => ({ ...previous, [key]: next }));
  }
  async function loadAsset(name: AssetName, file: File) {
    if (assetPending.current) return;
    assetPending.current = true;
    const job = ++assetJob.current;
    setError('');
    setBusy(true);
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran logo atau tanda tangan maksimum 2 MiB.');
      const blob = await normalizeImage(file);
      if (assetJob.current === job) onAssets(name, blob);
    } catch (cause) {
      if (assetJob.current === job) setError(cause instanceof Error ? cause.message : 'Aset gagal diproses.');
    } finally {
      if (assetJob.current === job) {
        assetPending.current = false;
        setBusy(false);
      }
    }
  }
  function assetPicker(key: AssetName, label: string, action: string, description: string) {
    return <div className="kop-asset" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && !busy) void loadAsset(key, file);
    }}>
      <div className="kop-asset-image">{assets[key] ? <CardImage blob={assets[key]} label={label} /> :
        <><EditorIcon name={key === 'signature' ? 'edit' : 'image'} /><small>Belum ada</small></>}</div>
      <div><strong>{label}</strong><small>{description}</small>
        <label className="action kop-upload"><EditorIcon name="upload" /> {action}
          <input aria-label={action} className="sr-only" type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void loadAsset(key, file);
            event.currentTarget.value = '';
          }} />
        </label>
        {assets[key] && <button type="button" className="action" disabled={busy} onClick={() => onAssets(key)}>Hapus {label.toLowerCase()}</button>}
      </div>
    </div>;
  }

  if (section === 0) return <div className="kop-body">
    <div className="kop-grid">
      {assetPicker('logoLeft', 'Logo Kiri', assets.logoLeft ? 'Ganti Logo Kiri' : 'Pasang Logo Kiri', 'Logo utama KOP. Ideal 200 × 200 px, maksimum 2 MiB.')}
      {assetPicker('logoRight', 'Logo Kanan (opsional)', assets.logoRight ? 'Ganti Logo Kanan' : 'Pasang Logo Kanan', 'Logo tambahan KOP. Ideal 200 × 200 px, maksimum 2 MiB.')}
    </div>
    <section className="kop-section">
      <h3>Isi KOP Kartu Ujian</h3>
      <div className="kop-grid">
        {kopInputs.map(([key, label, limit], index) => {
          const style = value.kopStyles[key];
          const setStyle = (next: Partial<typeof style>) => update('kopStyles', { ...value.kopStyles, [key]: { ...style, ...next } });
          const yearPreset = (offset: number) => {
            const now = new Date();
            const year = now.getFullYear() + (now.getMonth() < 6 ? -1 : 0) + offset;
            update('year', `Tahun Pelajaran ${year}/${year + 1}`);
          };
          return <div key={key} className="kop-field">
            <label htmlFor={`kop-${key}`}><span>Baris {index + 1} — {label}</span>
              {(key === 'exam' || key === 'address') && <small>{value[key].length} / {limit}</small>}
            </label>
            {key === 'address'
              ? <textarea id={`kop-${key}`} rows={3} maxLength={limit} value={value[key]} placeholder="Kosongkan jika tidak perlu" onChange={(event) => update(key, event.currentTarget.value)} />
              : <input type="text" id={`kop-${key}`} aria-label={key === 'institution' ? 'Nama sekolah/madrasah' : undefined} maxLength={limit} value={value[key]} onChange={(event) => update(key, event.currentTarget.value)} />}
            {key === 'year' && <div className="kop-presets">
              {['Tahun Lalu', 'Tahun Berjalan', 'Tahun Depan'].map((name, i) => <button type="button" key={name} onClick={() => yearPreset(i - 1)}>{name}</button>)}
              {['Ganjil', 'Genap'].map((name) => <button type="button" key={name} onClick={() => {
                const base = value.year.replace(/(?: · )?Semester (?:Ganjil|Genap)$/i, '').trim();
                update('year', [base, `Semester ${name}`].filter(Boolean).join(' · ').slice(0, 160));
              }}>Semester {name}</button>)}
            </div>}
            <div className="kop-format">
              <small>Format:</small>
              <select aria-label={`Ukuran teks ${label}`} value={style.size} onChange={(event) => setStyle({ size: Number(event.target.value) })}>
                {kopSizes.map((size) => <option key={size} value={size}>{size} px</option>)}
              </select>
              <button className="action" type="button" aria-label={`Tebal ${label}`} aria-pressed={style.bold} onClick={() => setStyle({ bold: !style.bold })}><b>B</b></button>
              <button className="action" type="button" aria-label={`Miring ${label}`} aria-pressed={style.italic} onClick={() => setStyle({ italic: !style.italic })}><i>I</i></button>
            </div>
          </div>;
        })}
      </div>
      <div className="kop-live">
        <h3>Pratinjau KOP Langsung</h3>
        <div><div><CardImage blob={assets.logoLeft} label="Logo kiri" /></div><KopText settings={value} /><div><CardImage blob={assets.logoRight} label="Logo kanan" /></div></div>
      </div>
    </section>
    <section className="kop-section">
      <h3>Data Penandatangan</h3>
      <div className="kop-grid">
        {signerInputs.map(([key, label, placeholder]) => <label className="kop-field" key={key}>{label}
          <input type="text" maxLength={160} placeholder={placeholder} value={value[key]} onChange={(event) => update(key, event.currentTarget.value)}
            onBlur={key === 'city' ? () => update(key, value.city.trim().toLocaleLowerCase('id-ID').replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('id-ID'))) : undefined} />
        </label>)}
      </div>
      {assetPicker('signature', 'Tanda Tangan Digital (opsional)', 'Upload Tanda Tangan', 'PNG transparan direkomendasikan. Maksimum 2 MiB.')}
      <div className="kop-signature">
        <label htmlFor="kop-signature-size">Ukuran Tanda Tangan di Kartu <output>{value.signatureSize.toFixed(1)} cm</output></label>
        <input id="kop-signature-size" type="range" min={0.4} max={2} step={0.1} value={value.signatureSize} onChange={(event) => update('signatureSize', Number(event.target.value))} />
        <div className="kop-presets">{[0.6, 0.8, 1.2, 1.6].map((size) => <button key={size} type="button" aria-pressed={size === value.signatureSize}
          onClick={() => update('signatureSize', size)}>{size} cm</button>)}</div>
        <label><input type="checkbox" role="switch" checked={value.signatureOverlap} onChange={(event) => update('signatureOverlap', event.target.checked)} /> TTD Overlap Teks</label>
      </div>
    </section>
    {busy && <p role="status">Memproses aset…</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
  if (section === 1) return <div className="grid gap-3 sm:grid-cols-2">
    <label>Ukuran <select value={`${value.width}x${value.height}`} onChange={(event) => {
      if (event.target.value === 'custom') onChange((previous) => ({ ...previous, width: 95, height: 65 }));
      else {
        const [width, height] = event.target.value.split('x').map(Number);
        onChange((previous) => ({ ...previous, width, height }));
      }
    }}><option value="86x54">86 × 54 mm</option><option value="90x60">90 × 60 mm</option><option value="100x70">100 × 70 mm</option>
      {!['86x54', '90x60', '100x70'].includes(`${value.width}x${value.height}`) && <option value={`${value.width}x${value.height}`}>Kustom</option>}
      <option value="custom">Atur ukuran kustom</option>
    </select></label>
    {([['width', 'Lebar (mm)', 60, 180], ['height', 'Tinggi (mm)', 40, 150], ['fontSize', 'Ukuran teks (pt)', 6, 12]] as const).map(([key, label, min, max]) =>
      <label key={key}>{label} <input type="number" min={min} max={max} step="any" value={value[key] || ''}
        onChange={(event) => update(key, Number(event.currentTarget.value))}
        onBlur={(event) => {
          const number = event.currentTarget.valueAsNumber;
          if (!Number.isFinite(number) || number < min || number > max) {
            update(key, Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : defaultCard[key]);
          }
        }} /></label>)}
    <label>Posisi teks <select value={value.align} onChange={(event) => {
      const align = event.target.value;
      if (align === 'left' || align === 'center' || align === 'right') update('align', align);
    }}><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></label>
    {([['monochrome', 'Hitam putih'], ['photo', 'Tampilkan foto'], ['qr', 'Tampilkan QR']] as const).map(([key, label]) =>
      <label key={key}><input type="checkbox" checked={value[key]} onChange={(event) => update(key, event.target.checked)} /> {label}</label>)}
  </div>;
  return <div className="grid gap-2">
    <label><input type="checkbox" checked={value.showSchedule} onChange={(event) => update('showSchedule', event.target.checked)} /> Tampilkan jadwal</label>
    <label className="grid gap-1">Jadwal ujian
      <textarea className="border rounded p-2" rows={4} maxLength={1000} value={value.schedule}
        disabled={!value.showSchedule} onChange={(event) => update('schedule', event.target.value)} placeholder="Senin · 08.00 · IPS" />
    </label>
    <small>Satu kegiatan per baris.</small>
  </div>;
}
