# Matriks penerimaan Fase 3

Seluruh kriteria adalah target untuk implementasi berikutnya. Bukti isolasi legacy terdapat pada [Fase 2](BEHAVIOR_SPEC.md).

| ID | Area | Kriteria yang dapat diuji |
| --- | --- | --- |
| AC-01 | Format | Ketujuh format sesuai kontrak kolom dan urutan tampilan. Format kustom dapat menambah, menghapus, mengurutkan dan menetapkan satu ID. |
| AC-02 | Template | Workbook tiap format dapat diimpor kembali dengan jumlah dan pemetaan kolom yang sama. |
| AC-03 | Excel | XLS/XLSX, pilihan sheet, kapitalisasi header dan nol awal valid. Uji workbook rusak/kosong, header ambigu, ID duplikat dan kolom wajib kosong. Data sebelumnya tetap utuh saat impor ditolak. |
| AC-04 | Foto | Foto satuan dan ZIP cocok ke peserta yang tepat. Laporkan entry asing, konflik, format rusak dan batas. ZIP yang gagal tidak menghapus foto sebelumnya. |
| AC-05 | Kop dan jadwal | Logo kiri/kanan, kop, tanda tangan dan jadwal opsional tampil sesuai pengaturan. Perubahan langsung tercermin pada preview dan output. |
| AC-06 | Filter | Daftar ID preview, cetak, dan PDF identik untuk filter kelas/ruang/sesi, pencarian, dan rentang. |
| AC-07 | QR | Dekode payload semua format yang mengaktifkan QR. Payload hanya memuat versi dan referensi yang diizinkan. Kata sandi dan data pribadi lain absen dari payload. Perubahan kartu CBT memerlukan persetujuan P3-D03. |
| AC-08 | Dimensi | A4 landscape 297 × 210 mm dan preset kartu 86 × 54, 90 × 60, 100 × 70 mm, serta satu ukuran kustom. Target usulan toleransi dimensi kartu ±1 mm pada PDF dan pada cetak 100% di printer acuan. |
| AC-09 | Halaman | Dataset 1, 9, 10, 60, 132, dan 500. Periksa jumlah, urutan, halaman terakhir dan ID unik. Kartu, foto, kop, tanda tangan dan QR tetap utuh. |
| AC-10 | Integritas PDF | Simulasikan font/foto lambat dan satu kegagalan render. Keberhasilan hanya ketika seluruh kartu tersedia. Pembatalan memulihkan UI. |
| AC-11 | Aksesibilitas dan responsif | Uji viewport 390 × 844, tablet, dan 1440 × 1000, orientasi dan zoom 200%, alur keyboard, fokus dan dialog. Tidak ada overflow halaman yang menyembunyikan kontrol. |
| AC-12 | Privasi dan pemulihan | Periksa request, log, localStorage dan backup. Data peserta, foto, NIP dan tanda tangan tidak ikut dikirim atau masuk ke backup. Uji reset, tab tidur/kedaluwarsa, dan backup rusak. |
| AC-13 | Kesetaraan visual | Cocokkan screenshot pada kondisi setara. Catat perubahan kecil dan keputusan eksplisit untuk perubahan mayor. G-UI menunggu bukti pembanding. |

## Kontrak pengukuran cetak

Baseline statis preview A4 dan PDF memakai margin 8 mm dan jarak 3 mm. Target usulan menggunakan satu model grid bersama untuk preview/cetak/PDF. Untuk lebar dan tinggi kartu positif, kapasitas tiap sumbu adalah `floor((ukuranArea + jarak) / (ukuranKartu + jarak))`. Tolak ukuran yang tidak muat. Kapasitas halaman adalah hasil kali keduanya. Jumlah halaman adalah pembulatan ke atas dari jumlah kartu dibagi kapasitas. Ukur posisi dan dimensi pada PDF, lalu bandingkan satu cetak fisik pada skala 100%. Selisih grid dari legacy yang mengubah hasil halaman masuk peninjauan Opsi B.

**G3 menunggu penerimaan** atas cakupan MVP, kriteria di atas, perubahan P3-D01–P3-D05, dan kelulusan G-UI.
