'use client';

import { useEffect, useRef, useState } from 'react';
import { normalizeImage } from '../../lib/cards/assets';
import type { AssetName, CardSettings, InstitutionAssets } from '../../lib/cards/settings';

const textFields = [
  ['institution', 'Nama sekolah/madrasah'], ['exam', 'Nama ujian'], ['year', 'Tahun pelajaran'],
  ['address', 'Alamat'], ['city', 'Kota'], ['date', 'Tanggal'], ['signer', 'Nama penandatangan'], ['nip', 'NIP'],
] as const;
const assetFields = [['logoLeft', 'Logo kiri'], ['logoRight', 'Logo kanan'], ['signature', 'Tanda tangan']] as const;

export function CardSettingsPanel({ section, value, onChange, assets, onAssets }: {
  section: number;
  value: CardSettings;
  onChange: (settings: CardSettings) => void;
  assets: InstitutionAssets;
  onAssets: (name: AssetName, asset?: Blob) => void;
}) {
  const assetJob = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const pending = assetJob;
    return () => { pending.current++; };
  }, []);
  function update<K extends keyof CardSettings>(key: K, next: CardSettings[K]) {
    onChange({ ...value, [key]: next });
  }
  async function loadAsset(name: AssetName, file: File) {
    const job = ++assetJob.current;
    setError('');
    setBusy(true);
    try {
      const blob = await normalizeImage(file);
      if (assetJob.current === job) onAssets(name, blob);
    } catch (cause) {
      if (assetJob.current === job) setError(cause instanceof Error ? cause.message : 'Aset gagal diproses.');
    } finally {
      if (assetJob.current === job) setBusy(false);
    }
  }
  if (section === 0) return <div className="grid gap-3 sm:grid-cols-2">
    {textFields.map(([key, label]) => <label className="grid gap-1" key={key}>{label}
      <input type={key === 'date' ? 'date' : 'text'} maxLength={160} value={value[key]} onChange={(event) => update(key, event.target.value)} />
    </label>)}
    {assetFields.map(([key, label]) => <div key={key}>
      <label className="grid gap-1">{label}<input className="max-w-full" type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        if (file) void loadAsset(key, file);
        event.currentTarget.value = '';
      }} /></label>
      {assets[key] && <button type="button" className="action mt-2" disabled={busy} onClick={() => onAssets(key)}>Hapus {label.toLowerCase()}</button>}
    </div>)}
    {busy && <p role="status">Memproses aset…</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
  if (section === 1) return <div className="grid gap-3 sm:grid-cols-2">
    <label>Ukuran <select value={`${value.width}x${value.height}`} onChange={(event) => {
      if (event.target.value === 'custom') onChange({ ...value, width: 95, height: 65 });
      else {
        const [width, height] = event.target.value.split('x').map(Number);
        onChange({ ...value, width, height });
      }
    }}><option value="86x54">86 × 54 mm</option><option value="90x60">90 × 60 mm</option><option value="100x70">100 × 70 mm</option>
      {!['86x54', '90x60', '100x70'].includes(`${value.width}x${value.height}`) && <option value={`${value.width}x${value.height}`}>Kustom</option>}
      <option value="custom">Atur ukuran kustom</option>
    </select></label>
    {([['width', 'Lebar (mm)', 60, 180], ['height', 'Tinggi (mm)', 40, 150], ['fontSize', 'Ukuran teks (pt)', 6, 12]] as const).map(([key, label, min, max]) =>
      <label key={key}>{label} <input type="number" min={min} max={max} value={value[key] || ''} onChange={(event) => update(key, Number(event.target.value))} /></label>)}
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
        onChange={(event) => update('schedule', event.target.value)} placeholder="Senin · 08.00 · IPS" />
    </label>
    <small>Satu kegiatan per baris.</small>
  </div>;
}
