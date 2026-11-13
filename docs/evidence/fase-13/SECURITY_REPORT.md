# Audit keamanan Fase 13

| Temuan | Prioritas | Mitigasi dan verifikasi |
| --- | --- | --- |
| Aplikasi dapat dibingkai dan header proteksi belum terpasang | P1 | Tambah CSP produksi, frame-ancestors, DENY, nosniff, no-referrer dan Permissions Policy. Smoke memeriksa header dan kelancaran alur setelah CSP aktif. |
| CSP statis masih mengizinkan script dan style inline | P2 | Next.js memakai script bootstrap inline dan kartu memakai style dinamis. CSP menutup origin eksternal, objek dan framing. Penguatan berbasis nonce/hash memerlukan peninjauan caching serta uji terpisah. |
| Next.js 16.4.3 masuk rentang advisory cache argumen biner | P2 pada konfigurasi ini | Aplikasi tidak memakai use cache untuk data biner dan pemrosesan peserta berlangsung di browser. Patch upstream tersedia mulai 16.4.5. Pembaruan versi dan audit transitive penuh masih perlu dituntaskan. [Advisory upstream](https://github.com/vercel/next.js/security/advisories/GHSA-rhh4-g77r-r9qj) |
| ZIP bomb, markup impor dan ekspor sensitif | Risiko residual | Parser berbatas dan CRC, JSX menangani teks, backup ber-allowlist, QR berisi referensi acak. Foto, peserta dan identitas sensitif diperiksa pada jalur browser dengan fixture sintetis. |
| Auth dan RLS | Ditunda | Backend komunitas berada di luar MVP menurut D-006. |

Registry npm tidak dapat diakses dari lingkungan lokal. Workflow mengeksekusi audit dependency produksi di runner jaringan dan melaporkan advisori sebagai bukti terpisah. Temuan advisory tidak otomatis membuktikan jalur yang dapat dieksploitasi pada aplikasi ini.
