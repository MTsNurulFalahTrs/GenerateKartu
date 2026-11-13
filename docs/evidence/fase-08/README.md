# Fase 8 — Pratinjau real-time

- Pratinjau mengambil biodata, foto, kop, aset, ukuran dan pengaturan dari sesi yang sama. Model kartu ditetapkan di `lib/cards/render-model.ts` untuk digunakan kembali oleh Fase 9.
- Cakupan semua/terpilih dan filter kelas, ruang, sesi, nama serta ID mengikuti dataset aktif. Mode satu kartu dan banyak kartu membatasi render ke 1 atau 9 per halaman. QR peserta tetap stabil saat berpindah halaman.
- Perubahan UX yang dicatat untuk pembandingan akhir mencakup filter preview, status jumlah/halaman, navigasi keyboard yang menggulir tab aktif dan overflow horizontal lokal pada kartu lebar.
- Pengujian implementasi menggunakan 500 peserta sintetis. Pembandingan dengan aplikasi original dilakukan setelah seluruh fase pengembangan. Kesetaraan dengan keluaran cetak/PDF menunggu implementasi Fase 9.
