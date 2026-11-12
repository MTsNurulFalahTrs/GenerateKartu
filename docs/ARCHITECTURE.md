# Arsitektur teknis Generate Kartu

**Status** — rancangan Fase 4, siap ditinjau. Acuan [kontrak produk](DATA_CONTRACTS.md), [kriteria penerimaan](ACCEPTANCE_MATRIX.md) dan [Opsi B](VISUAL_PARITY_SPEC.md).

## Runtime dan batas data

| Modul | Tanggung jawab |
| --- | --- |
| `app/layout.tsx`, `app/page.tsx`, `app/bantuan/page.tsx` | Next.js App Router. Server Components membentuk shell, metadata dan konten statis. URL hanya membawa informasi navigasi umum. |
| `components/editor/` | Client Components untuk wizard Format → Data Murid → Pengaturan → Cetak Kartu. State peserta, aset, QR dan pilihan tetap di browser. Snapshot diambil saat konfirmasi cetak/ekspor. |
| `components/ui/`, `components/cards/` | Primitif aksesibel serta tampilan kartu berbasis model render. CSS layar dan cetak dipisahkan. |
| `lib/domain/`, `lib/contracts/` | Tipe, skema Zod, aturan format, pemilihan, jadwal dan perhitungan grid. Fungsi murni dapat diuji tanpa browser. |
| `lib/import/`, `lib/assets/`, `lib/export/`, `lib/storage/` | Parser, worker, decoding, QR, cetak/PDF dan retensi. Muat library besar saat aksi pertama. Modul yang menyentuh browser hanya diimpor dari jalur klien. |
| `app/api/community/` | Route Handlers opsional setelah persetujuan komunitas. MVP dapat dibangun dan berjalan tanpa rute ini, akun, database atau env secret. |
| `tests/`, `docs/` | Unit untuk skema dan grid, integrasi browser, fixture sintetis, bukti visual/cetak dan keputusan. |

Next.js dapat merender awal Client Components di server. Baca File, Canvas, DOM, storage dan worker melalui aksi/effect browser. Gunakan `import()` untuk pustaka dan `next/dynamic` dengan `ssr: false` dari Client Component ketika komponen memang perlu DOM saat pemuatan. Vercel menyajikan shell dan aset; pemrosesan file serta PDF tetap di perangkat. Route Handler komunitas kelak stateless. [Lazy loading Next.js](https://nextjs.org/docs/app/guides/lazy-loading) · [Runtime Vercel](https://vercel.com/docs/functions/runtimes)

## Pemetaan visual

| Legacy | React dan styling |
| --- | --- |
| Header kaca, merek, stepper, Bantuan | `AppHeader`, `EditorStepper`, `HelpPanel`. Pertahankan urutan, posisi, status aktif dan pola gulir. |
| Format, builder, modal contoh | `FormatPicker`, `CustomFormatEditor`, `FormatPreviewDialog`. Pertahankan grid, aksen violet dan struktur dialog. |
| Upload, tabel, foto dan setelan | `WorkbookImport`, `ParticipantTable`, `PhotoPanel`, `CardSettingsTabs`. Pertahankan dropzone, panel foto dan subtab Kop, Tata Letak, Jadwal. |
| Filter, preview, dialog cetak | `ParticipantFilters`, `CardPreview`, `PrintDialog`, `ExportProgress`. Pertahankan urutan kontrol dan ringkasan. |
| Tujuh format dan kustom | `CardView` dengan registry format bertipe, field terurut, kop, foto, QR, jadwal, logo dan tanda tangan. Ukuran fisik di CSS cetak memakai mm. |

Petakan token sumber ke CSS custom properties yang dirujuk utility Tailwind. Pertahankan indigo #6366f1/#4f46e5/#4338ca, warna status, gradien violet, peran font dan ikon. Gunakan komponen tanpa tema visual bawaan atau timpa token komponennya. Aset dan font di-host bersama aplikasi setelah lisensinya ditinjau. Referensi screenshot dan perubahan struktur Format CBT masih menunggu keputusan.

## Mesin cetak dan PDF

1. Bekukan urutan ID, format, setelan, aset dan referensi QR dalam satu snapshot. Gunakan revisi sesi dan kunci pekerjaan supaya perubahan filter, ekspor ganda atau reset tidak menghasilkan keluaran dari state campuran.
2. Hitung grid dari mm menggunakan integer mikrometer untuk menghindari pembulatan batas. A4 landscape 297 × 210, margin 8 dan gap 3 mengikuti usulan Fase 3. Area efektif 281 × 194. Kapasitas sumbu = floor((area + gap) / (ukuran kartu + gap)). Tolak ukuran yang tidak muat.
3. Bentuk halaman berurutan berisi slot dan kartu. Preview A4, HTML print dan PDF memakai model yang sama. Terapkan `@page` A4 landscape dan pemisah antarhalaman. Ukur kartu pada skala cetak 100%.
4. Tunggu font lokal, decode aset dan QR. Sediakan fallback font lokal yang diperiksa terhadap ukuran dan overflow. Bila aset yang diwajibkan gagal, hentikan output dan tampilkan tindakan pemulihan.
5. Render PDF per halaman dengan konkurensi rendah dan lepas canvas sesudah digunakan. Unduh setelah setiap ID dan jumlah halaman cocok. Cancel, reset atau expiry membatalkan pekerjaan dan membuang hasil parsial.

| Preset mm | Grid | Halaman untuk 1 / 9 / 10 / 60 / 132 / 500 |
| --- | --- | --- |
| 86 × 54 | 3 × 3 | 1 / 1 / 2 / 7 / 15 / 56 |
| 90 × 60 | 3 × 3 | 1 / 1 / 2 / 7 / 15 / 56 |
| 100 × 70 | 2 × 2 | 1 / 3 / 3 / 15 / 33 / 125 |

Angka merupakan hasil kalkulasi desain. Verifikasi browser, raster, QR dan printer menggunakan toleransi usulan ±1 mm pada AC-08. Catat perbedaan terukur dari legacy dalam tinjauan Opsi B.

## Dependensi dan layanan

| Kebutuhan | Rencana |
| --- | --- |
| Fondasi | Next.js App Router, React, TypeScript strict, Tailwind, Zod. Pin versi dan lockfile setelah build kompatibilitas. |
| Excel | Pilih parser dengan dukungan XLS/XLSX dan batas dekompresi. Versi yang dipakai replay legacy hanya acuan uji. Uji workbook nyata dan berbahaya sebelum memilih versi. |
| ZIP | Pilih parser dengan pembacaan bertahap dan batas output aktual, bukan hanya metadata ZIP. Uji kemampuan pembatalan worker. |
| QR/PDF | Pilih encoder QR lokal dan pustaka PDF browser setelah pengujian keterbacaan, ukuran, raster dan kapasitas. Jalankan uji beban 500 kartu. |
| Pengujian | Runner unit, Playwright dan parser PDF. CI memeriksa tipe, lint, uji, build, lisensi dan dependency audit. |
| Infrastruktur | Vercel untuk hosting, paket MVP tanpa database, storage server, antrean atau analytics pihak ketiga. Supabase/Auth/Postgres dipertimbangkan bila komunitas disetujui. |

Lihat [kontrak teknis](TECHNICAL_CONTRACTS.md), [model ancaman](THREAT_MODEL.md), dan [rencana migrasi](MIGRATION_PLAN.md).
