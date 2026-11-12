# Spesifikasi perilaku legacy — Fase 2

Acuan kode [commit 623ce128](https://github.com/r4nd1pr4t4m4-arch/generatorkartu/tree/623ce1280692d7c431ead92fdbdbd8427b0cba61). Status `OBSERVED_ISOLATED` berarti fungsi legacy asli dijalankan dengan input sintetis dan pengganti API browser. `UNOBSERVED` berarti skenario browser, Apps Script, atau keluaran fisik masih perlu dijalankan.

| ID terkait | Skenario | Perilaku teramati | Status |
| --- | --- | --- | --- |
| RE-04 | XLS dan XLSX Format 2 | Keduanya memuat dua peserta. | OBSERVED_ISOLATED |
| RE-04 | Kapitalisasi header dan NISN numerik | Header huruf kecil dipetakan kembali. Pada kasus terpisah, NISN numerik 123 menjadi 0000000123. | OBSERVED_ISOLATED |
| RE-04 | Header wajib hilang, workbook kosong/rusak, dan ekstensi salah | Keempat input ditolak tanpa menambah peserta pada state kosong. | OBSERVED_ISOLATED |
| RE-04, RE-27 | Duplikat dan kolom wajib kosong | Data tetap masuk ke state dengan peringatan. Penggantian data lama lewat dialog masih perlu diuji. | OBSERVED_ISOLATED |
| RE-05 | ZIP cocok, ID asing dan entri nonfoto | Nama file dipetakan ke ID. ID asing tetap masuk ke peta foto dengan peringatan. Jalur decoding gambar diganti dengan simulasi kegagalan. | OBSERVED_ISOLATED |
| RE-05 | ZIP terpotong | Arsip ditolak setelah peta foto lama dikosongkan. | OBSERVED_ISOLATED |
| RE-09 | Header jadwal lengkap, parsial, dan salah | Header lengkap memuat jadwal. Header parsial mengisi kolom yang hilang dengan nilai kosong dan menghasilkan peringatan serta notifikasi sukses. Header yang seluruhnya berbeda ditolak. | OBSERVED_ISOLATED |
| RE-11, RE-13, RE-14, RE-21 | 1, 9, 10, 60, 132 dan 500 peserta | Semua jumlah lulus verifikasi impor. Render kartu, jumlah halaman, ukuran, scan QR dan ekspor PDF masih perlu diukur. | OBSERVED_ISOLATED untuk impor. UNOBSERVED untuk keluaran. |
| RE-01–03, RE-06–08, RE-10, RE-12, RE-15–20, RE-22–30 | Format, builder, foto individual, filter, modal, tema, penyimpanan, bantuan dan komunitas | Jejak statis tersedia di inventaris. Alur klik, fokus, persistensi, jaringan, format kartu dan RPC belum diamati pada runtime. | UNOBSERVED |

[Hasil 21 skenario](evidence/fase-02/replay.json) dan [petunjuk reproduksi](evidence/fase-02/README.md).
