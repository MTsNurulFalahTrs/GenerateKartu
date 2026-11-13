# Fase 10 — Pengaturan, backup dan pemulihan

- Tema, format, urutan kolom kustom, visibilitas kolom, dimensi serta opsi tampilan kartu disimpan dengan skema versi 1 di localStorage. Berkas dan data sesi tetap dalam memori tab.
- Backup JSON dari Pengaturan dapat dipindahkan antar browser. Secara opsional sertakan nama institusi, nama ujian dan tahun pelajaran. Alamat, penandatangan, NIP, jadwal, peserta, referensi QR, foto dan aset tidak ikut ke penyimpanan preferensi atau backup.
- Untuk memulihkan, buka Pengaturan, pilih backup versi 1, dan konfirmasi. Berkas rusak atau tidak kompatibel ditolak sebelum konfigurasi berubah. Konversi legacy menunggu konfirmasi kebutuhan kompatibilitas.
- Setelah dua jam tanpa aktivitas, sesi menghapus peserta, foto, logo, tanda tangan dan metadata sesi, serta mempertahankan preferensi. Reload atau tab baru hanya memulihkan preferensi. Untuk menghapus keduanya, pilih Reset sesi dan pengaturan lalu konfirmasi. Salinan file unduhan dapat dihapus dari perangkat secara terpisah.
- Jika penyimpanan browser penuh atau diblokir, editor tetap berfungsi dalam sesi dan menampilkan status di Pengaturan. Backup JSON tetap dapat digunakan.
