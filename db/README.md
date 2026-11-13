# Neon database: Format Komunitas

The Neon PostgreSQL migration for the GenerateKartu community catalog is db/migrations/001_community_formats.sql.
The historical Supabase migration under supabase/migrations is an earlier alternative; do not apply it to Neon.

1. Connect the correct Neon database to the intended Vercel project. Set DATABASE_URL in the server environment only, never in a client-exposed variable or source file.
2. Apply db/migrations/001_community_formats.sql once in the intended database using its SQL editor or an authorized migration workflow.
3. If a previous catalog exists, copy id, definition, and created_at transactionally; reconcile the identity sequence after importing IDs.
4. Check GET, consent-based POST, deduplication, publish limits, manual field labels and Excel headers, and rejection of Password in staging.
5. Keep verified backups and prior catalog access until the migration is validated. Do not silently drop historical data.

When DATABASE_URL is missing, GET returns [] plus X-Community-Unavailable: true; POST cannot publish. Merging this code does not mean a database has been provisioned or migrated.
Only public format definitions are sent. Names, field labels, and Excel headers should not contain participant information.

## Konfirmasi publikasi dan atribusi

Setelah migrasi awal `001_community_formats.sql`, terapkan `002_community_contributors.sql` pada branch Neon yang digunakan target deployment **sebelum** merilis UI konfirmasi.
Migrasi kedua menambahkan `contributor_name` (default `Anonim` untuk baris lama) dan memperbarui fungsi publikasi. Metadata kontributor tidak menjadi bagian dari `definition` JSONB sehingga identitas kontributor tidak mengubah deduplikasi format.
Uji pemuatan katalog, berbagi dengan nama/inisial, berbagi anonim, pembatalan, dan validasi nilai sebelum mempromosikan ke production.

## Validasi nama dan field Password (migrasi 003)

Terapkan `db/migrations/003_unique_community_names_password.sql` terlebih dahulu pada salinan branch Neon, lalu di branch target sebelum deployment. Migrasi membuat indeks unik nama format secara case-insensitive (`lower(btrim(name))`), menolak nama publikasi baru selain `[A-Za-z0-9_-]`, dan menambahkan field bawaan `Password` **hanya sebagai metadata definisi format**. Tidak ada data akun/Password peserta yang dikirim ke API komunitas. Nama lama yang berisi spasi tetap dapat dibaca tanpa pengubahan/penulisan ulang. Bila sudah ada duplikasi nama lama, indeks akan menolak migrasi: tinjau dan selesaikan tanpa menghapus data secara otomatis. Nama kontributor diperiksa hanya huruf dan spasi lalu dinormalisasi ke Proper Case. Error publikasi nama duplikat dipetakan menjadi HTTP 409.

Kolom Password di spreadsheet hanya dibaca di browser ketika pengguna sengaja menambahkan field `Password` pada format kustom; format bawaan tetap mengabaikannya. Password tidak boleh dipakai sebagai **Acuan Foto**, sehingga tidak menjadi nama berkas foto. Cetakan dan PDF format kustom yang memilih Password akan memuat nilainya dan perlu dijaga kerahasiaannya.
