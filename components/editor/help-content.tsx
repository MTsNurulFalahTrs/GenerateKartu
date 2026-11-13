'use client';

import { MasonryGrid } from './masonry-grid';

import { useEffect, useRef, useState } from 'react';
import { PageHeading } from './page-chrome';
import { EditorIcon } from './editor-icon';
import { formats } from '../../lib/editor';
import { maxParticipants } from '../../lib/participants/model';

const instructions = [
  ['Pilih format', 'Pilih format bawaan atau susun format kustom. Gunakan Preview untuk memeriksa hasilnya.'],
  ['Unggah data', 'Unduh template Excel dari Data Murid, isi datanya, lalu cocokkan kolom sebelum menerapkan impor.'],
  ['Tambahkan foto (opsional)', 'Unggah foto satu per satu atau dalam ZIP. Nama berkas harus sesuai dengan Acuan Foto pada format aktif.'],
  ['Atur kartu', 'Isi KOP, logo, penandatangan, ukuran kartu, dan jadwal sesuai kebutuhan.'],
  ['Cetak kartu', 'Pilih peserta, periksa Pratinjau A4, lalu cetak atau unduh PDF.'],
];

const faq = [
  ['Bagaimana cara mengganti logo madrasah atau sekolah?', 'Buka Pengaturan → KOP & Identitas, lalu pilih Pasang Logo Kiri atau Pasang Logo Kanan. Gunakan PNG atau JPEG dengan ukuran maksimal 2 MiB.'],
  ['Mengapa nama foto harus sama dengan kolom ID?', 'Aplikasi mencocokkan nama berkas tanpa ekstensi dengan nilai pada kolom Acuan Foto. Periksa penanda tersebut di format aktif.'],
  ['Berapa banyak murid yang bisa diproses sekaligus?', `Satu sheet Excel dapat memuat hingga ${maxParticipants.toLocaleString('id-ID')} baris peserta.`],
  ['Apakah saya bisa membuat format kartu sendiri?', 'Ya. Pilih Atur pada Format Kustom, lalu susun kolom yang dibutuhkan.'],
  ['Bagaimana cara mencadangkan pengaturan?', 'Gunakan Ekspor Konfigurasi di tab Pengaturan. Gunakan Impor Konfigurasi untuk memulihkannya.'],
  ['Apa yang terjadi setelah satu jam tanpa aktivitas?', 'Data peserta dan aset sesi dibersihkan. Preferensi tampilan yang tersimpan di browser tetap dapat digunakan.'],
  ['Bisakah saya mencetak kartu untuk kelas tertentu?', 'Ya. Pilih kelas pada Filter Cetak, lalu periksa jumlah kartu sebelum mencetak.'],
  ['Apa yang harus dilakukan jika hasil cetak terpotong?', 'Periksa Pratinjau A4, gunakan skala 100% dan margin Tidak Ada. Jika isi kartu melebihi batas, sesuaikan ukuran di Layout & Cetak.'],
  ['Apakah format komunitas tersedia?', 'Ya. Centang opsi berbagi saat menyimpan Format Kustom untuk menambahkannya ke katalog publik di tab Format.'],
];

const releaseNotes = [
  { title: 'Format dan komunitas', entries: [
    'Membuat format kartu kustom dengan pengaturan field, label tampilan, header Excel, urutan, dan Acuan Foto.',
    'Membagikan format ke katalog komunitas dengan konfirmasi serta nama kontributor atau opsi anonim.',
    'Mencari format, memfilter format bawaan/komunitas, dan melihat pratinjau sebelum memilih.',
  ] },
  { title: 'Data murid dan hasil kartu', entries: [
    'Mengimpor XLS/XLSX, memetakan kolom dan memvalidasi data murid sebelum dipakai.',
    'Menggunakan foto peserta dan mencetak kartu dalam tata letak A4 atau mengunduh PDF.',
  ] },
  { title: 'Pengaturan dan keamanan', entries: [
    'Mengatur KOP, penandatangan, ukuran kartu, tampilan cetak, jadwal, serta backup JSON preferensi.',
    'Data peserta dan foto diproses secara lokal di browser; metadata format komunitas tidak memuat data murid.',
  ] },
] as const;

function ReleaseNotesDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);

  return <dialog ref={dialog} className="format-dialog release-notes-dialog"
    aria-labelledby="release-notes-title" aria-describedby="release-notes-description"
    onClose={onClose}>
    <header className="release-notes-header">
      <span className="release-notes-icon"><EditorIcon name="document" /></span>
      <div><h2 id="release-notes-title">Catatan Pembaruan</h2>
        <p id="release-notes-description">Ringkasan perubahan dan kemampuan GenerateKartu.</p></div>
      <button type="button" className="action" aria-label="Tutup catatan pembaruan"
        onClick={() => dialog.current?.close()}>×</button>
    </header>
    <div className="release-notes-body">
      <div className="release-notes-summary"><strong>Kartu Ujian Pro</strong>
        <span>Fitur terbaru dapat digunakan langsung dari tab aplikasi tanpa membuka situs lain.</span>
      </div>
      {releaseNotes.map(({ title, entries }, index) => <section className="release-notes-group" key={title}>
        <div className="release-notes-group-heading"><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3></div>
        <ul>{entries.map((entry) => <li key={entry}>{entry}</li>)}</ul>
      </section>)}
      <p className="release-notes-privacy">Perubahan akan terus diperbarui dalam aplikasi. Gunakan tab Bantuan untuk langkah penggunaan dan FAQ.</p>
    </div>
    <footer className="release-notes-footer">
      <button type="button" className="action data-next" onClick={() => dialog.current?.close()}>Mengerti</button>
    </footer>
  </dialog>;
}

export function HelpContent({ participants = 0, photos = 0, communityCount, inEditor = false }: {
  participants?: number;
  photos?: number;
  inEditor?: boolean;
  communityCount?: number;
}) {
  const prefix = inEditor ? 'editor-help' : 'help';
  const [notesOpen, setNotesOpen] = useState(false);
  const noteButton = useRef<HTMLButtonElement>(null);
  const stats = [
    [formats.length + 1 + (communityCount ?? 0), 'Format tersedia', 'table'],
    [participants, 'Murid termuat', 'user'],
    [photos, 'Foto tersimpan', 'image'],
    ...(communityCount === undefined ? [] : [[communityCount, 'Format komunitas', 'users'] as const]),
  ] as const;
  return <>
    <PageHeading title="Pusat Informasi & Bantuan"
      description="Panduan penggunaan, privasi, dan pencetakan kartu peserta."
      actions={<>
        <a className="action" href={`#${prefix}-shortcuts`}>Pintasan Keyboard</a>
        <a className="action" href={`#${prefix}-faq`}>FAQ</a>
      </>} />
    <dl className="panel help-stats">
      {stats.map(([count, label, icon]) => <div key={label}>
        <span className="format-icon"><EditorIcon name={icon} /></span>
        <dt>{label}</dt><dd>{count}</dd>
      </div>)}
    </dl>
    <MasonryGrid className="help-grid">
      <section className="panel">
        <h2>Tentang Aplikasi</h2>
        <p>Kartu Ujian Pro membantu panitia ujian sekolah dan madrasah menyiapkan kartu peserta dari data Excel, memeriksa tata letak, dan mencetak kartu atau mengunduhnya sebagai PDF.</p>
        <button type="button" ref={noteButton} className="action help-release-button"
          aria-haspopup="dialog" onClick={() => setNotesOpen(true)}>
          <EditorIcon name="document" /> Catatan Pembaruan
        </button>
      </section>
      <section className="panel">
        <h2>Tata Cara Penggunaan</h2>
        <ol className="help-steps">
          {instructions.map(([title, description]) => <li key={title}><strong>{title}</strong><p>{description}</p></li>)}
        </ol>
      </section>
      <section className="panel">
        <h2>Privasi &amp; Keamanan Data</h2>
        <ul className="help-notices">
          <li>File Excel dan foto murid diproses di browser Anda.</li>
          <li>Preferensi disimpan di browser. Isi KOP, jadwal, foto, dan aset berlaku selama sesi.</li>
          <li>Setelah satu jam tanpa aktivitas, data peserta dan aset sesi dibersihkan.</li>
        </ul>
      </section>
      <section className="panel">
        <h2>Panduan Penggunaan</h2>
        <ul className="help-rules">
          <li>Gunakan data peserta yang telah diperiksa sebelum mencetak.</li>
          <li>Periksa hasil pratinjau dan ukuran kartu sebelum mencetak satu angkatan.</li>
          <li>Gunakan Reset untuk membersihkan data sesi saat selesai di komputer bersama.</li>
        </ul>
        <div id={`${prefix}-shortcuts`} className="help-shortcuts">
          <h3>Pintasan Keyboard</h3>
          <p><kbd>←</kbd> dan <kbd>→</kbd> berpindah langkah saat fokus berada pada tab. <kbd>Home</kbd> dan <kbd>End</kbd> menuju langkah awal dan akhir.</p>
          <p><kbd>Esc</kbd> menutup dialog pratinjau atau impor.</p>
        </div>
      </section>
      <section className="panel help-faq" data-masonry-full id={`${prefix}-faq`}>
        <h2>FAQ — Pertanyaan yang Sering Diajukan</h2>
        {faq.map(([question, answer]) => <details key={question}>
          <summary>{question}</summary><p>{answer}</p>
        </details>)}

      </section>
    </MasonryGrid>
    {notesOpen && <ReleaseNotesDialog onClose={() => {
      setNotesOpen(false);
      requestAnimationFrame(() => noteButton.current?.focus());
    }} />}
  </>;
}
