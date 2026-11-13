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

Buka [http://localhost:3000](http://localhost:3000) atau [http://127.0.0.1:3000](http://127.0.0.1:3000). Pertahankan terminal tetap terbuka. Tekan Ctrl+C untuk menghentikan server. Jika port 3000 sudah digunakan, jalankan `npm run local -- --port 3001` dan buka `http://localhost:3001`.

Jalankan `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build` untuk memeriksa perubahan. Untuk smoke test, jalankan `npm start` setelah build, lalu `npm run smoke` di terminal lain.

UI/UX, styling, alur utama, dan desain kartu asli menjadi acuan wajib. Modernisasi terkontrol mengikuti kebijakan [Opsi B dalam roadmap](docs/TAHAPAN_PEMBUATAN_DAN_PENGEMBANGAN_GENERATE_KARTU.md#11-kebijakan-desain-wajib--opsi-b-visual-parity--modernisasi-terkontrol).

- [Roadmap](docs/TAHAPAN_PEMBUATAN_DAN_PENGEMBANGAN_GENERATE_KARTU.md)
- [Panduan kontribusi](CONTRIBUTING.md)
- [Data uji dan rahasia](docs/DATA_DAN_RAHASIA.md)
- [Aturan deployment](docs/DEPLOYMENT.md)
- [Keputusan proyek](docs/DECISION_LOG.md)
- [Laporan Fase 0](docs/evidence/fase-00/README.md)
- [Laporan Fase 5](docs/evidence/fase-05/README.md)
