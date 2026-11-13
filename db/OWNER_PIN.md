# PIN pemilik untuk menghapus Format Komunitas

Terapkan `db/migrations/004_community_owner_delete.sql` pada database Neon yang
dipakai deployment. Aksi hapus tetap terkunci sampai PIN dikonfigurasi. Pilih
PIN acak 8–16 digit dan simpan di pengelola kata sandi.

Buat hash bcrypt cost 12 secara lokal. Dengan Python dan paket `bcrypt`:

```python
import bcrypt
import getpass
import re

pin = getpass.getpass("PIN pemilik: ")
if not re.fullmatch(r"[0-9]{8,16}", pin):
    raise SystemExit("Gunakan 8–16 angka.")
print(bcrypt.hashpw(pin.encode("ascii"), bcrypt.gensalt(rounds=12)).decode("ascii"))
```

Di editor SQL Neon, masukkan **hash** tersebut ke kolom `pin_hash`:

```sql
insert into public.community_owner_pin (pin_hash)
values ('GANTI_DENGAN_HASH_BCRYPT')
on conflict (singleton) do update
set pin_hash = excluded.pin_hash, failed_attempts = 0, locked_until = null;
```

Langkah yang sama merotasi PIN. Jalankan pada branch yang sesuai untuk setiap
lingkungan. Jika aplikasi terhubung memakai role database terpisah, beri role
tersebut hak menjalankan fungsi `public.delete_community_format(integer, text)`,
membaca dan memperbarui tabel PIN, serta menghapus baris katalog. Deployment
yang memakai role pemilik migrasi sudah memiliki hak tersebut.

Lima PIN salah mengunci aksi hapus untuk seluruh katalog selama lima menit.
Hapus bekerja pada katalog publik. Salinan format yang sudah diaktifkan di
browser pengguna tetap bisa digunakan.
