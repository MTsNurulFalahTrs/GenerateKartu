# Bukti Fase 1 — Akuisisi dan audit statis

- Sumber dipatok ke `623ce1280692d7c431ead92fdbdbd8427b0cba61`. Kedua blob cocok dengan tree commit. Tree hanya memuat `Code.gs` dan `Index.html`.
- [Inventaris legacy](../../LEGACY_INVENTORY.md) memetakan alur, state, DOM, event, dependensi, format, keluaran dan bukti visual awal.
- [Ledger rekonstruksi](../../RECONSTRUCTION_LEDGER.md) memuat 30 kewajiban dengan ID, keputusan, input/output, bukti dan skenario uji.
- [Temuan keamanan](../../SECURITY_FINDINGS.md) memuat 9 temuan dan skenario verifikasi.
- [Indeks sumber](SOURCE_INDEX.md) memuat referensi fungsi, listener dan ID DOM literal.

**G1 siap ditinjau.** Artefak statis tersedia. Penerimaan formal mengikuti penyelesaian G0. Runtime legacy dan baseline visual masih berstatus `UNOBSERVED` dan `BASELINE_UNVERIFIED`. Fase 2 memerlukan akses sah ke runtime atau catatan pengecualian sesuai roadmap. Hak penyalinan kode/aset masih harus dikonfirmasi sebelum pemindahan literal.
