# Panduan kontribusi

1. Mulai dari `main` terbaru. Gunakan `feat/fase-XX-ringkasan`, `fix/...`, `docs/...`, atau `chore/...` sesuai jenis pekerjaan.
2. Tulis commit berbentuk `tipe(scope): ringkasan`, misalnya `docs(fase-00): dokumentasikan fondasi repositori`. Pilih commit kecil dengan satu tujuan.
3. Ajukan PR ke `main` memakai template. Sertakan bukti verifikasi yang relevan dan isi bagian migrasi, privasi, risiko, dan rollback sesuai cakupan.
4. Selesaikan konflik dan pemeriksaan wajib sebelum meminta penerimaan. Merge dan deployment produksi mengikuti instruksi serta gate roadmap.
5. Catat bukti non-sensitif di `docs/evidence/fase-XX/` atau artefak CI. Catat keputusan ruang lingkup dan arsitektur di [log keputusan](docs/DECISION_LOG.md). Untuk selisih UI kecil catat `UX_DELTA` di ledger. Perubahan visual besar dan perubahan alur utama mengikuti persetujuan Opsi B.

Gunakan versi `MAJOR.MINOR.PATCH` dan tag `vMAJOR.MINOR.PATCH` untuk rilis aplikasi yang diterima. Naikkan MAJOR untuk perubahan kontrak yang memutus kompatibilitas, MINOR untuk fitur kompatibel, dan PATCH untuk perbaikan kompatibel. Nomor fase merujuk urutan pekerjaan. Versi roadmap mengikuti revisi dokumen.

Laporkan bug atau usulan melalui template issue. Gunakan kanal privat pengelola untuk laporan kebocoran atau kerentanan yang memuat detail sensitif.
