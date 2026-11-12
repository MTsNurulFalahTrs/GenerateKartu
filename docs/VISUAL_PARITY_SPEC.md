# Spesifikasi kesetaraan visual — Opsi B

Opsi B telah disetujui sebagai kebijakan. Dokumen ini masih usulan Fase 3. Commit acuan [623ce128](https://github.com/r4nd1pr4t4m4-arch/generatorkartu/tree/623ce1280692d7c431ead92fdbdbd8427b0cba61). Detail sumber tersedia di [inventaris](LEGACY_INVENTORY.md).

| Area | Acuan yang dipertahankan |
| --- | --- |
| Merek | Identitas UI Kartu Ujian Pro, ikon topi wisuda, gradien indigo, header kaca dan latar bertitik. |
| Token | Indigo #6366f1, #4f46e5 dan #4338ca, emerald #10b981, amber #f59e0b, violet pada builder. Plus Jakarta Sans dan JetBrains Mono mengikuti peran tipografi legacy. |
| Navigasi | Format → Data Murid → Pengaturan → Cetak Kartu, dengan Bantuan dan tema. Bentuk stepper, status aktif dan hierarki dipertahankan. |
| Komponen | Grid format, dropzone, tabel, tab pengaturan, modal, toast, filter, indikator progres dan pratinjau A4. |
| Kartu | Tujuh format bawaan dan kustom, susunan kop, foto, logo, QR, jadwal, tanda tangan, urutan field, serta preset 86 × 54, 90 × 60 dan 100 × 70 mm. Perubahan format CBT tercatat sebagai usulan P3-D03. |

## Bukti dan kontrol perubahan

- Baseline saat ini **BASELINE_UNVERIFIED**. [Matriks Fase 2](VISUAL_PARITY_MATRIX.md) mencatat setiap layar dan format yang menunggu screenshot. UI browser dan keluaran fisik perlu diambil dari runtime legacy yang dapat diakses.
- Gunakan Chromium, DPR 1 dan zoom 100%, desktop 1440 × 1000 dan mobile 390 × 844. Samakan browser, viewport, tema, data, status UI dan font dengan pembanding. Arsipkan kondisi kosong, terisi, gagal, modal, seluruh format dan keluaran cetak.
- Modernisasi terkontrol yang diusulkan mencakup perbaikan overflow, fokus, kontras, target sentuh, status progres, pemulihan galat dan keutuhan cetak. Catat perubahan terlihat beserta bukti sebelum/sesudah sebagai `UX_DELTA`.
- Ajukan perbedaan mayor beserta perbandingan, alasan dan dampak. Implementasikan setelah keputusan pengguna tercatat sebagai `DESIGN_DECISION`. Kesetaraan visual menunggu bukti atau pengecualian tertulis sesuai roadmap.
