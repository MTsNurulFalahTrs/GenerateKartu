import Link from 'next/link';
import { AppBrand } from '../components/editor/page-chrome';
import { EditorIcon } from '../components/editor/editor-icon';
import styles from './home.module.css';

const steps = [
  ['Pilih format', 'Gunakan format bawaan, pilih format komunitas, atau susun kolom sendiri.', 'clipboard'],
  ['Impor data murid', 'Unduh template Excel, isi data peserta, lalu tambahkan foto jika diperlukan.', 'excel'],
  ['Sesuaikan kartu', 'Atur kop, logo, penandatangan, dan tata letak cetak.', 'edit'],
  ['Cetak atau unduh PDF', 'Periksa pratinjau A4 dan pilih peserta yang ingin dicetak.', 'printer'],
] as const;

export default function HomePage() {
  return <div className={styles.page}>
    <a className={styles.skip} href="#isi">Lewati ke konten</a>
    <header className={styles.header}>
      <div className={styles.shell}>
        <AppBrand />
        <nav aria-label="Navigasi beranda">
          <a className={styles.guide} href="#alur">Cara kerja</a>
          <Link className={styles.secondary} href="/editor">Buka editor <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
    <main id="isi">
      <section className={styles.hero}>
        <div className={styles.shell}>
          <div>
            <h1>Buat kartu peserta ujian dari Excel</h1>
            <p>Siapkan kartu ujian sekolah atau madrasah. Pilih format, impor data murid, lalu cetak atau unduh PDF yang siap dibagikan.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/editor">Mulai buat kartu <span aria-hidden="true">→</span></Link>
              <a href="#alur">Lihat cara kerja</a>
            </div>
            <p className={styles.privacy}><EditorIcon name="lock" /> Data murid dan foto diproses di browser Anda.</p>
          </div>
          <figure className={styles.preview}>
            <div className={styles.example}>
              <div className={styles.cardHeading}>
                <span><EditorIcon name="building" /></span>
                <div><strong>MADRASAH CONTOH</strong><small>KARTU PESERTA UJIAN</small></div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.photo}><EditorIcon name="user" /><small>Foto</small></div>
                <dl>
                  <div><dt>Nama</dt><dd>Peserta Contoh</dd></div>
                  <div><dt>No. Peserta</dt><dd>0001</dd></div>
                  <div><dt>Kelas</dt><dd>IX-A</dd></div>
                  <div><dt>Ruang</dt><dd>01</dd></div>
                </dl>
              </div>
            </div>
            <figcaption>Contoh kartu peserta ujian</figcaption>
          </figure>
        </div>
      </section>
      <section id="alur" className={`${styles.shell} ${styles.workflow}`}>
        <h2>Empat langkah dari data ke kartu</h2>
        <ol>
          {steps.map(([title, description, icon], index) => <li key={title}>
            <span className={styles.stepIcon}><EditorIcon name={icon} /></span>
            <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
            <h3>{title}</h3><p>{description}</p>
          </li>)}
        </ol>
      </section>
    </main>
    <footer className={styles.footer}>
      <div className={styles.shell}><span>Kartu Ujian Pro</span><a href="#isi">Kembali ke atas ↑</a></div>
    </footer>
  </div>;
}
