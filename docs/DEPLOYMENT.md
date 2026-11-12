# Aturan deployment

| Lingkungan | Pemicu dan syarat |
| --- | --- |
| Preview | PR ke `main` setelah proyek tertaut dan aplikasi bisa dibangun pada Fase 5. Jalankan smoke test terhadap commit PR dengan data sintetis. |
| Production | Rilis manual setelah gate rilis diterima. Catat persetujuan, SHA, deployment ID, URL dan target rollback. Jalankan smoke test setelah rilis. |

Saat proyek Vercel disiapkan, pastikan pengaturan Git/Production mencegah publikasi otomatis akibat merge ke `main` dan mempertahankan Preview untuk cabang PR. Uji kedua perilaku itu sebelum mengandalkan konfigurasi tersebut.

Identifikasi tim, proyek dan repositori tujuan sebelum deployment. Pada kegagalan produksi, pulihkan deployment terakhir yang terverifikasi dan ulangi smoke test.
