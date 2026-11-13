# Fase 9 — Pencetakan dan PDF

Cetak dan PDF memakai semua peserta dalam hasil cakupan, pencarian dan filter aktif dengan urutan tetap. Keduanya memakai model kartu pratinjau, A4 landscape 297 × 210 mm, margin 8 mm, jarak 3 mm dan dimensi kartu yang dipilih. Kartu tidak dibagi antarhalaman. Contoh sintetis tidak ikut diekspor.

Keluaran menunggu font dan decoding gambar. Kartu yang gagal dirender atau terpotong menghentikan proses. PDF raster dibangun lokal per kartu dengan progres dan pembatalan. PDF tidak dikirim ke server. Cetak browser mempertahankan lembar sampai dialog selesai. Dialog yang ditutup tidak membuktikan cetakan fisik berhasil.

Uji grid memakai 1, 9, 10, 60, 132 dan 500 peserta pada empat ukuran kartu. Smoke test desktop memeriksa urutan 500 kartu dan jumlah lembar pada PDF cetak Chromium, serta ukuran dan isi halaman terakhir ekspor PDF aplikasi untuk 10 peserta. Smoke mobile memeriksa regresi editor. Uji printer fisik, pemindaian QR dari kertas dan pembandingan dengan aplikasi original masih terbuka.
