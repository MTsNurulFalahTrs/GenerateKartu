# Kandidat rilis Fase 14

- Commit main: `2ab6a25f85ec622eaa7a3e2d0de3225f335987e3`
- Deployment staging: `dpl_Hn2SDnAqrrD5v9JT9fNUcmQXoxuL`, build `bld_3evciya2d`, status READY.
- [Staging](https://generate-kartu-9fjkv99xr-mtsnurulfalahtrs-projects.vercel.app) · [CI main](https://github.com/MTsNurulFalahTrs/GenerateKartu/actions/runs/43371796362)
- Paket deployment manual berasal dari 37 berkas build pada commit di atas. Proyek memakai Next.js, root repositori, Node 24.x dan npm ci. Tidak ada env aplikasi.
- Smoke HTTP staging: /, /bantuan dan /icon.svg mengembalikan 200. Rute yang tidak ada mengembalikan 404. CSP, DENY, no-referrer dan nosniff teramati.
- Smoke browser desktop/mobile dan fixture cetak/PDF lulus di CI main. UAT operator pada staging, printer fisik, scan QR dari kertas, dan pembandingan original tetap terbuka.

**Keputusan kandidat: tahan promosi produksi.** G13 dan G-UI masih terbuka. Proyek memiliki domain terverifikasi, sementara daftar deployment produksi Ready kosong saat pemeriksaan. Pemulihan rilis pertama memerlukan fallback yang disetujui. Lihat [SOP rilis](RUNBOOK.md).
