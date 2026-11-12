import Link from 'next/link';

export default function NotFound() {
  return <main className="content"><h1>Halaman tidak ditemukan</h1><Link href="/">Kembali ke editor</Link></main>;
}
