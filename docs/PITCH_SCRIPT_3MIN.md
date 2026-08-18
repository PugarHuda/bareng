# Pitch script — 3 menit (finale)

Cara pakai: **kolom BACA = kata-kata persis yang kamu ucapkan.** Tidak ada teks skrip di slide —
slide-nya tetap `/deck` yang sudah ada, kamu cuma pindah slide sesuai cue.

- Bahasa: **Inggris** (deck & juri internasional). Mau versi Indonesia penuh? bilang saja.
- Total ± **400 kata**. Kecepatan target ~145 kata/menit. Kalau kamu merasa cepat, potong
  kalimat ber-tanda `[opsional]` — bukan yang lain.
- **Hanya 7 dari 11 slide dipakai.** Slide 3, 6, 9, 10 di-skip (dijawab lewat demo & Q&A).
- Urutan tombol deck: `→` maju. Slide yang di-skip: tekan `→` cepat-cepat, jangan bicara di atasnya.

---

## Peta waktu

| Waktu | Layar | Slide `/deck` |
|---|---|---|
| 0:00–0:15 | Slide **1** — Money, together. | 1 |
| 0:15–0:33 | Slide **2** — The problem | 2 |
| 0:33–1:45 | **LIVE DEMO** (pindah tab) | — |
| 1:45–2:03 | Slide **4** — The account *is* 7702 | 4 (tekan `→` ×2 lewati 3) |
| 2:03–2:25 | Slide **5** — Seven things settled on-chain | 5 |
| 2:25–2:37 | Slide **7** — Partners | 7 (tekan `→` ×2 lewati 6) |
| 2:37–3:00 | Slide **11** — Money, together. | 11 (`End` atau `→` ×4) |

---

## 0:00 — Slide 1 (Title)

> **BACA:**
> "Group money is universal. Patungan. Arisan. Splitting a bill with friends.
> But every crypto product ever built is single-user.
> Bareng is the shared one. One account, many people, real limits.
> Money — together."

*(± 15 detik. Berhenti sejenak di "Money — together", lalu `→`.)*

---

## 0:15 — Slide 2 (The problem)

> **BACA:**
> "Today a group pot means a group chat, a spreadsheet, and one person holding everyone's money.
> On-chain it's worse — you either share a seed phrase, or you don't share at all.
> Nobody has built the shared, multi-user account. That's exactly where per-member limits stop
> being a nice-to-have and become the product."

*(± 18 detik. Di kata terakhir, **pindah ke tab browser kedua yang sudah terbuka di `/app`**.)*

---

## 0:33 — 🔴 LIVE DEMO (72 detik, 3 beat)

> Aturan panggung: **jangan pernah diam sambil klik.** Setiap kalimat di bawah diucapkan
> *sambil* tanganmu bergerak. Semua jalur klik ini sudah diuji langsung — bukan dari dokumen.

### Beat A — bayar pakai @handle (0:33–1:00)

**Layar:** sudah di `/app`. Tunjuk kartu pot paling atas.

> **BACA:**
> "This is a real pot — at-lunchsquad. One balance: four hundred twenty dollars — and in rupiah,
> because that's the money people actually think in. Three members, each with their own weekly limit."

**KLIK:** geser slider *Amount* ke **30** (default terbuka di $10, member aktif sudah **@budi**).

> **BACA:**
> "I'm Budi. I'll pay Sari thirty dollars — by handle. Never an address."

**KLIK:** tombol biru **`Pay $30`** → tunggu ± 1 detik sampai berubah.

> **BACA:**
> "Settled on Arbitrum. No gas. No chain to pick. No seed phrase.
> [opsional] And that green tick up there is a real transaction — you can click it and verify it right now."

### Beat B — cap 7702 menolak (1:00–1:20)

**Layar:** tetap di `/app`, jangan ganti member.

> **BACA:**
> "Now watch the limit. Budi has seventy dollars left this week."

**KLIK:** geser slider ke **85**. Tombol berubah jadi **`Over limit`** dan mati.

> **BACA:**
> "I drag to eighty-five — and it refuses.
> That cap is an owner-signed EIP-7702 grant, verified on every single spend.
> It's cryptography, not a disabled button."

### Beat C — arisan & fair draw (1:20–1:45)

**KLIK:** sidebar → **Arisan**.

> **BACA:**
> "And this is the part that's actually Indonesian.
> Arisan — a five-hundred-year-old rotating savings circle. Everyone pays in; one person collects
> the whole pot. The only question that has ever started a fight is: who collects first?"

**KLIK:** tombol **`🎲 Fair draw`** → muncul urutan `@budi → @dewi → @sari`.

> **BACA:**
> "A public seed. Anyone can recompute this order themselves and prove nobody rigged it.
> That's a five-century-old ritual, made trustless."

*(**Pindah balik ke tab deck.** Tekan `→` dua kali untuk lewati slide 3, berhenti di slide 4.)*

---

## 1:45 — Slide 4 (The account *is* 7702)

> **BACA:**
> "Underneath: the account itself is EIP-7702.
> The organizer's Google login becomes a Universal Account in place — same address, nothing deployed —
> and that one account holds the balance across every chain.
> The per-member caps are signed grants layered on top of it."

*(± 18 detik. `→`.)*

---

## 2:03 — Slide 5 (Proof wall)

> **BACA:**
> "And none of this is a mockup. Seven things have actually settled on-chain:
> a shared spend, a 7702 cap enforced, an Aave supply, an x402 agent payment, a private stealth sweep.
> Every hash on this slide is clickable.
> Most teams here don't have one."

*(± 20 detik. Ini kartu terkuatmu — **pelan-pelan** di kalimat terakhir. Lalu `→` ×2 ke slide 7.)*

---

## 2:25 — Slide 7 (Partners)

> **BACA:**
> "All five partners, for real.
> Particle is the account. Magic is the login. Arbitrum is where it settles.
> ZeroDev caps it and routes it. Openfort's x402 pays for it."

*(± 12 detik. `→` sampai slide 11, atau tekan `End`.)*

---

## 2:37 — Slide 11 (Close)

> **BACA:**
> "One thing we won't overclaim: the Universal Account is single-owner, so per-member caps are
> enforced app-side — and we put that on our own slide.
> We only claim what we can show you.
>
> Bareng. One shared balance, real per-person limits, no gas, no chains, no seed phrases.
> Money — together. Thank you."

*(± 22 detik. Berhenti. Jangan tambah apa-apa — sisanya biar jadi Q&A.)*

---

## Pre-flight (2 menit sebelum naik)

1. **Dua tab, urutan ini:** tab 1 = `https://bareng-jade.vercel.app/deck`, tab 2 = `.../app`.
   Latih `Alt+Tab` / `Cmd+Tab` sekali.
2. **Refresh tab `/app`.** State spending cuma di memori React — reload mengembalikan Budi ke
   $100/wk dan saldo ke $420. **Kalau kamu habis gladi bersih, WAJIB refresh** atau beat B gagal.
3. Zoom browser **100%**, mode gelap OS mati (desainnya cream), notifikasi mati.
4. Buka `/arisan` sekali lalu balik ke `/app` — supaya route-nya sudah ter-cache, klik saat demo instan.
5. Cadangan bila internet mati: `demo/bareng-demo.mp4` sudah ada di laptop. Putar dari 0:35.

## Yang TIDAK boleh diucapkan

- ❌ "ZeroDev enforces the cap on the Universal Account" — tidak. Kernel-nya akun terpisah.
- ❌ "Caps are enforced on-chain" — tanpa embel-embel. Yang benar: *owner-signed, enforced app-side*.
- ❌ "It's live with real money" — situs deploy jalan di keyless demo mode. Katakan itu kalau ditanya.
- ❌ Menyebut angka tes/jumlah baris kode di panggung. Simpan untuk Q&A.
