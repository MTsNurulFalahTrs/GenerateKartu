import type { Metadata } from 'next';
import Link from 'next/link';
import { steps } from '../../lib/editor';

export const metadata: Metadata = { title: 'Bantuan' };

export default function HelpPage() {
  return (
    <main className="content">
      <Link href="/">← Kembali ke editor</Link>
      <h1>Bantuan</h1>
      <p>Siapkan kartu peserta ujian dengan urutan berikut.</p>
      <ol className="list-decimal ps-6">
        {steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <p>Gunakan panah kiri dan kanan saat fokus berada pada tab untuk berpindah langkah.</p>
    </main>
  );
}
