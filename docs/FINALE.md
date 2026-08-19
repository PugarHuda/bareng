# Finale — 21 Agustus 2026, 16:00 BST

Formatnya berubah (email Giles, 19 Agustus). Setelah sesi latihan bermasalah di screenshare dan
audio, dan dengan 11 tim yang pitch berurutan tanpa jeda, panitia minta **video pitch 3 menit
dikirim di muka**. Mereka yang memutarnya di slot kamu. **Kamu tetap masuk call**, karena Q&A-nya
langsung setelah video selesai.

Artinya seluruh risiko teknis yang kemarin kita siapkan pre-flight-nya sudah hilang. Tidak ada lagi
share sound, tidak ada lagi autoplay yang diblokir, tidak ada lagi video yang patah-patah di sisi
penerima. Yang tersisa cuma dua: **kirim filenya tepat waktu**, dan **jawab pertanyaan juri dengan
akurat.**

## Yang harus dilakukan

| Kapan | Apa |
|---|---|
| **Kamis 20 Agustus, sore** | Upload `video/out/bareng-pitch.mp4` ke YouTube sebagai **unlisted**, lalu kirim linknya ke Giles. Batas akhirnya malam itu, supaya mereka sempat tes pemutaran. |
| | Pastikan sharing-nya **anyone with the link can view**. Link Google Drive juga diterima, tapi YouTube lebih kecil kemungkinan gagal diputar. |
| **Jumat 21 Agustus, 16:00 BST** | Masuk call. Urutan pitch: FLOAT, Xelt, Catch-all, Pact, Rally, tap, morva, AXIS, **Bareng (ke-9)**, Axon, Lunas. |
| | Buka `QA_BANK.md` di layar sebelah sebelum call mulai. Itu satu-satunya bagian yang masih live. |

Link call: https://www.encodeclub.com/programmes/uxmaxx-hackathon/events/demos--finale-event

Ada 8 tim sebelum kamu, jadi kamu punya waktu duduk sebelum giliranmu. Jangan tinggalkan call, dan
jangan cuma menyimak setengah, karena pengumuman pemenang ada di akhir.

## Videonya

`video/out/bareng-pitch.mp4` — **2 menit 52 detik**, 1080p, narasi neural + subtitle di sepanjang
video. Delapan bagian:

| Bagian | Isi |
|---|---|
| 01 · Title | Patungan, arisan, patungan bayar makan. Semua produk kripto itu single user. Bareng yang berbagi. |
| 02 · The problem | Hari ini: grup chat, spreadsheet, satu orang pegang uang semua. Di on-chain lebih buruk: bagi seed phrase, atau tidak berbagi sama sekali. |
| 03 · Alur uang | **Rekaman aplikasi asli, 40 detik.** Saldo bersama, bayar pakai handle, settle di Arbitrum, lalu dorong lewat cap sampai tombolnya menolak. |
| 04 · Tur fitur | **Rekaman aplikasi asli, 40 detik.** Arisan dan fair draw, Split, Receive privat, Earn di Aave, dan agent ber-cap yang bayar lewat x402. |
| 05 · EIP-7702 | Alamat yang sama sebelum dan sesudah, tidak ada yang di-deploy, satu akun memegang saldo lintas chain. |
| 06 · On-chain proof | Tujuh hal yang sudah settle, enam kartu dengan hash-nya. |
| 07 · Partners | Lima partner, apa perannya masing-masing. |
| 08 · Close | Ringkasan, angka 7 dan 5, alamat situs dan repo. |

Rekamannya **tidak** dipasang penuh layar. Dia duduk dalam bingkai dengan pita subtitle di bawahnya,
karena versi penuh layar membuat teks narasi menimpa daftar member dan kolom jumlah — persis bagian
layar yang sedang dijelaskan kalimatnya.

Kalau ada yang mau diubah, ubah kalimatnya di `video/scripts/vo.mjs` lalu `npm run render`. Semua
timing-nya ikut kalimat, jadi tidak ada yang perlu digeser manual. Detailnya di `video/README.md`.

## Batas klaim — ini bagian yang masih hidup

Videonya tidak menawarkan kelemahan apa pun, dan memang tidak perlu. Tapi Q&A-nya live, jurinya
orang Particle dan ZeroDev sendiri, dan klaim berlebihan yang runtuh saat dicecar jauh lebih mahal
daripada jawaban jujur yang singkat.

**Jangan pernah ucapkan tiga ini**, ditanya atau tidak:

- "ZeroDev enforces the cap on the Universal Account." Kernel ZeroDev itu akun terpisah.
- "Per member caps are enforced on chain." Yang benar: *owner-signed grant, verified on every spend*.
- "It is live with real money." Situs yang dideploy jalan di keyless demo mode.

Kalau juri bertanya di mana cap-nya berada, jawabannya ada di `QA_BANK.md` — 20 pertanyaan dengan
jawaban siap ucap, lima ditandai sebagai yang paling mungkin keluar. Intinya: `spend()` menerima
fungsi tanda tangan **owner**, jadi member tidak pernah memegang kunci ke pot. Tidak ada yang bisa
dilewati, karena tidak ada jalan lain ke dananya. Itu framing-nya, bukan permintaan maaf.

Slide diagram arsitektur ada di `/deck` slide 9 ("One account. No member holds a key.") kalau kamu
perlu menunjukkan sesuatu saat Q&A. Dari slide penutup, `←` satu kali.

## Kalau juri minta lihat aplikasinya langsung

Buka `bareng-jade.vercel.app/app` di tab lain. **Refresh dulu** — state member itu `useState` biasa,
jadi kalau sebelumnya sudah dipakai, saldonya tidak balik ke $420 sampai di-reload, dan beat
over-limit tidak akan jalan.

Dua hal lain yang gampang salah diingat: slider jumlah itu `max`-nya limit member itu sendiri, jadi
beat over-limit hanya bisa di @budi (bayar $30, sisa $70, geser ke $85). Dan urutan fair draw arisan
berubah tiap load karena seed-nya dari block number, jadi jangan pernah sebut urutannya di depan.
