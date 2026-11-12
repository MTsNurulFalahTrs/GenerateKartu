# Model ancaman — Generate Kartu

## Aset dan batas kepercayaan

Aset utama adalah identitas dan foto peserta, kredensial yang mungkin terbawa dari Excel legacy, NIP, tanda tangan, model kartu dan PDF. Berkas impor, data dari storage dan template komunitas adalah input tidak tepercaya. Browser tab memegang sesi. Hosting Vercel menyajikan kode dan aset. File hasil unduhan, spool printer dan perangkat bersama berada di bawah pengelolaan operator.

| Ancaman | Kontrol desain | Verifikasi |
| --- | --- | --- |
| SEC-01/06 · penyalahgunaan aksi komunitas | Komunitas ditunda dari MVP. Jika aktif, autentikasi sesi, cek ownership/peran, RLS, transisi tervalidasi, audit dan rate limit. Pensiunkan PIN statis. | Anonymous, pemilik lain, moderator, peran dicabut, akses langsung Data API, replay, submit paralel. |
| SEC-02/07 · kebocoran data dan rahasia | QR hanya referensi acak. Input sensitif tetap di memori tab. Backup dan telemetry memakai allowlist. Blok pengiriman data peserta lewat network. | Decode QR, periksa trafik, server log, storage dan backup. Gunakan nilai sintetis yang dapat dicari. |
| SEC-03 · XSS dari input | Render teks dengan JSX, tolak markup aktif, URL bebas, SVG input, handler inline dan injeksi gaya dari file. Cek skema ketat dan signature aset. | Impor workbook, backup dan template dengan HTML, URL berbahaya, key prototipe dan path traversal. |
| SEC-04 · ZIP bomb dan kehabisan sumber daya | Batasi ukuran, entry, byte aktual, dimensi gambar, konkurensi dan waktu kerja. Worker terminable. Commit state setelah validasi. | Arsip kecil dengan ekspansi besar, file rusak, gambar besar, pembatalan dan kegagalan decode. |
| SEC-05 · supply chain dan framing | Dependensi terkunci dan dipindai. Host aset yang diizinkan dari origin aplikasi. Batasi sumber script dan framing. | Audit dependency, simulasi script eksternal dan iframe, uji header produksi dan pemuatan chunk. |
| SEC-08/09 · hasil hilang atau salah | Validasi ID sebelum commit. Gunakan snapshot deterministik dan cocokkan halaman serta setiap ID sebelum menyimpan PDF. | Duplikat, 500 peserta, subset berubah, font/QR gagal dan cancel saat render. |

## Header, pencatatan dan sesi

Rancang CSP `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `connect-src 'self'` dan `worker-src 'self'`. Izinkan blob untuk gambar lokal dan buka sumber tambahan per kebutuhan yang diuji. Gunakan nonce untuk script framework bila memakai rendering dinamis. Uji CSP Report-Only di Preview sebelum enforce, termasuk script Next.js, style posisi kartu, pekerja, font dan unduhan. Bila nonce per permintaan dipilih, ukur konsekuensi rendering dinamis dan caching. Gunakan Referrer-Policy dan nosniff. [Panduan CSP Next.js](https://nextjs.org/docs/app/guides/content-security-policy)

Log hanya kode, tahap, durasi, jumlah dan request ID bila ada. Buang nama file, URL dengan parameter, payload, stack yang mengandung input, token dan identitas. Rate limit API opsional berdasarkan akun dan kuota jaringan yang relevan, batasi ukuran body dan validasi Origin untuk mutasi berbasis cookie. Uji penolakan sebelum pekerjaan mahal.

Gunakan waktu aktivitas terakhir untuk usulan TTL dua jam, termasuk pemeriksaan ketika tab kembali terlihat atau dipulihkan dari back-forward cache. Reset dan expiry membatalkan worker, membuang state, revoke object URL dan melepas buffer/canvas. Preferensi nonpribadi memakai storage berversi. Salinan file yang diunduh dan cache sistem cetak tetap bergantung pada perangkat operator.
