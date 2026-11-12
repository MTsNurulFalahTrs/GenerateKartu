# Rencana migrasi dan integrasi opsional

## MVP lokal

1. Simpan commit legacy dan daftar fixture. Verifikasi cakupan lisensi sebelum memindahkan kode atau aset literal.
2. Implementasikan kompatibilitas XLS/XLSX berdasarkan kolom per format. Legacy tetap menjadi pembanding. Terapkan keputusan P3-D03 pada kartu CBT setelah disetujui.
3. Backup baru memakai skema versi 1. Konverter legacy dikerjakan bila disetujui setelah inventaris versi. Gunakan pemetaan allowlist, pratinjau ringkasan, laporan field yang dilepas, dan konfirmasi. Jalankan parser tanpa menyisipkan HTML dan pertahankan state bila konversi gagal.
4. Uji fixture pada Preview, bandingkan legacy dan ukur output. Rollback UI dengan deployment Vercel sebelumnya serta pertahankan kompatibilitas preferensi yang telah tersimpan. Data peserta tetap di perangkat operator.

## Komunitas — desain bersyarat

| Entitas | Isi dan otorisasi |
| --- | --- |
| `community_formats` | ID, owner, versi, slug/nama, payload template tervalidasi, status, waktu dan referensi publikasi. Gunakan constraint unik untuk slug publik dan idempotensi per pemilik. |
| `community_moderators` | Keanggotaan dikelola oleh administrator melalui jalur tepercaya. Evaluasi peran aktual untuk tindakan sensitif. |
| `community_format_audit` | ID template, aksi, actor ID dan timestamp. Data internal, akses terbatas, tanpa menyalin payload. |

RLS dan grant keduanya diperlukan pada permukaan Data API yang terekspos. Pembaca publik hanya melihat proyeksi published tanpa owner ID internal dan metadata moderasi. Kontributor hanya melihat/mengubah draft atau rejected miliknya serta dapat mengajukan review. Moderator mengelola pending/published sesuai transisi. Pastikan kolom status dan ownership tidak dapat dimanipulasi lewat update langsung. Batasi akses tabel basis dan izinkan mutasi melalui jalur transaksi yang memeriksa identitas, peran, versi, dan transisi. RLS pada update memakai `USING` dan `WITH CHECK` sesuai kebijakan. Jangan gunakan secret/service-role untuk trafik browser. [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Grants dan keamanan Data API](https://supabase.com/docs/guides/api/securing-your-api)

Alur `draft → pending → published/rejected`, dengan arsip sesuai peran. Revisi published memakai versi draft terpisah agar konten publik tetap utuh sampai approval. Jalankan transisi dan audit secara atomik.

Jika fitur disetujui, buat proyek terisolasi, uji migration dan RLS dengan akun sintetis, lalu lakukan dry run data template legacy yang sudah disanitasi. Impor hanya template yang hak dan atribusinya terverifikasi, sebagai draft untuk review. Catat jumlah cocok, duplikat, gagal dan status setiap baris. Aktifkan dengan feature flag sesudah uji, dan saat rollback nonaktifkan flag, pertahankan audit, serta pulihkan versi publik sebelumnya. Eksekusi migrasi bergantung pada persetujuan fitur dan target proyek.
