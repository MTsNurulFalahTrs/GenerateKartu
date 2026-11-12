# Data uji, privasi, dan rahasia

- Gunakan ID `UJI-0001` hingga `UJI-0500`, nama `Peserta Uji 0001` dan seterusnya, serta institusi fiktif `Madrasah Contoh`. Gunakan gambar buatan atau avatar geometris untuk foto dan logo.
- Gunakan kumpulan 1, 9, 10, 60, 132, dan 500 peserta untuk skenario cetak. Siapkan variasi ID duplikat, nama panjang, data kosong, dan foto rusak sesuai fase terkait. Simpan data sumber sintetis yang dapat direproduksi bersama pengujiannya.
- Jauhkan nama, nomor peserta asli, foto, tanda tangan, arsip, dan ekspor asli dari repositori, issue, PR, Preview, log, dan artefak pengujian. Simpan bahan kerja privat di luar repositori.
- Proses data peserta dan foto di browser secara default. Catat kebutuhan, dasar pemrosesan, persetujuan, akses, dan retensi sebelum mengaktifkan pengiriman atau penyimpanan di server.
- Simpan rahasia lokal di `.env.local`, rahasia CI di GitHub Actions Secrets, serta rahasia deployment pada lingkungan Vercel yang sesuai. Gunakan akses minimum dan pisahkan nilai Preview dari Production. Variabel `NEXT_PUBLIC_*` hanya untuk nilai yang boleh dibaca pengguna.
- Jika rahasia bocor, cabut atau rotasi segera, laporkan secara privat, telusuri salinannya di riwayat dan artefak, lalu koordinasikan pembersihan dengan pengelola.
