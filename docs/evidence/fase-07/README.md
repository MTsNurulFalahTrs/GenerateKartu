# Fase 7 — Foto, aset, institusi dan format kartu

- Foto individual dipasangkan ke peserta terpilih. ZIP mencocokkan basename PNG/JPEG dengan ID, melaporkan nama asing, dan menolak konflik atau arsip gagal secara atomik. Batas ZIP 50 MiB masukan, 100 MiB hasil dekompresi dan 1.200 entri. Pengecekan CRC dan ukuran aktual berlaku juga pada workbook.
- Gambar dinormalisasi lokal dengan orientasi EXIF, batas input 5 MiB, pemeriksaan 12 megapiksel dan resize maksimum 960 px. Aset berada di memori tab.
- Kop, logo kiri/kanan dan tanda tangan tersedia di Pengaturan. Tata Letak mengatur ukuran, warna/BW, ukuran dan posisi teks, visibilitas kolom, QR, serta foto. Jadwal memakai satu kegiatan per baris.
- Tujuh format memakai kontrak Excel yang sama. Builder kustom mengurutkan kolom dari daftar biodata yang tersedia dan memakai ID peserta serta nama wajib. Penanganan baris Password pada kartu CBT masih mengikuti keputusan terbuka P3-D03.
- QR hanya berisi referensi acak GK1. Pratinjau satu kartu memakai peserta terpilih pertama atau contoh sintetis. Pratinjau batch dan cetak/PDF mengikuti fase berikutnya.
- Sesuai arahan pengguna, pembandingan terhadap aplikasi original dilakukan setelah seluruh fase pengembangan. [Matriks visual](../../VISUAL_PARITY_MATRIX.md) tetap mencatat status G-UI. Pengujian implementasi tidak mengesahkan kesetaraan visual.
