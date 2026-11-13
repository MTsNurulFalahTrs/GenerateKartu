# UAT Fase 13 — Regresi, keamanan dan rekonsiliasi REA

| Cakupan | Bukti |
| --- | --- |
| Desktop, tablet, mobile dan lanskap | Smoke Chromium/Puppeteer yang sudah dipakai proyek, audit axe empat panel, pemeriksaan overflow, screenshot desktop/mobile. |
| File dan data | XLS/XLSX, ZIP foto sintetis, duplikat, backup rusak, kuota penyimpanan, 500 peserta. Tes ZIP menegakkan jumlah dan byte dekompresi serta CRC pada parser. |
| Keluaran | Parser PDF memeriksa cetak Chromium 56 halaman untuk 500 peserta dan ekspor aplikasi 2 halaman untuk 10 peserta. Urutan peserta diperiksa pada DOM cetak. |
| Privasi dan offline | Smoke memeriksa request eksternal, HTTP non-GET, dan penanda fixture pada URL. Filter pratinjau diuji offline setelah halaman termuat. |
| REA | [Ledger](RECONSTRUCTION_LEDGER.md) memetakan 30 kewajiban. [Matriks visual](VISUAL_PARITY_MATRIX.md) menautkan cakupan baseline yang tertunda. |

CI menjalankan instalasi bersih, lint, typecheck, unit, build, dan smoke. Screenshot berfungsi sebagai bukti tampilan aplikasi baru. Playwright, Firefox/WebKit, diff otomatis terhadap baseline, printer fisik, dan pemindaian QR dari hasil cetak masih terbuka.

**G13 belum lulus.** Kewajiban parsial, keputusan baris kata sandi CBT, audit dependensi lengkap dan pembandingan original belum ditutup. Lihat [laporan keamanan](evidence/fase-13/SECURITY_REPORT.md).
