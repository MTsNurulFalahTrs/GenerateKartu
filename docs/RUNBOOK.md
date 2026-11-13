# SOP rilis dan pemulihan Generate Kartu

## Sebelum rilis

1. Cocokkan SHA di main, CI, kandidat staging dan release notes.
2. Verifikasi Next.js, Node 24.x, root repositori, npm ci dan domain pada proyek generate-kartu. MVP berjalan tanpa env aplikasi dan database.
3. Catat smoke desktop/mobile, penerimaan operator dengan data sintetis, hasil uji printer, scan QR, G13 dan G-UI.
4. Catat keputusan GO, operator rilis, dan fallback. Untuk rilis pertama, siapkan build pemulihan atau prosedur pemutusan publikasi karena riwayat produksi masih kosong.
5. Publikasikan secara manual setelah checklist diterima. Verifikasi domain, header, impor, preview, cetak dan PDF. Catat build serta deployment ID.

## Gangguan dan rollback

- Hentikan promosi jika smoke atau pemeriksaan privasi gagal. Simpan bukti yang bebas data pribadi.
- Bila sudah ada build produksi sehat, pilih deployment yang sebelumnya melayani domain produksi dan lakukan Instant Rollback. Pastikan domain melayani SHA yang dipilih, lalu ulangi smoke.
- Jika rilis pertama gagal dan belum ada build produksi sebelumnya, hentikan akses publik menurut prosedur operasional yang disetujui, perbaiki masalah dan verifikasi ulang kandidat sebelum publikasi.
- Pantau kegagalan build, status HTTP dan umpan balik operator. Laporan insiden hanya memuat kode galat, lingkungan dan waktu. Jangan sertakan workbook, foto atau PDF peserta.

[Dokumentasi Instant Rollback Vercel](https://vercel.com/docs/instant-rollback).

## Operasional dan pemeliharaan

- Setiap minggu, tinjau hasil workflow Quality, laporan audit produksi, dan permintaan pembaruan dependensi. Jalankan ulang Quality secara manual bila perlu. Periksa status staging dan rute utama saat pergantian kandidat rilis.
- Ukur dengan fixture sintetis yang sama. Catat jumlah peserta, waktu impor/preview/cetak/PDF, versi browser, SHA, dan status uji. Bandingkan angka pada runner dan kondisi yang setara.
- Untuk laporan operator, minta versi aplikasi, browser, tahapan, hasil yang diharapkan, hasil aktual, dan contoh sintetis. Catat waktu dan kode galat. Hindari menyimpan identitas peserta, workbook, foto, hasil PDF, serta rahasia.
- Triase P0 untuk insiden paparan data atau keluaran salah secara luas, P1 untuk alur utama terblokir, P2 untuk gangguan dengan cara pemulihan, dan P3 untuk penyempurnaan. Untuk P0/P1, hentikan promosi dan verifikasi perbaikan di staging dengan uji regresi.
- Perubahan mengikuti PR → CI → staging/preview → penerimaan. Sinkronkan changelog, ledger REA, matriks visual, dan keputusan arsitektur bila cakupan terkait berubah.
- Tinjau retensi dan pemulihan pada setiap rilis. Uji penghapusan sesi dan pemulihan backup preferensi. Pengelola meninjau akses repositori dan proyek Vercel serta biaya hosting saat penerimaan rilis. Tinjauan akses dan audit kontributor komunitas berlaku jika fitur dibuka kembali.
