'use client';

import { useRef, useState } from 'react';
import type { ScheduleTable } from '../../lib/cards/settings';

const defaultColumns = ['Hari/Tgl', 'Mata Pelajaran', 'Waktu'];
const examples = [
  ['Senin, 10 Mar', 'Matematika', '07.30–09.30'],
  ['Selasa, 11 Mar', 'IPA', '10.00–12.00'],
];

export function ScheduleSettings({ initial, legacy, onApply }: {
  initial: ScheduleTable | null;
  legacy: string;
  onApply: (table: ScheduleTable) => void;
}) {
  const [columns, setColumns] = useState(initial?.columns ?? defaultColumns);
  const [rowCount, setRowCount] = useState(initial?.rowCount ?? 5);
  const [rows, setRows] = useState<string[][]>(initial?.rows ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const pending = useRef(false);
  const headers = columns.map((column) => column.trim());
  const invalid = headers.some((column) => !column) || new Set(headers.map((column) => column.toLowerCase())).size !== headers.length;

  function edit(next: string[]) {
    setColumns(next);
    setStatus('');
    setError('');
  }

  async function importFile(file: File) {
    if (pending.current || invalid) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const { readScheduleWorkbook } = await import('../../lib/participants/workbook');
      const imported = await readScheduleWorkbook(file, headers);
      setRows(imported);
      setRowCount(Math.max(2, imported.length));
      setStatus(`${imported.length} baris dimuat. Terapkan konfigurasi untuk memperbarui kartu.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'File jadwal gagal dibaca.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    setError('');
    try {
      const { createScheduleTemplate } = await import('../../lib/participants/workbook');
      const url = URL.createObjectURL(new Blob([createScheduleTemplate(headers, rowCount)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Template Jadwal.xlsx';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Template jadwal gagal dibuat.');
    }
  }

  return <div className="kop-body schedule-settings">
    <section className="schedule-callout">
      <h3>Format Jadwal Ujian</h3>
      <small>Atur kolom dan jumlah baris, lalu impor jadwal dari Excel. Jadwal berlaku untuk semua peserta saat opsi Tabel Jadwal di Kartu aktif.</small>
      {!initial && legacy && <small>Jadwal lama masih tampil pada kartu sampai konfigurasi tabel diterapkan.</small>}
    </section>
    <section>
      <div className="schedule-heading"><h3>Kolom Tabel Jadwal</h3><span>{columns.length} / 6</span></div>
      <small>Nama kolom menjadi header template Excel dan tabel kartu.</small>
      {columns.map((column, index) => <div className="schedule-column" key={index}>
        <span>{index + 1}</span>
        <input aria-label={`Nama kolom ${index + 1}`} maxLength={40} value={column} disabled={busy}
          onChange={(event) => edit(columns.map((name, i) => i === index ? event.target.value : name))} />
        <button className="action" type="button" aria-label={`Hapus kolom ${index + 1}`} disabled={busy || columns.length === 1}
          onClick={() => {
            edit(columns.filter((_, i) => i !== index));
            setRows(rows.map((row) => row.filter((_, i) => i !== index)));
          }}>×</button>
      </div>)}
      <button className="action schedule-add" type="button" disabled={busy || columns.length >= 6}
        onClick={() => {
          edit([...columns, '']);
          setRows(rows.map((row) => [...row, '']));
        }}>＋ Tambah Kolom</button>
      {invalid && <small>Isi nama yang berbeda untuk setiap kolom.</small>}
    </section>
    <section>
      <h3><label htmlFor="schedule-row-count">Jumlah Baris Tabel</label></h3>
      <small>Jumlah baris yang tampil di kartu (2–20), otomatis disesuaikan setelah impor.</small>
      <div className="schedule-range">
        <input id="schedule-row-count" type="range" min={2} max={20} value={rowCount} disabled={busy}
          onChange={(event) => { setRowCount(Number(event.target.value)); setStatus(''); }} />
        <output htmlFor="schedule-row-count">{rowCount}</output>
      </div>
    </section>
    <section>
      <h3>Preview Tabel</h3>
      <small>Abu-abu untuk ilustrasi, hijau untuk data Excel yang sudah diimpor.</small>
      <div className="schedule-table table-scroll">
        <table><thead><tr>{headers.map((header, i) => <th key={i} scope="col">{header || `Kolom ${i + 1}`}</th>)}</tr></thead>
          <tbody>{Array.from({ length: rowCount }, (_, row) => <tr key={row} data-example={row >= rows.length}>
            {headers.map((_, col) => <td key={col}>{row < rows.length ? rows[row][col] : examples[row % examples.length][col]}{'\u00a0'}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    <section className="schedule-download">
      <h3>Download Template Excel</h3>
      <small>Isi template dengan data jadwal, lalu impor pada bagian berikutnya.</small>
      <button className="action" type="button" disabled={invalid || busy} onClick={() => void downloadTemplate()}>Download Template Jadwal.xlsx</button>
    </section>
    <section>
      <h3>Import Data Jadwal <span>(opsional)</span></h3>
      <small>Header Excel harus cocok dengan template.</small>
      <label className="schedule-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) void importFile(file);
      }}>
        <strong>Klik untuk upload atau seret file ke sini</strong>
        <small>Format .xlsx / .xls, maks. 5 MiB</small>
        <input className="sr-only" aria-label="Unggah Excel jadwal" type="file" accept=".xlsx,.xls" disabled={invalid || busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) void importFile(file);
          }} />
      </label>
      {busy && <p role="status">Membaca jadwal…</p>}
      {error && <p role="alert">{error}</p>}
    </section>
    <button className="action schedule-apply" type="button" disabled={invalid || busy} onClick={() => {
      onApply({ columns: headers, rowCount, rows });
      setStatus('Konfigurasi jadwal diterapkan pada kartu untuk sesi ini.');
    }}>Terapkan Konfigurasi Jadwal</button>
    {status && <p role="status">{status}</p>}
  </div>;
}
