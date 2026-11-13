# Fase 11 — Keputusan cakupan komunitas

**Keputusan MVP: DEFERRED.** Format komunitas, akun kontributor dan moderasi dijadwalkan sebagai cakupan opsional setelah MVP. Pengajuan format dan publikasi menunggu keputusan produk serta tujuan proyek yang jelas. Rancangan bersyarat tersedia di [kontrak teknis](../../TECHNICAL_CONTRACTS.md) dan [rencana migrasi](../../MIGRATION_PLAN.md).

## Verifikasi jalur G11 untuk fitur yang ditunda

- Pemeriksaan commit `91f21c4506953c2e76e7617826d8973d555db02c` mencakup rute aplikasi, komponen editor, dependensi, dan contoh konfigurasi. Editor menawarkan format bawaan dan format kustom lokal. Tidak ada menu komunitas aktif, Route Handler komunitas, SDK Supabase, atau variabel lingkungan Supabase.
- PR Fase 11 hanya mengubah dokumen. Tidak ada proyek backend, migrasi, atau deployment yang dijalankan. Uji otorisasi dan RLS berlaku ketika fitur dibuka kembali.
- Cetak dan PDF menggunakan alur lokal. Bukti regresi aplikasi pada commit Fase 10 tersedia di [GitHub Actions](https://github.com/MTsNurulFalahTrs/GenerateKartu/actions/runs/43368931362).

## Pembukaan kembali

1. Sahkan peran kontributor, moderator dan administrator, izin penerbitan, dan cakupan data template. Biodata peserta, foto, kredensial, serta aset sensitif tetap di luar kontrak.
2. Tentukan proyek uji yang terisolasi, jalankan migrasi berversi, dan verifikasi Auth, grants, RLS, audit, serta penolakan akses lintas akun.
3. Uji pengguna anonim, akun yang dicabut, konflik revisi, kegagalan provider, backup dan rollback sebelum fitur ditampilkan.
