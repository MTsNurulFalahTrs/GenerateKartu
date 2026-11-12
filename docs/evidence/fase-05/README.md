# Fase 5 — Bootstrap dan kerangka antarmuka

## Implementasi

Next.js App Router, React, TypeScript strict dan Tailwind. Kerangka memakai nama, token warna, hierarki navigasi dan struktur editor dari [acuan Opsi B](../../VISUAL_PARITY_SPEC.md). Format 1–7 dapat dipilih. Tahap data, pengaturan dan cetak menyediakan keadaan awal untuk implementasi lanjutan. Tema berlaku untuk sesi tampilan editor. Nama font mengikuti acuan dengan fallback sistem saat font belum tersedia.

## Verifikasi lokal

| Pemeriksaan | Hasil |
| --- | --- |
| ESLint, TypeScript | Lulus. |
| Unit | 2 lulus, mencakup urutan editor, jumlah format dan navigasi keyboard. |
| Production build | Lulus pada Node 24.22.1 dan dependensi lokal yang tersedia. Rute /, /bantuan, favicon dan 404 dihasilkan. |
| Browser Chromium | Desktop 1440 × 1000 dan mobile 390 × 844 lulus. Uji klik format, navigasi keyboard, subtab, tema, Bantuan, 404, overflow dokumen dan galat runtime/hidrasi. |
| Instalasi bersih | Lockfile memuat dependensi terkunci. Percobaan npm ci offline berhenti karena tarball tidak tersedia di cache lokal. Workflow CI menjalankan instalasi bersih di runner jaringan. |

Fixture visual menampilkan Format 2 terpilih pada tema terang, DPR 1.

- [Screenshot desktop](format-desktop.jpg)
- [Screenshot mobile](format-mobile.jpg)

**G5 dan G-UI masih terbuka.** Screenshot menunjukkan kerangka baru. Baseline runtime legacy dan pembandingan visual masih diperlukan. Bukti Preview serta status CI mengikuti pemeriksaan pada PR. Konfigurasi Git Vercel menonaktifkan deployment otomatis dari `main`.
