import type { Metadata } from 'next';
import Link from 'next/link';
import { AppBrand, PageHeading } from '../../components/editor/page-chrome';
import { HelpShell } from '../../components/editor/help-shell';
import { steps } from '../../lib/editor';

export const metadata: Metadata = { title: 'Bantuan' };

const instructions = [
  'Pilih format dan gunakan pratinjau untuk memeriksa susunan kartu.',
  'Unggah Excel, cocokkan kolom, lalu terapkan impor. Tambahkan foto jika diperlukan.',
  'Sesuaikan KOP, ukuran kartu, dan jadwal ujian.',
  'Pilih kartu yang dibutuhkan, periksa pratinjau A4, lalu cetak atau unduh PDF.',
];

export default function HelpPage() {
  return <HelpShell>
    <a className="skip-editor" href="#help-content">Lewati ke isi bantuan</a>
    <header className="header">
      <div className="header-inner">
        <AppBrand />
        <Link className="action" href="/">Kembali ke editor</Link>
      </div>
    </header>
    <main className="content help-content" id="help-content" tabIndex={-1}>
      <PageHeading title="Bantuan" description="Panduan menyiapkan kartu peserta ujian." />
      <section className="panel" aria-labelledby="help-steps">
        <h2 id="help-steps">Langkah pembuatan kartu</h2>
        <ol className="help-steps">
          {steps.map((step, index) => <li key={step}>
            <strong>{step}</strong><p>{instructions[index]}</p>
          </li>)}
        </ol>
        <p>Gunakan panah kiri dan kanan saat fokus berada pada tab untuk berpindah langkah.</p>
      </section>
    </main>
  </HelpShell>;
}
