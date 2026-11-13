# Generate Kartu

Aplikasi untuk menyiapkan, mempratinjau, mencetak, dan mengekspor kartu peserta ujian sekolah dan madrasah. Target implementasi adalah Next.js App Router, React, TypeScript, dan Tailwind CSS.

## Jalankan di localhost

Gunakan Git dan Node.js 24 dengan npm. Buka PowerShell atau terminal, lalu jalankan:

```sh
git clone https://github.com/MTsNurulFalahTrs/GenerateKartu.git
cd GenerateKartu
npm ci
npm run local
```

Jika repositori sudah ada di komputer, jalankan `npm ci` dan `npm run local` dari folder repositori. Instalasi pertama membutuhkan koneksi internet untuk mengunduh dependensi. Editor lokal berjalan tanpa akun Vercel atau file `.env`.

Buka [http://localhost:5500](http://localhost:5500) atau [http://127.0.0.1:5500](http://127.0.0.1:5500). Pertahankan terminal tetap terbuka. Tekan Ctrl+C untuk menghentikan server. Jika port 5500 sudah digunakan, jalankan `npm run local -- --port 5501` dan buka `http://localhost:5501`.

### Jika browser menampilkan daftar folder proyek

Jika `http://127.0.0.1:5500` menampilkan folder seperti `app`, `components`, dan `docs`, port tersebut sedang dilayani server berkas statis. Di VS Code, klik indikator **Port: 5500** pada status bar untuk menghentikan Live Server jika aktif. Jika server statis dijalankan dari terminal, hentikan dari terminal tersebut dengan Ctrl+C.

Di terminal PowerShell yang berada di folder GenerateKartu, jalankan `npm ci` jika dependensi belum terpasang, lalu jalankan `npm run local`. Tunggu terminal menampilkan **Next.js** dan **Ready**, kemudian muat ulang [http://127.0.0.1:5500](http://127.0.0.1:5500). Jika terminal melaporkan `EADDRINUSE`, port masih dipakai proses lain. Gunakan `npm run local -- --port 5501` dan buka [http://127.0.0.1:5501](http://127.0.0.1:5501) jika proses itu masih diperlukan.

Jalankan `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build` untuk memeriksa perubahan. Untuk smoke test, jalankan `npm start` setelah build, lalu `npm run smoke` di terminal lain.

UI/UX, styling, alur utama, dan desain kartu asli menjadi acuan wajib. Modernisasi terkontrol mengikuti kebijakan [Opsi B dalam roadmap](docs/TAHAPAN_PEMBUATAN_DAN_PENGEMBANGAN_GENERATE_KARTU.md#11-kebijakan-desain-wajib--opsi-b-visual-parity--modernisasi-terkontrol).

- [Roadmap](docs/TAHAPAN_PEMBUATAN_DAN_PENGEMBANGAN_GENERATE_KARTU.md)
- [Panduan kontribusi](CONTRIBUTING.md)
- [Data uji dan rahasia](docs/DATA_DAN_RAHASIA.md)
- [Aturan deployment](docs/DEPLOYMENT.md)
- [Keputusan proyek](docs/DECISION_LOG.md)
- [Laporan Fase 0](docs/evidence/fase-00/README.md)
- [Laporan Fase 5](docs/evidence/fase-05/README.md)
