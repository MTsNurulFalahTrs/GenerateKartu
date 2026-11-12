# Fase 6 — Data peserta dan Excel

- Header templat mengikuti tujuh format di [kontrak data](../../DATA_CONTRACTS.md). Format kustom mengikuti fase builder. Workbook CBT lama dapat diimpor dengan kolom Password yang dikecualikan dari pemetaan dan preview. Keputusan baris Password pada desain kartu tetap di luar fase impor.
- XLS berarti BIFF dalam kontainer OLE Excel 97–2003. XLSX memakai ZIP OOXML. Pilih sheet, petakan kolom, cek preview lima baris, lalu terapkan. Header adalah baris teratas pada area sheet yang digunakan. Baris kosong diabaikan. Baris berisi data yang tidak valid menolak kandidat secara keseluruhan dan dapat dilaporkan dalam CSV.
- Kolom wajib dipetakan secara unik. Normalisasi mencakup spasi, kapitalisasi header, NISN dan tanggal. Nama, kelas, ruang dan sesi divalidasi sebagai teks wajib jika diminta format. ID duplikat menolak kandidat. Dataset aktif hanya diganti saat operator menerapkan kandidat valid.
- File diolah di worker browser. Ukuran file, output dekompresi, sheet, baris dan kolom dibatasi. Daftar peserta disimpan di memori tab. Pencarian, filter, pengurutan dan paginasi tidak menghapus pilihan peserta.
- SheetJS 0.20.3 dipin ke [tarball resmi](https://docs.sheetjs.com/docs/getting-started/installation/frameworks/) dengan SHA-512 di lockfile.
- Pengujian menghasilkan fixture XLS/XLSX sintetis, mengukur durasi dan delta heap Node pada 500 baris, dan menjalankan impor melalui browser desktop/mobile. Delta heap adalah indikasi pengujian parser, bukan puncak memori browser. Hasil CI tercatat pada PR Fase 6.
