# Kontrak data — rancangan Fase 3

Kontrak produk ini ditinjau pada G3. Skema runtime dan batas teknis yang belum diukur ditetapkan pada Fase 4.

## Entitas

| Entitas | Field dan aturan |
| --- | --- |
| Participant | `id`, `name`, `className?`, `room?`, `session?`, `nationalId?`, `birthDate?`, `username?`, `schoolName?`, `customValues`. ID dan NISN bertipe string agar nol awal terjaga. Tanggal dinormalisasi ke YYYY-MM-DD dan ditampilkan sesuai format. Nama wajib. ID unik dalam dataset. |
| Institution | Empat baris kop, kota, tanggal penerbitan, nama penandatangan, NIP opsional, referensi logo kiri/kanan dan tanda tangan. |
| Schedule | Daftar kolom berurutan dengan `key` unik dan `label`, serta daftar baris dengan nilai per key. Baris kosong seluruhnya dilewati. Header wajib yang hilang ditolak sebelum mengganti jadwal. |
| CardFormat | ID stabil, sumber `builtin` atau `custom`, nama, versi, field identitas, daftar field terurut, visibilitas dan opsi tampilan. Field foto menunjuk aset peserta. Field kustom hanya menerima teks biasa. |
| Asset | ID lokal, jenis `photo`, `logoLeft`, `logoRight` atau `signature`, MIME tervalidasi, ukuran byte, dimensi piksel dan referensi sementara. Foto menunjuk satu ID peserta. |
| Settings | Versi skema, format aktif, ukuran kartu dalam mm, mode warna/BW, preferensi tema, opsi foto/QR/jadwal, opsi tipografi kop serta ukuran/posisi tanda tangan. |
| Render selection | Daftar ID dalam urutan pratinjau setelah filter. Cetak/PDF mengambil snapshot pemilihan, setelan dan aset saat konfirmasi. |

## Format bawaan dan kustom

Header memakai nama legacy. Urutan ini mengikuti kontrak impor dan urutan field utama kartu pada sumber, dengan usulan penanganan Password di bawah. Kolom pada daftar target wajib untuk format terkait. Foto, logo, QR dan jadwal mengikuti opsi pengguna serta ruang yang tersedia.

| Format | ID | Kolom target berurutan |
| --- | --- | --- |
| 1 Standar CBT | Username | NamaMurid, Kelas, Sesi, Username |
| 2 Lengkap Ruang | NoPeserta | NoPeserta, NISN, NamaMurid, Kelas, Ruang |
| 3 Sederhana | NoPeserta | NoPeserta, NISN, NamaMurid, Kelas |
| 4 Identitas + Ruang | NoPeserta | NamaMurid, TglLahir, NISN, NoPeserta, Ruang |
| 5 Identitas Dasar | NoPeserta | NamaMurid, TglLahir, NISN, NoPeserta |
| 6 Identitas + Ruang + Satdik | NoPeserta | NamaMurid, TglLahir, NISN, NoPeserta, Ruang, NamaSatdik |
| 7 Identitas + Satdik | NoPeserta | NamaMurid, TglLahir, NISN, NoPeserta, NamaSatdik |
| Kustom | Satu field teks ditetapkan sebagai ID | Field ID dan nama wajib. Field tambahan dapat diurutkan, dilabeli dan ditandai wajib per template. Key unik dan foto opsional. |

**Format 1, keputusan terbuka P3-D03.** Workbook legacy dengan header Password dapat dikenali. Usulan target membuang nilainya sebelum data masuk ke state dan mengecualikannya dari template baru, pratinjau, cetak, PDF, backup serta log. Penghilangan baris pada kartu menunggu persetujuan eksplisit.

## Impor dan QR

- Operator memilih sheet bila workbook memuat lebih dari satu. Normalisasikan spasi tepi dan kapitalisasi header. Tolak header wajib yang hilang atau pemetaan ambigu, ID duplikat dan nilai wajib kosong. Laporan memuat sheet/baris/kolom dan alasan. State lama baru diganti setelah hasil valid dikonfirmasi.
- Foto ZIP dicocokkan dengan basename terhadap ID. Laporkan entry asing, tabrakan nama, gambar rusak dan batas arsip. Terapkan perubahan setelah tahap validasi dan konfirmasi.
- QR default nonaktif. Saat aktif, payload usulan berupa `GK1:<ref>` dengan referensi acak 128-bit yang stabil untuk kartu yang sama dalam sesi. QR hanya berfungsi sebagai referensi kartu dalam sesi dan dapat dipindai tanpa koneksi. Payload hanya berisi versi dan referensi, tanpa password, NISN, nama, tanggal lahir atau username.

## Penyimpanan dan retensi

| Data | Media dan retensi usulan |
| --- | --- |
| Peserta, foto, tanda tangan, jadwal per peserta, referensi QR | Memori tab. Hapus pada reset, akhir sesi, reload/tutup tab atau 2 jam tanpa aktivitas. Saat kembali dari tab tidur, periksa kedaluwarsa sebelum menampilkan data. |
| Logo institusi | Memori tab, mengikuti retensi sesi. Impor ulang untuk sesi baru. |
| Preferensi UI dan template nonpribadi | Penyimpanan lokal dengan versi skema. Hapus saat reset preferensi. |
| Kop dan metadata pejabat | Memori tab secara default. Backup konfigurasi hanya membawa metadata nonpribadi yang dipilih dan disetujui, serta mengecualikan NIP dan aset. |
| Ekspor cetak/PDF | File lokal atas tindakan operator. Aplikasi tidak mengunggah atau mengelola retensi salinan yang sudah diunduh. |

Backup JSON memakai `schemaVersion`, `settings` dan template yang diizinkan. Impor memvalidasi seluruh payload dan versi sebelum perubahan state. Penanganan format legacy diputuskan setelah verifikasi kontrak. Rujukan [kebijakan data](DATA_DAN_RAHASIA.md) dan [temuan keamanan](SECURITY_FINDINGS.md).
