# Spesifikasi UX — Opsi B

Wireframe berikut adalah pemetaan struktur dari kode legacy, dengan baseline screenshot menunggu Fase 2. Header tetap memuat merek, navigasi empat langkah, Bantuan dan tema. Urutan panel mengikuti aplikasi asli.

| Langkah | Desktop | Mobile |
| --- | --- | --- |
| Format | Header → grid tujuh format, kustom dan filter → dialog contoh atau builder | Header dengan stepper yang dapat digulir → grid satu kolom pada layar sempit → dialog yang dapat digulir |
| Data Murid | Impor Excel dan ZIP → tabel data → panel foto individual | Kontrol impor bertumpuk → tabel bergulir dalam panel → akses foto per peserta |
| Pengaturan | Subtab Kop, Tata Letak dan Jadwal → form berkelompok dan pratinjau terkait | Subtab dapat digulir → kelompok form satu kolom → pratinjau di bawah input terkait |
| Cetak Kartu | Ringkasan → filter dan pencarian → grid/A4 → dialog aksi dan progres | Kontrol bertumpuk → pratinjau muat lebar layar → dialog cetak/PDF dalam viewport |
| Bantuan | Panduan, shortcut dan informasi | Konten mengikuti lebar layar, dengan kontrol keyboard dan sentuh |

## Keadaan dan respons

- Kosong. Tampilkan tindakan untuk langkah berikutnya, seperti pilih format atau impor template. Cetak/PDF dinonaktifkan ketika pemilihan kosong.
- Memproses. Beri status impor, render dan PDF. Cegah tindakan ganda, umumkan progres secara terukur, dan tampilkan batal bila proses mendukungnya.
- Gagal. Pertahankan data yang valid. Tampilkan sheet, baris, kolom atau tahap yang gagal serta tindakan pemulihan. Pulihkan fokus setelah dialog ditutup.
- Berhasil. Ringkasan memuat jumlah peserta, foto cocok, kartu terpilih dan jumlah halaman. Ubah status sukses hanya setelah proses terkait selesai.

## Keyboard dan perangkat

Urutan Tab mengikuti tampilan. Fokus terlihat pada semua kontrol, dialog memiliki nama aksesibel, fokus terkunci selama dialog modal terbuka dan kembali ke pemicu saat ditutup. Escape menutup dialog yang dapat dibatalkan. Status aktif dan galat dapat dibaca tanpa mengandalkan warna. Kontrol geser/drop memiliki padanan tombol. Target sentuh diusulkan minimal 44 × 44 CSS px untuk kontrol utama. Uji ponsel, tablet, desktop, rotasi dan zoom 200%. Scroll horizontal hanya pada komponen yang memerlukannya, seperti stepper atau tabel.

Perbedaan visual kecil ditinjau dan dicatat sebagai `UX_DELTA` dengan kondisi sebelum/sesudah. Perubahan besar pada alur, layout, merek atau kartu memakai persetujuan eksplisit dan `DESIGN_DECISION`. Lihat [spesifikasi visual](VISUAL_PARITY_SPEC.md).
