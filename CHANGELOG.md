# Catatan Pembaruan Generate Kartu

## Cetak, PDF, dan riwayat pembaruan — PR #59–#65

- #65 · Catatan Pembaruan membaca changelog repositori saat aplikasi dibangun.
- #64 · Pratinjau Kertas mendukung zoom 50–300%, gulir dua arah, dan Pas ke Layar.
- #63 · Grid kartu menyesuaikan lebar layar. Modal kertas menampilkan ukuran lembar, halaman, dan jumlah kartu.
- #62 · PDF dan cetak memakai format aktif yang sama dengan pratinjau.
- #61 · Modal hasil batch menawarkan ulangi, lanjut, atau akhiri. Blok tanda tangan mengikuti margin bawah kartu.
- #60 · PDF dan cetak membagi keluaran menjadi maksimal 100 kartu per batch.
- #59 · Modal PDF menampilkan progres, jumlah kartu dan halaman, serta opsi batal sebelum unduhan otomatis.

## Pengaturan kertas, beranda, dan konsistensi editor — PR #53–#58

- #58 · Pengaturan teks, pilihan kolom, status jadwal, kontrol kertas, dan legenda margin diperjelas.
- #57 · Modal reset menjelaskan data yang terdampak dan menempatkan fokus awal pada Batal.
- #56 · Subtab Kertas Cetak mengatur ukuran, orientasi, margin tiap sisi, dan perataan untuk pratinjau, cetak, dan PDF.
- #55 · Tombol editor dan umpan balik diseragamkan. Validasi tampil dekat input yang perlu diperbaiki.
- #54 · Beranda responsif menyediakan contoh kartu, panduan singkat, dan akses langsung ke editor.
- #53 · Katalog Format dan tab Bantuan memakai tata letak masonry yang menyesuaikan layar.

## Pengelolaan komunitas, sesi, dan notifikasi — PR #44–#52

- #52 · Visibilitas toast diperbaiki, termasuk fallback untuk browser tanpa Popover API.
- #51 · Tombol hapus dipindah ke pojok kanan atas kartu komunitas, di atas jumlah kolom.
- #50 · Verifikasi PIN pemilik mendukung penyimpanan PIN numerik dan kompatibilitas konfigurasi hash lama.
- #49 · Pemilih ikon menampilkan pilihan aktif, pratinjau, ukuran, serta aksi ganti dan hapus unggahan ICO.
- #48 · Modal hapus memperjelas dampak penghapusan dan memberi petunjuk saat PIN salah.
- #47 · Kompatibilitas verifikasi konfigurasi bcrypt lama diperbaiki.
- #46 · Notifikasi disatukan melalui SweetAlert2 dengan maksimal tiga toast dan durasi dua detik.
- #45 · Sesi simpan satu jam mendapat hitung mundur dan peringatan lima menit. Modal mengunci gulir latar. Publikasi memvalidasi urutan kolom dan mendukung ikon bawaan atau ICO. Panel foto, impor, dan cetak diperbarui.
- #44 · Pemilik dapat menghapus format publik dengan PIN dan pembatasan percobaan.

## Format kustom, publikasi, dan bantuan — PR #34–#43

- #43 · Bantuan dipusatkan di editor. Modal Catatan Pembaruan, konfirmasi pemulihan cadangan, status simpan, dan validasi header Excel diperbarui.
- #42 · Publikasi memeriksa nama unik, merapikan nama kontributor, dan mendukung Password sebagai kolom format kustom.
- #41 · Kartu komunitas menampilkan kontributor, jumlah format, pencarian, dan Muat Ulang.
- #40 · Modal konfirmasi berbagi menampilkan pilihan nama kontributor atau anonim.
- #39 · Modal kustom menyelaraskan pilihan field, label, header Excel, urutan, Acuan Foto, dan Monospace.
- #38 · Penyimpanan katalog komunitas dipindah ke Neon PostgreSQL dengan kontrak API yang sama.
- #37 · Publikasi sukarela, validasi, deduplikasi, pratinjau, dan aktivasi format komunitas ditambahkan.
- #36 · Modal penyusun format kustom mengatur hingga enam baris dan mendukung pengurutan, Acuan Foto, serta Monospace.
- #35 · Pusat Bantuan menampilkan statistik sesi, panduan penggunaan, privasi, pintasan, dan FAQ.
- #34 · Judul, penanda langkah, panel, tema, dan tombol diselaraskan antarhalaman.

## Data Murid, layout kartu, dan cetak — PR #22–#33

- #33 · Ruang cetak menambah pencarian, filter kelas dan foto, sortir, reset, serta pratinjau keluaran.
- #32 · Impor yang selesai di latar menunggu tab Data Murid sebelum membuka modal.
- #31 · Tabel Jadwal mendukung hingga enam kolom, 2–20 baris, pratinjau, serta template dan impor Excel.
- #30 · Layout & Cetak menyelaraskan preset KTP, mode printer, dan sakelar QR, foto, serta jadwal.
- #29 · Ukuran, mode printer, dan tips cetak ditata ulang dengan akses ke opsi teks dan kolom lanjutan.
- #28 · Pemilihan sheet, pemetaan, pratinjau, dan validasi Excel dipindah ke modal impor.
- #27 · Panduan lokal menjelaskan konflik port 5500, cara menghentikan server statis, dan port alternatif.
- #26 · Perintah npm run local ditambahkan untuk menjalankan editor melalui localhost.
- #25 · Panel Pengaturan dan Cadangan distabilkan, serta ukuran kartu dan teks divalidasi sebelum keluaran.
- #24 · KOP & Identitas menampilkan logo, empat baris KOP, pratinjau langsung, dan pengaturan penandatangan.
- #23 · Ikon Format dan tata letak panel Excel, ZIP foto, foto per peserta, serta Preview Data Masuk diselaraskan.
- #22 · Katalog Format dan modal Preview mengikuti struktur aplikasi acuan, dengan pencarian dan penanda format aktif.

## Fondasi, pengujian, dan pemeliharaan — PR #1–#21

- #21 · Tailwind CSS diperbarui ke 4.3.5.
- #20 · ESLint diperbarui ke 10.14.0.
- #19 · Konfigurasi ESLint Next.js diperbarui ke 16.4.6.
- #18 · GitHub Actions setup-node diperbarui ke versi 7.
- #17 · GitHub Actions checkout diperbarui ke versi 7.
- #16 · SOP triase, backlog, Dependabot, dan pemeriksaan kualitas terjadwal ditambahkan.
- #15 · Bukti staging, kriteria penerimaan, dan prosedur pemulihan dirangkum.
- #14 · Pengujian privasi dan offline, header keamanan, audit dependensi, serta rekonsiliasi 30 kewajiban ditambahkan.
- #13 · Fokus, kontrol sentuh, tabel, dan tampilan lanskap diperbaiki. Audit aksesibilitas dan pengukuran performa ditambahkan.
- #12 · Format komunitas ditunda dari MVP lokal dan dijadwalkan sebagai pengembangan lanjutan.
- #11 · Preferensi berversi, ekspor JSON, pemulihan, reset terkonfirmasi, dan kedaluwarsa sesi ditambahkan.
- #10 · Cetak dan PDF multi-halaman ditambahkan dengan tata letak A4 serta validasi kelengkapan.
- #9 · Pratinjau real-time mendukung tampilan satu atau banyak kartu, filter, pencarian, dan paginasi.
- #8 · Foto, logo, KOP, layout, format kustom, jadwal, dan QR referensi ditambahkan.
- #7 · Impor XLS/XLSX lokal, pemetaan sheet, validasi, laporan CSV, dan template per format ditambahkan.
- #6 · Kerangka editor Next.js, tujuh format, navigasi langkah, tema, dan bantuan dibuat.
- #5 · Arsitektur aplikasi, kontrak data dan API, mesin cetak, serta model ancaman dirancang.
- #4 · Spesifikasi produk, wireframe responsif, dan 13 kriteria penerimaan disusun.
- #3 · Perilaku aplikasi acuan dipetakan dan 21 skenario direproduksi dengan data sintetis.
- #2 · Sumber aplikasi acuan diaudit untuk menyusun inventaris fitur dan 30 kewajiban.
- #1 · Fondasi repositori, aturan kontribusi, privasi data, dan kebijakan deployment ditetapkan.
