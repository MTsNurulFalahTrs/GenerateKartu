# Kontrak teknis data, file dan API

## Tipe dan validasi

Skema Zod ketat menjadi sumber tipe melalui `z.infer`. Gunakan skema input terpisah untuk workbook, backup dan payload komunitas. Jalankan normalisasi sekali di batas input, lalu validasi seluruh hasil sebelum perubahan state.

| Skema | Kontrak teknis |
| --- | --- |
| Participant | `id: string` maksimum 80, `name: string` maksimum 160, tanggal ISO valid, NISN string 10 digit bila dipakai, `customValues: Record<string,string>`. Wajib/opsional mengikuti format. Tolak ID duplikat setelah normalisasi spasi. |
| Institution, Schedule | Kop tepat empat string maksimal 160 karakter per baris, metadata opsional, referensi aset lokal. Kolom jadwal maksimum 16 dengan key unik, baris maksimal 100, nilai maksimal 160 karakter. |
| CardFormat, Settings | Built-in registry tetap atau custom maksimum 24 field dengan key aman dan unik, tepat satu ID dan satu nama, flag boolean. Ukuran mm harus finite, positif dan muat grid. |
| Asset | Jenis terbatas foto/logo/TTD, signature berkas JPEG/PNG tervalidasi, ukuran byte dan dimensi, object URL internal. Referensi foto hanya ke peserta pada dataset aktif. |
| Backup | Envelope `schemaVersion: 1`, preferensi aman, opsi dan konfigurasi template yang diizinkan. Tolak versi asing, key berbahaya, nilai tak dikenal dan konten aktif. |
| RenderSnapshot | Revisi sesi, daftar ID unik terurut, setelan, format, referensi aset, font dan QR. QR `GK1:` dengan referensi acak 128-bit per kartu/sesi. Kata sandi dilarang pada QR. Tampilan baris Password pada CBT menunggu P3-D03. |

Workbook menerima XLS BIFF/OLE dan XLSX OOXML setelah pemeriksaan struktur, signature dan ekstensi. Header dinormalisasi sebelum pemetaan, sheet dipilih bila ada beberapa, sel diperlakukan sebagai data, formula tidak dieksekusi. Gunakan teks tampilan atau format sel yang diperlukan untuk ID nol awal. Ekspor sel sebagai teks literal. ZIP foto menerima PNG/JPEG, pakai basename, dan laporkan entri tidak cocok. Tolak path traversal, arsip bertingkat, terenkripsi, tabrakan nama dan decode gagal. Backup hanya JSON UTF-8.

### Anggaran awal untuk pengujian

| Input | Usulan limit |
| --- | --- |
| Workbook peserta/jadwal | 10 MiB input, 64 MiB output dekompresi OOXML, 20 sheet, 1.000 peserta, 64 kolom. |
| Foto dan ZIP | 5 MiB per gambar, 12 megapiksel per hasil decode, 50 MiB input ZIP, 100 MiB hasil ekstraksi aktual, 1.200 entry, maksimum 2 decode simultan. |
| Backup/komunitas | Backup 1 MiB. Payload template komunitas 64 KiB. |
| Pekerjaan | Budget worker awal 60 detik per impor, dikalibrasi dengan fixture desktop/mobile. Satu pekerjaan aktif per jalur impor atau ekspor. |

Terapkan limit sebelum alokasi besar, hitung byte aktual selama dekompresi, lakukan terminasi worker saat cancel/timeout dan gunakan staging sementara. Batas produk ini bersifat usulan dan harus diuji untuk beban 500. Jika parser tidak dapat menegakkan batas saat parsing, ganti parser atau batasi dukungan setelah tinjauan.

### Taksonomi galat

`INPUT_INVALID`, `LIMIT_EXCEEDED`, `FILE_CORRUPT`, `FORMAT_MISMATCH`, `DUPLICATE_ID`, `ASSET_INVALID`, `RENDER_FAILED`, `EXPORT_FAILED`, `SESSION_EXPIRED`, `CANCELLED`. Hasil lokal berupa union `{ok:true,data,warnings}` atau `{ok:false,error:{code,safeMessage,location?}}`. Lokasi lokal berupa sheet, baris dan kolom. Log hanya kode, tahap, durasi dan jumlah agregat. Pisahkan batal dari kegagalan.

## API opsional komunitas

MVP menggunakan fungsi lokal. Kontrak berikut berlaku bila komunitas diotorisasi.

| Rute | Perilaku |
| --- | --- |
| GET /api/community/formats | Template published. Cursor opaque, default 20 maksimum 50, urutan createdAt dan id stabil. |
| POST /api/community/formats | Contributor membuat draft milik sendiri. Validasi payload, pembatasan laju dan kunci idempotensi per pemilik. |
| PATCH /api/community/formats/{id} | Pemilik mengubah draft/rejected. Gunakan versi untuk kontrol konkurensi. |
| POST /api/community/formats/{id}/submit | Pemilik mengajukan draft untuk review. |
| POST /api/community/formats/{id}/moderate | Moderator menyetujui atau menolak pending. Simpan perubahan dan audit dalam satu transaksi. |
| DELETE /api/community/formats/{id} | Pemilik mengarsipkan draft/rejected miliknya. Moderator dapat mengarsipkan published/pending dengan audit. |

API hanya menerima nama template dan konfigurasi field yang diizinkan. Data peserta, contoh biodata nyata, foto, kredensial dan aset sensitif berada di luar kontrak. Respons sukses `{data,nextCursor?}`, galat `{error:{code,message,requestId}}`. Gunakan 400/401/403/404/409/413/429 sesuai kasus. Verifikasi sesi dan peran di server, pertahankan pembatasan akses baris di database. Uji request replay, concurrent update dan perubahan peran.
