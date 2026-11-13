# PRD Generate Kartu

**Status** — Usulan Fase 3, menunggu penerimaan G3.  
**Acuan** — [Roadmap](TAHAPAN_PEMBUATAN_DAN_PENGEMBANGAN_GENERATE_KARTU.md), [inventaris legacy](LEGACY_INVENTORY.md) dan [hasil eksplorasi Fase 2](BEHAVIOR_SPEC.md).

## Pengguna dan tujuan

Operator ujian sekolah/madrasah menyiapkan kartu untuk satu atau banyak kelas, memeriksa kelengkapan data dan foto, lalu menghasilkan kartu siap dibagikan. Panitia atau pengawas dapat memeriksa hasil cetak dan distribusi. MVP dapat digunakan oleh operator pada perangkat yang sama tanpa akun.

**Alur utama** — pilih format → unduh template atau impor XLS/XLSX → cocokkan foto opsional → atur kop, jadwal dan tata letak → periksa pratinjau dan filter → konfirmasi subset/rentang → cetak atau ekspor PDF → akhiri sesi dan bersihkan data.

## Ruang lingkup

| Prioritas | Cakupan |
| --- | --- |
| P0 MVP | Tujuh format bawaan, builder kustom, template Excel dan impor tervalidasi, foto ZIP/individual, kop dan aset, QR minimum, pratinjau, filter, cetak dan PDF lengkap, serta pemrosesan lokal. |
| P1 MVP | Jadwal, pengaturan visual lanjutan, penyimpanan preferensi dan backup aman, pengalaman desktop/mobile, bantuan, aksesibilitas dan verifikasi 500 kartu. |
| P2 backlog | Rekap operasional lanjutan dan penyempurnaan shortcut setelah alur utama stabil. |
| Rilis opsional setelah MVP | Komunitas, akun dan moderasi berstatus `DEFERRED`. Pembukaan kembali mengikuti persetujuan cakupan dan uji akses. [Keputusan Fase 11](evidence/fase-11/README.md). |
| Di luar MVP | Sinkronisasi sistem akademik, penyimpanan permanen biodata siswa, aplikasi native, pembayaran dan AI. |

## Keputusan yang perlu ditinjau

| ID | Usulan perubahan terhadap legacy | Kriteria terkait |
| --- | --- | --- |
| P3-D01 | Tolak impor yang memuat ID duplikat atau nilai wajib kosong. Pertahankan data lama jika impor pengganti gagal. | AC-03 |
| P3-D02 | Gunakan pemetaan foto tervalidasi dan terapkan hasil ZIP secara atomik. Laporkan foto rusak, ID asing dan konflik basename. | AC-04 |
| P3-D03 | QR memakai referensi kartu acak. Field Password format CBT tetap dikenali ketika membaca workbook legacy, lalu diabaikan. Usulkan menghilangkan baris Password dari template/output kartu dan menggunakan distribusi kredensial terpisah. Perubahan struktur kartu ini memerlukan keputusan eksplisit. | AC-07 |
| P3-D04 | Penyimpanan lokal dibatasi ke preferensi dan metadata yang diizinkan. Aset sensitif dan data peserta hanya tersedia dalam sesi. | AC-12 |
| P3-D05 | Jika satu kartu gagal diproses, batalkan ekspor dengan pesan yang menyebut jumlah gagal. Konfirmasi jumlah dan halaman sesuai model render bersama. | AC-09, AC-10 |

Opsi B tetap berlaku. Struktur visual, alur, ukuran bawaan, gaya dan identitas aplikasi mengikuti [spesifikasi kesetaraan visual](VISUAL_PARITY_SPEC.md). Ukuran, ambang dan perbedaan yang diusulkan di PR ini memerlukan peninjauan sebelum menjadi kontrak final.

## Ukuran keberhasilan

Seluruh peserta terpilih hadir persis sekali pada cetak/PDF dengan urutan identik. Alur utama dapat dijalankan pada desktop dan ponsel, termasuk keyboard. Impor, pratinjau, filter, pengolahan foto, pencetakan dan PDF dapat dijalankan tanpa mengirim data peserta/foto ke server. Lihat [matriks penerimaan](ACCEPTANCE_MATRIX.md).
