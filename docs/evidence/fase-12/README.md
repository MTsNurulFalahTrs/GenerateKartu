# Fase 12 — Audit UI, aksesibilitas dan performa

Penyempurnaan mengikuti struktur Opsi B. Perbandingan dengan aplikasi original tetap dijadwalkan setelah seluruh pengembangan.

| Area | Sebelum | Sesudah |
| --- | --- | --- |
| Navigasi keyboard | Pengguna menelusuri header untuk mencapai isi | Tautan lewati header dan fokus isi |
| Tabel impor dan peserta | Area gulir tanpa nama atau fokus eksplisit | Area gulir berlabel, dapat difokuskan, serta header kolom semantik |
| Form dan galat | Tinggi kontrol bervariasi, pesan galat mengikuti warna umum | Target kontrol utama minimal 44 px, galat dengan kontras sesuai tema |
| Orientasi lanskap pendek | Header sticky terus menempati ruang layar | Header mengikuti alur dokumen pada tinggi maksimal 480 px |
| Preview dan cetak | Model keluaran dibentuk saat filter berubah dan setiap kartu keluaran memasang observer | Model keluaran dibentuk saat aksi dimulai, opsi filter dihitung ulang ketika dataset berubah, dan output memakai pemeriksaan clipping terpusat |

Audit mencakup tab Format, Data Murid, Pengaturan dan Cetak, dialog konfirmasi backup/reset dan status output. Aplikasi memakai dialog konfirmasi browser. Axe memeriksa aturan WCAG 2/2.1 A dan AA pada empat panel dengan data sintetis. Smoke test memeriksa lebar 320 px, tablet 768 px, lanskap 844 × 390 dan desktop 1440 px. Artefak CI menyertakan screenshot desktop/mobile.

Log smoke test mencatat waktu perubahan filter preview untuk 60/132/500 peserta, heap JS saat pengambilan sampel, impor ZIP 20 foto sintetis, pencetakan Chromium 500 kartu, serta PDF 10 kartu. Angka adalah sampel runner, tanpa klaim puncak memori atau SLA. Worker impor XLSX dan pemuatan dinamis modul PDF tetap dipakai.

G12 masih memerlukan pembandingan visual akhir dan penerimaan sasaran performa. Uji pembaca layar dan printer fisik tetap dicatat sebagai verifikasi manual.
