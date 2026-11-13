# Master Roadmap Pembuatan dan Pengembangan Generate Kartu

> **Versi:** 1.1  
> **Tanggal penyusunan:** 12 November 2026  
> **Repositori utama:** https://github.com/MTsNurulFalahTrs/GenerateKartu  
> **Referensi sumber aplikasi lama:** https://github.com/r4nd1pr4t4m4-arch/generatorkartu  
> **Acuan metodologi investigasi:** https://github.com/morluto/rea (Reverse Engineer Anything / REA)  
> **Target deployment:** Vercel  
> **Keputusan desain yang disahkan:** Opsi B — **Visual Parity + Modernisasi Terkontrol** (wajib; tidak boleh diubah sepihak)  
> **Status dokumen:** Rencana pelaksanaan, bukan bukti bahwa tahapan implementasi telah selesai.

## 1. Tujuan dan keputusan dasar

Generate Kartu dibangun ulang sebagai aplikasi web modern untuk membuat, mengatur, mempratinjau, mencetak, dan mengekspor kartu peserta ujian sekolah/madrasah. Rekonstruksi harus mempertahankan perilaku yang masih dibutuhkan dari aplikasi lama, memperbaiki kekurangan yang ditemukan, melindungi data peserta, dan dapat dijalankan pada Vercel.

**Keputusan utama:**

1. Gunakan `MTsNurulFalahTrs/GenerateKartu` sebagai satu-satunya repositori tujuan untuk pengembangan baru. Jangan mendorong kode ke repositori aplikasi lama.
2. Sumber lama adalah aplikasi Google Apps Script dengan `Code.gs` dan `Index.html`. Jangan menganggap kode lama sudah menggunakan Next.js.
3. REA dipakai sebagai **metodologi berbasis bukti**: inventarisasi perilaku, jejak sumber, fixture, *reconstruction obligation ledger*, perbandingan output, dan gerbang penerimaan. Jangan mengklaim REA MCP atau pengamatan runtime sudah dijalankan jika belum.
4. Target teknis: **Next.js App Router, React, TypeScript, Tailwind CSS, UI responsif**, dengan penguncian versi dependensi berdasarkan kompatibilitas yang benar-benar teruji. Utamakan pustaka stabil dan aksesibel; komponen dapat menggunakan shadcn/ui bila diperlukan. **Pilihan framework/komponen tidak boleh menjadi alasan untuk mengubah desain asli secara sepihak.**
5. Proses impor Excel, ZIP foto, pembuatan QR, pratinjau, dan rendering cetak dilakukan di browser bila memungkinkan. Jangan mengirim data siswa/foto ke server tanpa kebutuhan, dasar, dan persetujuan yang jelas.
6. **Supabase bersifat opsional** bagi fungsi inti cetak kartu; dipertimbangkan untuk akun, penyimpanan tersinkron, format komunitas, dan moderasi. Gunakan RLS dan kebijakan akses paling sedikit jika diaktifkan.
7. Setiap fase memakai **gate**. Fase berikutnya dimulai setelah pekerjaan, verifikasi, dan dokumentasi fase sebelumnya diterima; pekerjaan yang tidak lulus dicatat sebagai blocker.
8. Perubahan kode menggunakan cabang fitur dan Pull Request (PR), kecuali pembuatan dokumen awal pada repositori yang masih kosong. Deployment produksi dilakukan setelah gate rilis terpenuhi, bukan otomatis karena PR di-merge.
9. **Standar desain wajib:** pertahankan UI/UX, styling, dan identitas visual aplikasi asli melalui pendekatan **Visual Parity + Modernisasi Terkontrol**. Perubahan visual signifikan atau perubahan alur utama memerlukan **persetujuan eksplisit pengguna sebelum implementasi**.


### 1.1 Kebijakan desain wajib — Opsi B (Visual Parity + Modernisasi Terkontrol)

**Status keputusan: DISETUJUI PENGGUNA. Berlaku lintas semua fase, termasuk bila ada migrasi komponen ke Tailwind CSS, shadcn/ui, atau teknologi baru.** Aplikasi hasil rekonstruksi harus tetap mudah dikenali sebagai Generate Kartu asli, bukan aplikasi baru dengan desain yang diganti total.

#### A. Elemen yang wajib dipertahankan sebagai baseline

- **Identitas visual:** palet warna, gaya tipografi, ikon, bentuk/sudut komponen, kepadatan layout, hierarki, jarak, bayangan, border dan konsistensi styling khas aplikasi lama.
- **Struktur tampilan:** header, sidebar/navbar, tab/stepper, panel/editor, kartu, tabel, tombol, input, dropdown, modal, notifikasi, tata letak pratinjau dan urutan informasi.
- **Interaksi dan alur kerja:** perjalanan pengguna dari pilih format → isi/impor data → atur aset/opsi → preview → cetak/PDF; status aktif, toggle, expand/collapse, respons tombol, validasi dan perilaku yang masih relevan.
- **Desain keluaran kartu:** ketujuh format bawaan dan format kustom, kop, foto, teks, logo, QR, jadwal, tanda tangan, dimensi fisik kartu, margin, serta tata letak multi-halaman—kecuali perbedaan disengaja yang disetujui atau perbaikan bug yang terdokumentasi.
- **Pengalaman desktop dan mobile:** identitas yang sama pada kedua perangkat, bukan desain desktop dipaksakan pada layar kecil.

#### B. Modernisasi yang diizinkan tanpa persetujuan redesain terpisah

- Memperbaiki bug, perilaku tidak konsisten, overflow, pemotongan teks, z-index, focus trap, navigasi keyboard, kontras yang tidak aksesibel dan kegagalan pada perangkat mobile.
- Merapikan alignment, spacing yang tidak konsisten, touch target, label/feedback, empty/loading/error state serta performa, **selama tidak mengubah identitas visual dan alur utama**.
- Mengganti implementasi internal dengan komponen React/Tailwind tanpa mengganti tampilan yang terlihat pengguna.
- Memperbaiki kesalahan cetak/PDF dan menjamin hasil kartu tidak terpotong atau hilang, dengan catatan alasan dan bukti perbandingan.

Perubahan yang tampak berbeda tetapi kecil wajib dicatat sebagai `UX_DELTA` dalam ledger, dengan sebab, sebelum/sesudah, dampak dan hasil uji. Jangan menggunakan istilah 'modernisasi' sebagai izin untuk redesain total.

#### C. Perubahan yang wajib memperoleh persetujuan pengguna terlebih dahulu

- Mengganti branding, palet warna utama, font utama, gaya ikon global, bentuk kartu, gaya navigasi atau tata letak mayor.
- Menghapus/memindahkan kelompok fitur, mengubah urutan langkah, mengganti modal menjadi halaman baru atau merombak pola interaksi utama.
- Mengganti desain atau struktur informasi kartu peserta secara signifikan, mengubah ukuran fisik default, atau mengubah output cetak di luar perbaikan bug.
- Mengadopsi template/desain sistem baru (misalnya preset shadcn/ui/DaisyUI) yang mengubah karakter visual aplikasi.

**Mekanisme:** siapkan usulan visual sebelum/sesudah + alasan + dampak dan alternatif → minta persetujuan eksplisit → catat `DESIGN_DECISION` → baru implementasi. **Tanpa persetujuan, pertahankan baseline asli.**

#### D. Bukti visual yang wajib dikumpulkan dan diverifikasi

1. Kunci commit/versi legacy dan identifikasi URL/lingkungan aplikasi lama yang digunakan sebagai acuan. Tangkapan layar yang belum diperoleh tidak boleh dianggap ada.
2. Ambil baseline **desktop dan mobile** untuk halaman, langkah editor, setiap tab/panel, modal/dropdown penting, keadaan kosong/terisi/error, pratinjau dan 7 format kartu; gunakan data sintetis.
3. Rekam viewport, device pixel ratio bila relevan, browser, zoom, state, seed data, dan versi acuan untuk perbandingan yang dapat diulang.
4. Ambil screenshot hasil rekonstruksi dalam kondisi sama; lakukan perbandingan visual manual dan otomatis (bila tersedia). Bedakan selisih karena font/rendering browser dari perubahan desain nyata.
5. Buat **Visual Parity Matrix**: `screen/komponen | baseline | hasil | jenis perbedaan | alasan | approval | status`.
6. Lakukan uji interaksi/perilaku dan hasil cetak fisik/PDF secara terpisah; screenshot UI saja bukan bukti kesetaraan fungsi.
7. Jika UI legacy tidak dapat diakses, tandai `BASELINE_UNVERIFIED` dan **blokir klaim visual-parity accepted** sampai ada bukti atau keputusan pengecualian eksplisit.

#### E. Gate desain global (G-UI)

**G-UI berlaku pada G2, G3, G5, G7, G8, G9, G12, G13 dan G14.** Gate ini dinyatakan lulus jika:
- Baseline visual/interaksi untuk area yang diuji tersedia atau pengecualian tertulis telah disetujui.
- Tidak ada perubahan visual mayor/identitas/alur utama tanpa persetujuan pengguna.
- Perbedaan minor yang disengaja tercatat di `UX_DELTA` dan memiliki bukti manfaat serta uji regresi.
- Desain kartu dan hasil cetak mempertahankan struktur acuan, kecuali perbaikan yang disetujui.
- UI tetap responsif, aksesibel, dan tidak kehilangan fungsi.

**NO-GO:** redesain tanpa izin, perbedaan signifikan yang tidak terjelaskan, atau baseline tidak tersedia tetapi hasil diklaim 'identik/lulus visual parity'.

## 2. Kondisi awal dan batas fakta

Pada pemeriksaan awal 12 November 2026, repositori tujuan teridentifikasi **privat dan kosong**, dengan cabang bawaan bernama `main` serta izin tulis pada koneksi GitHub pemilik. Oleh karena itu, dokumen ini menjadi titik awal pengembangan. Kondisi ini harus diperiksa ulang sebelum setiap pekerjaan yang mengubah repositori.

Telah disusun **paket baseline rekonstruksi lokal terpisah** dari analisis sebelumnya. Paket tersebut belum menjadi konten repositori tujuan, belum lulus build Next.js dan uji browser menyeluruh, serta belum dideploy. Jangan memberi label 'selesai' untuk suatu fase hanya karena kode awalnya telah dibuat.

Sumber aplikasi lama pernah diinventarisasi memiliki format kartu bawaan 1–7, format kustom, impor/templat Excel, foto ZIP/individual, pengaturan kop dan tanda tangan, QR, jadwal, filter, cetak, PDF, pengaturan lokal, backup JSON, dan format komunitas. Seluruh klaim kesetaraan perilaku tetap harus dikonfirmasi memakai bukti uji.

**Tidak termasuk dalam komitmen MVP tanpa keputusan tambahan:** sinkronisasi otomatis ke sistem akademik lain, penyimpanan permanen biodata seluruh siswa di server, aplikasi native Android/iOS, integrasi pembayaran, dan layanan AI. Fitur dapat menjadi backlog tersendiri setelah MVP stabil.

## 3. Arsitektur target yang kompatibel dengan Vercel

| Lapisan | Pilihan / prinsip | Alasan |
|---|---|---|
| Frontend | Next.js App Router + React + TypeScript | Komponen modular, typing, routing, dan dukungan Vercel |
| Styling | Tailwind CSS + komponen UI aksesibel + CSS cetak khusus | Implementasi baru **harus mereproduksi visual asli**, bukan memakai estetika bawaan library; CSS khusus mengatur dimensi fisik cetak |
| Validasi | Zod + validasi file/ukuran/tipe | Validasi masukan dan struktur data |
| Excel | SheetJS / alternatif teruji | Baca `.xlsx` dan `.xls`, ekspor templat |
| Foto ZIP | JSZip / alternatif teruji; pembatasan ukuran dan jumlah | Ekstraksi foto pada sisi klien |
| QR | Pustaka QR teruji | Konten QR deterministik tanpa kredensial |
| Cetak | Print stylesheet HTML/CSS dan `window.print()` | Keluaran multi-halaman yang cocok untuk kertas |
| PDF | Pipeline klien berbasis pustaka yang diuji | Ekspor multi-halaman lengkap; tidak diam-diam hilang halaman |
| Penyimpanan lokal | State memori + localStorage/IndexedDB sesuai klasifikasi data | Tidak bergantung filesystem Vercel yang sementara |
| Backend opsional | Next.js Route Handlers + Supabase Auth/Postgres/RLS | Hanya untuk kebutuhan akun/format komunitas |
| CI/CD | GitHub Actions + Vercel Preview/Production | Quality gate dan rilis tertelusur |

**Larangan arsitektural:** tidak mengandalkan Google Apps Script pada runtime baru, tidak menyimpan data ke disk lokal function Vercel, tidak menjalankan proses server yang harus hidup terus, tidak membocorkan service-role key/API secret di browser, dan tidak menggunakan PIN hardcoded untuk aksi administratif.

## 4. Tata kelola pekerjaan

### 4.1 Aturan cabang dan PR

- Cabang `main` adalah sumber kebenaran untuk kode yang sudah diterima.
- Pola branch: `feat/fase-XX-ringkasan`, `fix/...`, `docs/...`, dan `chore/...`.
- Setiap PR mencantumkan cakupan, daftar file, bukti pengujian, isu keamanan, perubahan database, risiko, dan langkah rollback.
- PR tidak di-merge jika ada konflik, build gagal, tes wajib gagal, rahasia masuk repo, atau perubahan skema tanpa migrasi dan rollback.
- Merge ke `main` dan deployment **bukan** langkah tersirat; dilaksanakan sesuai instruksi dan gate penerimaan.
- Semua keputusan perubahan ruang lingkup dicatat dalam `docs/DECISION_LOG.md`.

### 4.2 Klasifikasi status

- `NOT_STARTED`: belum dikerjakan.
- `IN_PROGRESS`: dikerjakan, belum lulus gate.
- `BLOCKED`: ada prasyarat/gagal uji.
- `READY_FOR_REVIEW`: implementasi ada, bukti verifikasi tersedia.
- `ACCEPTED`: gate diterima; hasil dapat menjadi dasar fase berikutnya.

### 4.3 Bukti minimal per fase

Catat artefak, referensi commit/PR, hasil lint/typecheck/build/test, *screenshots* atau bukti output bila relevan, temuan, perbaikan, dan keputusan GO/NO-GO. Simpan bukti non-rahasia pada `docs/evidence/fase-XX/` atau CI artifacts sesuai ukuran/kerahasiaan. Jangan menyimpan data asli siswa atau kredensial dalam issue/PR/artifact publik.

## 5. Tahap implementasi berurutan

### Fase 0 — Inisialisasi repositori dan fondasi tata kelola

**Tujuan:** menyediakan fondasi aman untuk pengembangan di repositori baru.

**Pekerjaan:**
- [ ] Validasi metadata repo, pemilik, izin, default branch, status proteksi, dan integrasi Vercel.
- [ ] Buat `README.md`, `.gitignore`, `.editorconfig`, `.env.example`, dan struktur `docs/`.
- [ ] Tetapkan konvensi branch, PR template, issue template, commit, dokumentasi dan penomoran versi.
- [ ] Definisikan data uji sintetis, kebijakan data pribadi, pengelolaan secrets, dan pencatatan keputusan.
- [ ] Tetapkan aturan deployment: preview untuk PR; produksi hanya setelah gate rilis.
- [ ] Dokumentasikan baseline lokal sebagai **kandidat kode**, bukan hasil akhir atau sumber kebenaran.

**Keluaran:** struktur repo, standar kontribusi, keputusan arsitektur awal, template pelaporan.

**Gate G0:** repositori dapat diakses, commit awal terbaca, alur PR tersedia, dan tidak ada rahasia/data siswa di repo.

### Fase 1 — Akuisisi bukti dan audit statis sumber legacy

**Tujuan:** memahami secara menyeluruh fungsi yang benar-benar ada pada kode lama.

**Pekerjaan:**
- [ ] Pin versi commit `r4nd1pr4t4m4-arch/generatorkartu` yang dianalisis.
- [ ] Inventaris fungsi, konstanta, DOM, event, state, storage, panggilan Apps Script, dependency, dan titik ekspor.
- [ ] Petakan alur input → transformasi → preview → print/PDF dan format komunitas.
- [ ] Dokumentasikan keterkaitan fungsi terhadap elemen UI dan output.
- [ ] Inventarisasi design token dan gaya aktual: warna, font, spacing, ikon, header, navigasi, form, modal, tabel, panel, template kartu, serta CSS responsif asli.
- [ ] Susun *reconstruction obligation ledger* dengan ID unik, sumber, input, output, status, dan pengujiannya.
- [ ] Audit potensi rahasia, PIN, kredensial dalam QR, *unsafe HTML*, dan dependensi eksternal.
- [ ] Pastikan lisensi dan hak penggunaan kode/aset sumber ditinjau sebelum pemindahan literal.

**Keluaran:** `docs/LEGACY_INVENTORY.md`, `docs/RECONSTRUCTION_LEDGER.md`, `docs/SECURITY_FINDINGS.md`.

**Gate G1:** semua fitur legacy yang ditemukan memiliki ID, bukti statis, dan keputusan 'rekonstruksi/ubah/pensiunkan'; inventaris visual awal dan komponen kritis telah didaftarkan.

### Fase 2 — Eksplorasi perilaku aplikasi lama berbasis REA

**Tujuan:** memisahkan perilaku teramati dari asumsi berdasarkan source code.

**Pekerjaan:**
- [ ] Siapkan lingkungan atau URL aplikasi lama yang sah untuk diamati.
- [ ] Jalankan skenario positif, negatif, kosong, dan input rusak untuk fitur utama.
- [ ] Rekam tampilan desktop/mobile, alur klik, validasi, pesan gagal, konsol dan jaringan tanpa mengungkap data rahasia.
- [ ] Ambil screenshot baseline visual desktop/mobile lengkap dengan viewport, browser, state, dan seed data sintetis; rekam navigasi, modal, dropdown, stepper, bentuk tombol, ikon, warna, dan styling.
- [ ] Buat Visual Parity Matrix awal untuk seluruh layar dan ketujuh format, serta tandai area yang belum dapat diamati sebagai `BASELINE_UNVERIFIED`.
- [ ] Ambil sampel hasil cetak/PDF dari 1, 9, 10, 60, 132, dan 500 peserta sintetis.
- [ ] Amati Excel `.xlsx`/`.xls`, nama kolom berbeda, ID duplikat, ZIP foto, gambar gagal, dan jadwal.
- [ ] Catat ukuran kertas, dimensi kartu, margin, halaman, pemotongan elemen, logo dan tanda tangan.
- [ ] Jika runtime lama tidak dapat diakses, tandai kewajiban sebagai `UNOBSERVED`; jangan menebak kesetaraannya.

**Keluaran:** `docs/BEHAVIOR_SPEC.md`, fixture sintetis, matriks perbandingan, bukti screenshot dan cetak.

**Gate G2:** jalur kritis memiliki baseline observasi atau pengecualian eksplisit yang disetujui; baseline UI/UX visual telah diarsipkan dan **G-UI** terpenuhi.

### Fase 3 — Spesifikasi produk, ruang lingkup dan desain UX

**Tujuan:** mengesahkan perilaku yang akan dibangun sebelum implementasi penuh.

**Pekerjaan:**
- [ ] Susun PRD: persona operator ujian, alur kerja, prioritas MVP dan fitur lanjutan.
- [ ] Klasifikasikan 7 format bawaan dan format kustom beserta aturan masing-masing.
- [ ] Definisikan model data peserta, metadata institusi, jadwal, format, aset dan pengaturan.
- [ ] Tetapkan kebijakan QR: data minimal yang diperlukan; **jangan** memasukkan password atau rahasia.
- [ ] Tentukan pilihan penyimpanan dan retensi untuk data siswa, foto, logo serta tanda tangan.
- [ ] Susun wireframe responsif **turunan desain aplikasi asli**, state kosong/loading/error, alur keyboard dan aksesibilitas.
- [ ] Sahkan dokumen `docs/VISUAL_PARITY_SPEC.md` berisi inventaris komponen, token, screenshot acuan, dan daftar perbaikan terkontrol. Semua proposal perubahan besar wajib melalui mekanisme persetujuan pada §1.1.
- [ ] Tetapkan tujuan cetak yang bisa diukur (kecocokan dimensi fisik dan jumlah kartu).

**Keluaran:** `docs/PRD.md`, `docs/DATA_CONTRACTS.md`, `docs/UX_SPEC.md`, `docs/ACCEPTANCE_MATRIX.md`.

**Gate G3:** cakupan MVP, acceptance criteria dan perbedaan disengaja dari legacy disetujui; seluruh perubahan visual mayor telah disetujui pengguna atau dibatalkan, dan **G-UI** terpenuhi.

### Fase 4 — Desain teknis, keamanan dan kontrak integrasi

**Tujuan:** membuat rancangan implementasi yang tidak berbenturan dengan model runtime Vercel.

**Pekerjaan:**
- [ ] Struktur modul `app/`, `components/`, `lib/`, `tests/`, `docs/`.
- [ ] Rancang pemetaan komponen visual legacy ke React dan token styling Tailwind **tanpa mengganti identitas visual**; cegah pemakaian tema default yang merombak tampilan.
- [ ] Tentukan batas Server Component, Client Component, API Route, dan browser-only dynamic import.
- [ ] Definisikan tipe TypeScript, skema Zod, kontrak file, error taxonomy, dan limit sumber daya.
- [ ] Rancang print engine deterministik, ukuran mm, grid A4, pemecahan halaman, dan fallback font.
- [ ] Tentukan privasi: data siswa tidak dikirim ke backend secara default, pembatasan file/ZIP, cleanup.
- [ ] Bila format komunitas diaktifkan: desain auth, owner/contributor/moderator, PostgreSQL, RLS dan alur approval.
- [ ] Rancang logging tanpa PII, CSP, pembatasan endpoint, dan threat model sederhana.
- [ ] Putuskan layanan opsional tanpa menambah ketergantungan MVP yang tidak diperlukan.

**Keluaran:** `docs/ARCHITECTURE.md`, `docs/THREAT_MODEL.md`, kontrak API/data, rencana migrasi.

**Gate G4:** desain dapat dijalankan di Vercel, dependency terdokumentasi, model keamanan ditinjau.

### Fase 5 — Bootstrap Next.js dan kerangka antarmuka

**Tujuan:** memiliki aplikasi minimal yang benar-benar dapat dibangun dan di-preview.

**Pekerjaan:**
- [ ] Inisialisasi Next.js App Router + React + TypeScript + Tailwind CSS.
- [ ] Pilih dan pin versi dependensi setelah pemeriksaan kompatibilitas; commit lockfile.
- [ ] Bangun layout, navigasi, stepper, tema, halaman bantuan dan desain responsif **mengacu pada screenshot dan alur asli**, bukan template generik.
- [ ] Implementasikan token styling, komponen dasar, dan fixture visual untuk perbandingan baseline desktop/mobile.
- [ ] Siapkan global error/not-found/loading, metadata, favicon, dan batas viewport.
- [ ] Aktifkan ESLint, TypeScript strict, test runner, CI, dan `npm ci`/build.
- [ ] Buat Vercel Preview untuk PR, tanpa langsung mempublikasikan produksi.
- [ ] Tambahkan smoke test untuk route dasar dan kegagalan runtime/hydration.

**Keluaran:** skeleton aplikasi, konfigurasi Vercel dan pipeline CI aktif.

**Gate G5:** lint, typecheck, unit minimal, build produksi dan Preview smoke test semuanya lulus; baseline komponen dasar telah dibandingkan, dan **G-UI** terpenuhi.

### Fase 6 — Mesin data peserta dan impor/ekspor Excel

**Tujuan:** memastikan data masukan valid dan dapat ditelusuri.

**Pekerjaan:**
- [ ] Implementasi templat Excel per format beserta contoh dan header yang jelas.
- [ ] Implementasi impor `.xlsx` dan `.xls`, pilihan sheet, preview baris, mapping header.
- [ ] Validasi ID unik, nama, kelas, ruang, sesi, nilai kosong, baris duplikat, dan kolom wajib.
- [ ] Pesan galat menampilkan baris/kolom dan solusi; opsi mengunduh laporan kesalahan.
- [ ] Data siswa diolah lokal; ukur waktu proses dan konsumsi memori.
- [ ] Implementasi pencarian, filter, sort dan jumlah peserta terpilih.
- [ ] Sediakan fixture dan unit/integration test untuk batas input.

**Keluaran:** modul data peserta/Excel teruji dan dokumentasi mapping.

**Gate G6:** file valid terimpor lengkap; file salah ditolak informatif; tidak ada kehilangan baris diam-diam.

### Fase 7 — Foto, aset, institusi dan format kartu

**Tujuan:** membangun pengolahan aset dan variasi kartu.

**Pekerjaan:**
- [ ] Impor foto satuan dan ZIP; cocokkan nama file terhadap ID peserta; laporkan unmatched.
- [ ] Validasi MIME, dimensi, ukuran, jumlah, foto korup, dan ZIP berisiko; terapkan batas wajar.
- [ ] Koreksi orientasi EXIF jika diperlukan; resize/kompresi tanpa merusak keterbacaan.
- [ ] Input dan pratinjau kop, logo kiri/kanan, identitas institusi dan tanda tangan.
- [ ] Bangun 7 format bawaan berdasarkan ledger serta builder format kustom.
- [ ] Cocokkan tata letak, warna, tipografi, urutan field, kop/foto/QR, dan dimensi tiap format dengan baseline visual legacy; catat perbedaan di Visual Parity Matrix.
- [ ] Pengaturan warna/BW, dimensi, font, posisi teks, QR, foto, jadwal, serta visibilitas field.
- [ ] Validasi kombinasi setting dan lindungi dari markup berbahaya.

**Keluaran:** editor format dan asset pipeline.

**Gate G7:** semua format MVP dirender untuk fixture normal/ekstrem, tanpa kolom hilang atau kebocoran data QR; tampilan tiap format dibandingkan dengan sumber asli dan **G-UI** terpenuhi.

### Fase 8 — Preview real-time, layout dan navigasi editor

**Tujuan:** mewujudkan UX yang konsisten sebelum ekspor.

**Pekerjaan:**
- [ ] Preview satu kartu dan kumpulan kartu dengan data final yang sama seperti mode cetak.
- [ ] Pembaruan real-time ketika data, template, kop, foto, ukuran dan opsi berubah.
- [ ] Pagination/virtualisasi preview bila jumlah peserta besar; cegah UI freeze.
- [ ] Filter data yang dipratinjau dan opsi 'semua vs terpilih' yang eksplisit.
- [ ] Perbaiki mobile/tablet/desktop, navigasi keyboard, fokus, modal, toast dan empty state **tanpa mengubah pola navigasi dan identitas styling asli**.
- [ ] Bandingkan ulang screenshot UI dan alur edit real-time setiap layar kritis; dokumentasikan semua `UX_DELTA`.
- [ ] Perbaiki overflow, z-index, scroll dan tampilan mode terang/gelap.

**Keluaran:** editor dan preview terpadu.

**Gate G8:** tidak ada overflow tak terkontrol, UI stabil pada data kosong/banyak, preview cocok dengan model render final, dan **G-UI** terpenuhi.

### Fase 9 — Pencetakan multi-halaman dan PDF

**Tujuan:** menghasilkan keluaran yang lengkap, konsisten, dan siap dicetak.

**Pekerjaan:**
- [ ] Tata letak A4 portrait/landscape sesuai keputusan PRD; ukuran kartu dalam milimeter.
- [ ] Tentukan kapasitas kartu per halaman berdasarkan lebar/tinggi, margin dan jarak nyata.
- [ ] Pisahkan halaman secara deterministik; jangan memotong kartu, foto, kop atau QR.
- [ ] Cetak lewat browser dengan aturan `@page`, `break-*`, dan media print.
- [ ] Ekspor PDF untuk seluruh halaman, tunggu font/gambar/QR siap, dan berikan error yang jelas.
- [ ] Pastikan 1/9/10/60/132/500 kartu menghasilkan jumlah kartu tepat, termasuk halaman terakhir.
- [ ] Verifikasi ukuran PDF, urutan peserta, hasil QR scan, cetak hitam-putih dan printer berbeda.
- [ ] Bandingkan tampilan fisik kartu dan halaman cetak dengan baseline legacy; perubahan struktur/dimensi tanpa persetujuan = NO-GO.
- [ ] Cegah klaim 'berhasil' jika ada kartu atau halaman gagal dirender.

**Keluaran:** mesin cetak/PDF dan suite regression multipage.

**Gate G9:** seluruh halaman dan seluruh kartu masuk cetak/PDF, ukuran fisik diterima, bukti uji tersimpan; visual kartu telah diperbandingkan dan **G-UI** terpenuhi.

### Fase 10 — Pengaturan, persistensi, backup dan pemulihan

**Tujuan:** menjaga konfigurasi pengguna tanpa menyimpan PII secara berlebihan.

**Pekerjaan:**
- [ ] Tentukan penyimpanan mana yang hanya memori, localStorage, atau IndexedDB.
- [ ] Simpan preferensi tampilan, kop, format dan opsi cetak sesuai masa retensi yang disepakati.
- [ ] Implementasi ekspor/impor backup JSON baru dengan versi skema dan validasi.
- [ ] Buat konverter backup legacy secara aman jika kebutuhan kompatibilitas dikonfirmasi.
- [ ] Implementasi reset, konfirmasi hapus, masa kedaluwarsa dan pemulihan gagal impor.
- [ ] Uji refresh, tab tertutup, browser lain, private mode dan batas storage.

**Keluaran:** pengaturan, backup, parser versi dan panduan pemulihan.

**Gate G10:** konfigurasi dipulihkan benar, backup rusak tidak mengubah state, retensi dipatuhi.

### Fase 11 — Format komunitas dan backend opsional

**Status MVP:** `DEFERRED`. Lihat [keputusan dan verifikasi G11](evidence/fase-11/README.md).

**Tujuan:** menambahkan layanan berbagi format **hanya bila disahkan**; fungsi cetak lokal tetap berjalan tanpa Supabase.

**Pekerjaan:**
- [x] Tetapkan format komunitas sebagai rilis opsional setelah MVP (`DEFERRED`).
- [ ] Bila aktif, siapkan proyek Supabase yang benar, migrations versioned, Auth dan RLS.
- [ ] Definisikan role contributor/moderator/admin; tidak ada endpoint publik untuk delete bebas.
- [ ] Implementasi pengajuan, draft, review, approve/reject, read-only publik dan audit.
- [ ] Sanitasi data format; batasi ukuran payload; verifikasi hak akses di server dan RLS.
- [ ] Uji akses lintas-user, anonymous, revoked account dan failure mode provider.
- [ ] Siapkan backup/rollback migrasi; jangan membuat database atau menjalankan migrasi tanpa tujuan proyek yang jelas.

**Keluaran:** backend komunitas aman atau catatan keputusan `DEFERRED`.

**Gate G11:** bila dikerjakan, semua skenario authorization dan RLS lulus; bila ditunda, fitur tidak ditampilkan sebagai aktif.

### Fase 12 — Penyempurnaan UI/UX, aksesibilitas dan performa

**Tujuan:** menghadirkan pengalaman yang profesional dan mudah digunakan.

**Pekerjaan:**
- [ ] Audit seluruh komponen, form, tombol, filter, tabel, modal, drawer, interaksi dan error state.
- [ ] Rapikan hierarki visual, spacing, tipografi, ikon, ukuran target sentuh dan feedback **hanya dalam batas modernisasi terkontrol; jangan mengganti gaya global atau redesain layout**.
- [ ] Terapkan audit diff visual desktop/mobile dan daftar perubahan sebelum/sesudah. Ajukan perubahan mayor kepada pengguna terlebih dahulu, bukan sesudah implementasi.
- [ ] Optimalkan layar ponsel, tablet, desktop, resize dan orientasi.
- [ ] Tambahkan label, navigasi keyboard, fokus terlihat, semantic HTML dan kontras memadai.
- [ ] Ukur rendering 60/132/500 peserta, impor foto ZIP, memori dan latensi print/PDF.
- [ ] Profiling bundle, lazy loading modul berat, chunking/worker jika memberi manfaat nyata.

**Keluaran:** audit UI/UX dan performa sebelum rilis.

**Gate G12:** tidak ada bug UI kritis, alur utama aksesibel, sasaran performa yang disetujui tercapai, perubahan minor terdokumentasi, dan **G-UI** terpenuhi.

### Fase 13 — Uji menyeluruh, rekonsiliasi REA dan hardening keamanan

**Tujuan:** membuktikan kesetaraan fitur prioritas dan kelayakan operasional.

**Pekerjaan:**
- [ ] Tuntaskan semua obligation berstatus wajib melalui bukti pass atau keputusan pensiun fitur.
- [ ] Jalankan unit, integration, E2E Playwright dan screenshot regression.
- [ ] Audit Visual Parity Matrix untuk semua layar penting, tujuh format dan output cetak; setiap perbedaan mayor wajib punya keputusan persetujuan eksplisit, bukan diasumsikan telah disetujui.
- [ ] Uji responsif desktop/tablet/mobile, browser utama, data kosong/banyak dan input rusak.
- [ ] Audit file-upload, ZIP bomb, XSS, auth/RLS jika ada, dependency vulnerabilities dan secrets.
- [ ] Uji cetak/PDF multi-halaman dengan parser PDF, bukan semata inspeksi halaman pertama.
- [ ] Uji jaringan offline/putus jika fitur lokal menjanjikannya.
- [ ] Catat severity temuan, reproduksi, fix, regression dan residual risk.
- [ ] Audit privasi: tidak ada data siswa atau foto yang terkirim tanpa izin.

**Keluaran:** `docs/UAT_REPORT.md`, matriks parity, security report, hasil CI/E2E.

**Gate G13:** tidak ada bug P0/P1 terbuka; obligation wajib accepted; hasil cetak dan data akurat; **G-UI** lulus dengan bukti visual parity dan daftar `UX_DELTA`.

### Fase 14 — Staging Vercel, produksi dan penerimaan

**Tujuan:** meluncurkan aplikasi dengan rollback yang jelas dan pengamatan pascarilis.

**Pekerjaan:**
- [ ] Periksa kembali repo dan konfigurasi proyek Vercel yang benar.
- [ ] Pastikan domain, framework, root directory, Node runtime, lockfile dan environment variables valid.
- [ ] Preview/staging dari commit spesifik; jalankan smoke, UAT peran operator, dan cetak nyata.
- [ ] Lakukan UAT visual bersama acuan asli untuk desktop/mobile dan seluruh format kartu; pastikan tidak ada perubahan desain besar tanpa persetujuan.
- [ ] Jika menggunakan Supabase, aplikasikan migration terotorisasi dan uji RLS, backup/rollback.
- [ ] Review keamanan headers, rate-limit endpoint, observability dan pengelolaan PII.
- [ ] Lakukan release checklist dan catat commit SHA, build ID, URL, hasil uji.
- [ ] Produksi hanya setelah persetujuan gate; dokumentasikan rollback dan cara pemulihan.
- [ ] Verifikasi produksi dengan data sintetis dan pastikan tidak ada regresi kritis.

**Keluaran:** aplikasi produksi, release notes, SOP, bukti deployment dan rollback.

**Gate G14:** produksi dapat diakses, semua jalur kritis lolos smoke, rollback siap, pengesahan rilis tercatat, dan **G-UI** telah diverifikasi.

### Fase 15 — Operasional, pemeliharaan dan iterasi fitur lanjutan

**Tujuan:** mempertahankan keandalan dan mengembangkan fitur berdasar kebutuhan nyata.

**Pekerjaan:**
- [ ] Monitor error, performa dan kapasitas tanpa menyimpan identitas siswa secara tidak perlu.
- [ ] Terapkan alur triase bug, patch keamanan, update dependency dan regression test berkala.
- [ ] Evaluasi umpan balik operator, dokumentasi bantuan dan kemudahan penggunaan.
- [ ] Nilai backlog: integrasi sistem akademik, format lanjutan, kolaborasi, impor massal lebih besar, dan sebagainya.
- [ ] Tinjau retention/backup, akses kontributor, audit komunitas dan biaya layanan jika aktif.
- [ ] Pertahankan ledger, changelog, SOP, matriks fitur dan keputusan arsitektur tetap sinkron.

**Keluaran:** SOP operasional, backlog prioritas dan laporan evaluasi.

**Gate G15:** mekanisme pemeliharaan berjalan dan perubahan baru mengikuti siklus PR → CI → Preview → penerimaan.

## 6. Peta fase terhadap milestone

| Milestone | Fase | Hasil yang harus terbukti |
|---|---|---|
| M0 — Foundation | 0–4 | Repo siap, kewajiban legacy dan desain disahkan |
| M1 — MVP data & template | 5–7 | Build Next.js lolos; Excel, foto, 7 format/builder dapat digunakan |
| M2 — Print-ready | 8–10 | Preview, cetak multipage, PDF, backup stabil |
| M3 — Optional services | 11 | Komunitas aman dengan Auth/RLS, atau resmi ditunda |
| M4 — Release candidate | 12–13 | UX, keamanan, parity dan UAT diterima |
| M5 — Go-live | 14 | Deployment Vercel dan SOP rollback terverifikasi |
| M6 — Maintenance | 15 | Monitoring dan pengembangan berkelanjutan |

**Jalur kritis MVP:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 12 → 13 → 14. Fase 11 opsional sesuai keputusan scope; fase 15 sesudah rilis.

## 7. Matriks pengujian minimal

| Area | Skenario wajib | Kriteria lulus |
|---|---|---|
| Excel | XLS, XLSX, kosong, header salah, ID duplikat, ratusan baris | Jumlah, field dan validasi tepat |
| Foto | Foto individual, ZIP, mismatch, rusak, ukuran berlebihan | Mapping benar; error aman dan jelas |
| Template | 7 bawaan, kustom, field panjang, tanpa foto | Output sesuai spesifikasi tanpa clipping tak disetujui |
| QR | Scan QR dari preview dan PDF | Payload benar dan tidak berisi password/secret |
| Filter | Nama, kelas, ruang, sesi, ada/tanpa foto | Hanya record yang dipilih diproses |
| Cetak | 1, 9, 10, 60, 132, 500 kartu sintetis | Semua kartu tampil, urutan dan jumlah tepat |
| PDF | Multi-halaman, foto lambat, font/QR pending, gagal render | Tidak ada halaman hilang; error terlaporkan |
| Penyimpanan | Backup valid/rusak, TTL, refresh, reset | State konsisten; data sensitif tidak tersimpan berlebihan |
| Komunitas opsional | Anonymous, contributor, moderator, admin | RLS/permission benar; tidak bisa delete ilegal |
| UI/UX | Ponsel/tablet/desktop, portrait/landscape, keyboard | Interaksi jelas dan tanpa overflow kritis |
| **Visual parity (wajib)** | Screenshot kondisi setara pada desktop/mobile, komponen dan 7 template dibandingkan dengan legacy | Identitas dan alur utama tetap dikenali; perbedaan minor terdokumentasi; **perbedaan mayor wajib persetujuan pengguna** |
| Vercel | npm ci, typecheck, lint, test, build, Preview, produksi | Rilis dapat direproduksi dari commit |

Gunakan data siswa **sintetis** dalam semua CI, screenshot, PR, dan laporan yang dibagikan.

## 8. Matriks fitur legacy dan prioritas rekonstruksi

| ID | Fitur | Prioritas awal | Fase utama |
|---|---|---|---|
| RE-01 | Tujuh format kartu bawaan | P0 | 7 |
| RE-02 | Format kustom / builder | P0 | 7 |
| RE-03 | Templat Excel | P0 | 6 |
| RE-04 | Impor Excel peserta | P0 | 6 |
| RE-05 | Impor ZIP foto | P0 | 7 |
| RE-06 | Unggah foto individual | P0 | 7 |
| RE-07 | Kop, logo, tanda tangan | P0 | 7 |
| RE-08 | Ukuran, warna, foto, QR | P0 | 7–9 |
| RE-09 | Jadwal ujian | P1 | 7–9 |
| RE-10 | Filter dan pencarian | P0 | 6, 8 |
| RE-11 | Rendering jumlah besar | P1 | 8, 12 |
| RE-12 | QR tanpa kredensial | P0 keamanan | 7, 13 |
| RE-13 | Cetak browser | P0 | 9 |
| RE-14 | Ekspor PDF | P0 | 9 |
| RE-15 | Pengaturan lokal/TTL | P1 | 10 |
| RE-16 | Backup JSON/konversi legacy | P1 | 10 |
| RE-17 | Baca format komunitas | P2 / opsional | 11 |
| RE-18 | Hapus/admin komunitas aman | P2 / opsional | 11 |
| RE-19 | Tema/navigasi/bantuan | P1 | 5, 12 |
| RE-20 | Runtime Vercel/Next.js | P0 | 5, 14 |
| RE-21 | Integritas seluruh kartu/PDF | P0 keamanan & data | 9, 13 |
| RE-22 | Pemrosesan lokal data siswa/foto | P0 privasi | 4, 6–13 |
| RE-23 | Kontributor dan moderasi komunitas | P2 / opsional | 11 |
| RE-24 | Detail kop dan kontrol visual lanjutan | P1 | 7–9 |
| RE-25 | Shortcut dan perilaku pendukung legacy | P2 | 12 |

Catatan: status pada tabel adalah **prioritas rencana**, bukan klaim selesai. Setiap kewajiban wajib diikat ke test case dan kode final setelah implementasi.

## 9. Aturan kelulusan dan penanganan hambatan

Setiap fase ditutup dengan laporan singkat:

- **Identitas:** nama fase, tanggal, commit/PR, penanggung jawab.
- **Implementasi:** perubahan modul, kontrak atau database.
- **Verifikasi:** daftar perintah dan hasil aktual; lampiran bukti.
- **Temuan:** blocker, severity, akar masalah dan perbaikan.
- **Status:** GO / NO-GO beserta alasan.
- **Langkah berikutnya:** fase dan pekerjaan yang diizinkan.

Sebuah fase dinyatakan **NO-GO** bila:
1. CI build/typecheck/lint/test yang diwajibkan gagal.
2. Output cetak/PDF kehilangan peserta atau halaman tanpa pesan kesalahan.
3. Data pribadi siswa terunggah/terpublikasi di tempat yang tidak disetujui.
4. Ada kerentanan kritis pada jalur yang akan dirilis.
4a. Ada perubahan besar pada warna, tipografi, ikon global, navigasi, layout utama atau desain kartu **tanpa persetujuan pengguna**, atau klaim visual parity tanpa bukti perbandingan.
5. Database atau deployment menunjuk proyek/lingkungan yang belum diverifikasi.
6. Fitur wajib masih OPEN/PARTIAL tanpa keputusan pengurangan scope yang eksplisit.

**Tidak boleh mengaku telah merge, migrate, deploy, atau lulus build tanpa bukti eksekusi nyata.**

## 10. Urutan kerja yang direkomendasikan mulai sekarang

1. Pertahankan dokumen ini pada repositori utama sebagai acuan; lakukan update jika keputusan berubah.
2. Jalankan **Fase 0** untuk melengkapi bootstrap repo, README, keamanan dan alur PR.
3. Lanjutkan **Fase 1–4** untuk penguncian bukti dan kontrak sebelum mengimpor paket kode baseline.
4. Evaluasi paket baseline sebelumnya di branch fitur, jalankan install, lint, typecheck, build dan tes; perbaiki gap sebelum merge.
5. Kerjakan fase berikutnya hanya setelah gate masing-masing terpenuhi; utamakan kelengkapan cetak/PDF multi-halaman dan perlindungan data siswa.

## 11. Lampiran: struktur dokumentasi yang disarankan

- `README.md` — pengenalan proyek dan panduan singkat.
- `docs/TAHAPAN_PEMBUATAN_DAN_PENGEMBANGAN_GENERATE_KARTU.md` — roadmap ini.
- `docs/LEGACY_INVENTORY.md` — hasil pembacaan statis source lama.
- `docs/RECONSTRUCTION_LEDGER.md` — kewajiban rekonstruksi dan status terkini.
- `docs/BEHAVIOR_SPEC.md` — perilaku legacy yang teramati.
- `docs/PRD.md` — keputusan fitur dan ruang lingkup.
- `docs/ARCHITECTURE.md` — arsitektur dan alasan desain.
- `docs/DATA_CONTRACTS.md` — skema input/output.
- `docs/SECURITY_FINDINGS.md` dan `docs/THREAT_MODEL.md`.
- `docs/UX_SPEC.md`, `docs/ACCEPTANCE_MATRIX.md`, `docs/UAT_REPORT.md`.
- `docs/VISUAL_PARITY_SPEC.md` — standar visual asli, screenshot baseline, token desain dan Visual Parity Matrix.
- `docs/UX_DELTA.md` — perbaikan UI/UX terkontrol (sebelum/sesudah, alasan, dampak, pengujian dan status persetujuan).
- `docs/DEPLOYMENT.md`, `docs/RUNBOOK.md`, `docs/DECISION_LOG.md`.
- `docs/evidence/fase-XX/` — bukti uji non-sensitif.

---

**Prinsip akhir:** setiap tahap harus menghasilkan artefak yang dapat diperiksa, setiap klaim kesetaraan harus didukung bukti, dan setiap rilis harus dapat diuji serta dipulihkan. **Keputusan Opsi B—Visual Parity + Modernisasi Terkontrol adalah syarat wajib lintas fase, bukan saran opsional.** Dokumen ini akan diperbarui seiring kemajuan implementasi yang benar-benar tervalidasi.
