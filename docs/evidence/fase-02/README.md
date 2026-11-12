# Bukti Fase 2 — Eksplorasi perilaku legacy

**G2 dan G-UI belum lulus.** Paket ini mencatat 21 skenario isolasi dan menyiapkan fixture. Baseline visual dan keluaran cetak/PDF belum terverifikasi.

| Lingkungan | Hasil aktual |
| --- | --- |
| Deployment Apps Script | URL deployment yang dapat diverifikasi tidak ditemukan pada sumber legacy yang diperiksa. RPC SpreadsheetApp belum dijalankan. |
| Chromium lokal 156.0.8078.79 | Proses berhenti sebelum navigasi dengan kegagalan socket `Operation not permitted` pada ProcessSingleton. |
| Browser terkelola | Navigasi salinan lokal ditolak karena protokol `file:` diblokir. |
| Node VM, SheetJS 0.18.5, JSZip 3.10.1 | 21 skenario berjalan dan seluruh assertion sesuai observasi yang dicatat. VM memakai pengganti DOM, FileReader dan decoding gambar. Status jaringan aplikasi, UI, render fisik dan RPC tetap belum diuji. |

## Reproduksi

Ambil `Index.html` dari [commit legacy yang dipatok](https://github.com/r4nd1pr4t4m4-arch/generatorkartu/blob/623ce1280692d7c431ead92fdbdbd8427b0cba61/Index.html) dan bundle versi yang disebut di atas. Skrip memverifikasi hash blob serta versi pustaka dan menghasilkan 21 fixture di direktori keluaran. Jalankan dari akar repositori.

```sh
node docs/evidence/fase-02/replay.cjs /path/Index.html /path/xlsx.full.min.js /path/jszip.min.js /tmp/generate-kartu-fixtures
```

[Hasil JSON](replay.json) merekam keluaran aktual. Fixture mencakup workbook XLS/XLSX positif, header berbeda, data kosong/rusak, duplikat, nol awal, tiga workbook jadwal, dua arsip ZIP, dan enam ukuran dataset cetak. Data peserta fiktif menggunakan ID `UJI-0001` hingga `UJI-0500`. Skenario ZIP menggunakan decoding gagal yang disimulasikan untuk menguji fallback, tanpa mengukur decoding atau kompresi gambar.

## Sisa verifikasi G2

1. Dapatkan URL Apps Script yang sah dan cocokkan versinya dengan commit acuan, atau gunakan lingkungan browser uji yang diizinkan.
2. Jalankan alur normal, kosong dan gagal menggunakan fixture. Rekam klik, DOM, fokus, konsol, permintaan jaringan dan hasil aksi komunitas pada lingkungan uji yang sesuai.
3. Ambil screenshot desktop/mobile sesuai [matriks visual](../../VISUAL_PARITY_MATRIX.md) dan sampel cetak/PDF untuk keenam jumlah. Periksa jumlah ID unik, halaman akhir dan ukuran fisik.
4. Lengkapi [spesifikasi perilaku](../../BEHAVIOR_SPEC.md) serta ledger dengan bukti runtime dan keputusan G2.
