# PIN pemilik untuk menghapus Format Komunitas

Terapkan migrasi Neon sampai `db/migrations/007_owner_pin_direct.sql` pada
database yang dipakai deployment. Pilih PIN acak 8–16 digit dan simpan di
pengelola kata sandi. Kolom `pin` bertipe teks agar angka nol di depan tetap
dipertahankan.

Buka tabel `public.community_owner_pin` di Neon. Buat atau edit baris dengan
`singleton = true`, isi `pin` dengan PIN baru, kosongkan `pin_hash` menjadi
`NULL`, dan atur `failed_attempts = 0` serta `locked_until = NULL`.
Untuk memasukkan atau merotasi PIN dalam satu perintah:

```sql
insert into public.community_owner_pin (pin)
values ('GANTI_DENGAN_PIN_8_SAMPAI_16_DIGIT')
on conflict (singleton) do update
set pin = excluded.pin, pin_hash = null, failed_attempts = 0, locked_until = null;
```

PIN lama dalam `pin_hash` tetap berfungsi sampai diganti. PIN yang disimpan
langsung dapat dibaca oleh pihak yang memiliki akses baca ke tabel atau
salinan database. Gunakan PIN khusus aplikasi ini dan batasi akses tersebut.

Jika aplikasi terhubung memakai role database terpisah, beri role
tersebut hak menjalankan fungsi `public.delete_community_format(integer, text)`,
membaca dan memperbarui tabel PIN, serta menghapus baris katalog. Deployment
yang memakai role pemilik migrasi sudah memiliki hak tersebut.

Lima PIN salah mengunci aksi hapus untuk seluruh katalog selama lima menit.
Hapus bekerja pada katalog publik. Salinan format yang sudah diaktifkan di
browser pengguna tetap bisa digunakan.
