# Bank jawaban Q&A juri

Pasangan dari `PITCH_SCRIPT_3MIN.md`. Pitch-nya 2:43, sisanya Q&A, dan di situlah finalis
biasanya menang atau kalah. Jawaban ditulis dalam bahasa Inggris siap ucap.

⭐ = paling mungkin ditanya. Kalau waktumu cuma cukup menghafal lima, hafalkan yang berbintang.

---

## Aturan menjawab

1. **Dua kalimat, lalu berhenti.** Jawaban panjang terdengar seperti sedang menutupi sesuatu.
   Kalau juri mau lebih dalam, dia akan bertanya lagi. Diam setelah menjawab itu kuat.
2. **Jawab pertanyaannya dulu, baru alasannya.** Jangan buka dengan latar belakang.
3. **Kalau pertanyaannya sudah ada di slide, buka slide itu** sambil menjawab. Proof wall
   (slide 6) menjawab separuh pertanyaan soal "ini nyata atau tidak".
4. **Jangan berdebat.** Kalau juri salah paham, perbaiki sekali dengan tenang, lalu lanjut.
5. **Kalau tidak tahu, bilang tidak tahu**, lalu berikan yang kamu tahu:
   *"I do not know that one. What I can tell you is..."* Mengarang di depan juri Particle atau
   ZeroDev akan ketahuan dalam satu pertanyaan lanjutan.

---

## A · Arsitektur, ini yang paling tajam

### ⭐ A1. "Is the per-member cap actually enforced on-chain?"

Ini pertanyaan paling mungkin dan paling menentukan. Jawab **tanpa minta maaf**, karena posisimu
sebenarnya kuat.

> "The pot is one Universal Account, and its key never leaves the organizer. Members never hold
> it. So a member has no path to the money at all except through an owner signed grant that binds
> their address, the token, the period, and the cap.
>
> The chain enforced variant is the ZeroDev Kernel7702 path, and we proved that on chain too. It
> is the Sepolia transaction on our proof wall, where an over cap transfer is rejected at
> validation and a within cap one settles."

**Kalau dicecar: "So why not use ZeroDev for the pot itself?"**

> "Because a ZeroDev kernel is a different account. Making the pot a kernel means giving up the
> Universal Account's cross chain unified balance, which is the whole UX thesis. The code is there
> if a pot ever wants chain enforced caps more than it wants one balance."

### ⭐ A2. "What stops a member from bypassing your app and moving the money directly?"

Jawaban terkuatmu. Banyak orang mengira ini pertanyaan mematikan; sebenarnya tidak.

> "There is nothing to bypass, because a member holds no key to the pot. Every settlement is signed
> by the owner's key. The grant is not a UI guard on someone who could go around it, it is the
> authorization layer for someone who has no other route to the funds."

### ⭐ A3. "How is this prominently EIP-7702 rather than just 4337?"

> "The account itself is 7702. The organizer's Magic login gives an EOA, and that same address is
> upgraded in place into the Universal Account. Same address, nothing deployed, and that one
> account holds the balance across chains.
>
> On a fresh account the very first transaction signs its own 7702 authorization inline, with chain
> ID zero, so there is no pre delegation step and no ETH needed on the EOA."

Detail chainId 0 itu bukti kamu benar-benar mengerjakannya, bukan menempel SDK. Sebut kalau
jurinya orang Particle.

### A4. "Why a Universal Account and not a Safe multisig?"

> "A Safe is n of m: everyone signs every transaction. That is approval, not shared spending. Bareng
> gives each person their own authority up to a limit, so nobody waits on anybody. And a Safe has no
> cross chain unified balance, so you are back to picking chains and bridging."

### A5. "What happens if the organizer loses their key, or disappears?"

Jangan mengarang fitur yang belum ada.

> "Key loss is covered, because the owner is a Magic login, not a seed phrase. You recover the
> Google account, you recover the wallet.
>
> The organizer disappearing is a real gap. Multi organizer, where the pot is owned by a threshold
> of members, is the next thing we would build."

### A6. "The demo showed one device. What about concurrency, two members spending at once?"

> "Right now the cap check and the record happen around an await, so a server side version needs a
> per member lock. We marked it in the code rather than pretending it is not there. For the shared
> pot as demoed, the owner signs serially, so it does not surface."

### A7. "What was the hardest bug?"

Pertanyaan hadiah. Ini cerita bagus dan menunjukkan disiplin.

> "Double clicking Pay double spent. Our in flight guard was React state, which lags a render, so
> two clicks in the same tick both passed the check. We fixed it with a ref that flips
> synchronously.
>
> Our own Playwright sweep found it, not a user. It is the one class of bug you cannot ship in a
> money path."

### A8. "How do you stop a member forging their own grant?"

> "The grant is verified against the pot's real owner address, not against whoever the grant claims
> signed it. It also binds the member, the token, and the period, so a cap for one member in USDC
> cannot authorize another member, another token, or a shorter window that refills early."

---

## B · Cross-chain dan partner

### ⭐ B1. "Does the cross-chain part actually work?"

> "The pot has a registered ZeroDev Smart Routing Address. You send USDC from Base or Optimism and
> it routes into the pot on Arbitrum. It is on the pot card in the app with a QR to scan."

**Kalau dicecar: "Have you settled a cross-chain deposit?"**

> "The address and its three routes are registered and you can verify them. The deposit itself needs
> source funds on another chain, which we have not put in. Everything on our proof wall is a
> transaction we actually settled, and we did not put anything there that we did not."

Jangan menawarkan bug Particle v2 lebih dulu. Kalau juri Particle sendiri yang menyinggung
cross-chain UA, baru jawab: *"We hit the v2 balance check counting only destination chain holdings
for 7702 accounts. Other teams reproduced the same thing in the Discord, so we shipped the ZeroDev
rail instead."*

### B2. "You listed five partners. Which ones are real and which are logos?"

> "All five run. Particle is the account. Magic is the login. Arbitrum is where everything settles.
> ZeroDev is the on chain cap and the routing address. Openfort's x402 is a real EIP-3009 handshake
> that settled on Arbitrum.
>
> The cap on that wall came out of ZeroDev, the agent payment came out of x402, and the stealth
> sweep came out of the same handshake. Those are not transfers we made to look busy."

### B3. "Tell me something you learned that is not in the README."

> "EIP-3009 needs a plain, undelegated EOA as the payer. A 7702 delegated account has code, so USDC
> routes the signature through EIP-1271 and rejects a plain ECDSA signature. So our x402 agent is a
> separate throwaway EOA, funded by a tiny transfer, and the Universal Account relays the
> settlement."

Ini jawaban yang membuat juri percaya kamu benar-benar membangunnya.

---

## C · Produk dan pasar

### ⭐ C1. "Why would anyone use this instead of GoPay, Dana, or Splitwise?"

> "Splitwise tracks who owes whom but never moves money. GoPay moves money but the pot sits with
> the operator and stops at one country.
>
> Bareng is the account itself. The group can audit it, it works across borders, and the rules are
> code instead of a company's terms. For an arisan spread across a diaspora, that is the whole
> difference."

### C2. "Who is the first user?"

> "Groups that already run arisan and patungan on WhatsApp plus a spreadsheet. That is not a niche
> in Indonesia, it is the default way people handle shared money. We are not teaching a new
> behaviour, we are removing the spreadsheet."

### C3. "What is the business model?"

Jangan mengarang angka.

> "Not the focus of this build, and I would rather not invent a number. The two honest candidates
> are a small fee on settle up, and the spread on idle balance, which is already wired into Aave
> v3."

### C4. "Is an arisan a regulated product?"

Hati-hati. Jangan memberi opini hukum.

> "We are not custodial. The pot is the group's own account, and there is no interest and no
> outside investor. Beyond that it is a real legal question and I would want counsel before
> answering it properly."

### C5. "What is next if you win?"

> "Multi organizer ownership, so a pot does not depend on one person. Then the cross chain deposit
> end to end. Then handles that resolve on chain instead of per device."

---

## D · Pertanyaan bermusuhan

### ⭐ D1. "That video was pre-recorded. Show me it live."

Ini bukan tuduhan, ini undangan. Terima dengan senang.

> "Yes, recorded so it fits three minutes. It is live right now, let me open it."

Buka `bareng-jade.vercel.app/app`. Bayar sekali, lalu geser slider lewat batas sampai tombolnya
mati. **Refresh dulu** kalau kamu sudah pernah memakainya di sesi itu.

### D2. "How do we know those transactions are yours?"

> "Click any of them, they open on Arbiscan. The receipts inside the app link to the exact same
> hashes, so you are checking our claim against the chain, not against our slide."

### D3. "This is a hackathon demo. What is actually production ready?"

> "The money path logic, the grant verification, and the settlement are real and tested. What is
> not production ready is single organizer ownership and handles stored per device. I would not
> put a stranger's money in it this week, and I would put my own group's lunch fund in it today."

Kalimat terakhir itu jujur, spesifik, dan enak didengar.

### D4. "Your site says demo mode. So nothing works?"

> "Demo mode means keyless, so you can try every screen right now without a wallet. The live path
> is wired, we just kept the deployed site keyless because that is the better experience for
> someone judging it in thirty seconds."

---

## E · Kalau pertanyaannya di luar dugaan

Tiga pola aman:

1. **Belum dibangun:** *"We did not build that. The reason is X, and here is what we built
   instead."* Jujur soal ruang lingkup itu kredibel; berpura-pura tidak.
2. **Tidak tahu jawabannya:** *"I do not know. I would want to check before I answer that."*
   Lalu berhenti. Jangan mengisi keheningan dengan tebakan.
3. **Pertanyaannya kabur:** *"Do you mean X or Y?"* Lebih baik daripada menjawab yang salah
   selama satu menit.

---

## Yang tidak boleh diucapkan, ditanya atau tidak

Deck sudah tidak menawarkan kelemahan apa pun. Tapi tiga kalimat ini **tidak benar** dan akan
roboh di pertanyaan berikutnya, jadi jangan pernah dipakai untuk menambal:

- ❌ "ZeroDev enforces the cap on the Universal Account." Kernel-nya akun terpisah.
- ❌ "Per member caps are enforced on chain." Yang benar: *owner signed, verified on every spend*.
- ❌ "It is live with real money." Situs yang dideploy jalan keyless.

Juri di ruangan itu orang Particle, ZeroDev, Magic, Arbitrum, dan Openfort. Mereka menulis SDK-nya.
Satu klaim yang dilebihkan menghapus tujuh transaksi yang benar-benar kamu settle.

---

## Angka yang mungkin ditanya

Jangan disebut kalau tidak ditanya.

| Hal | Angka |
|---|---|
| Bukti on-chain | 7 artefak: 6 kartu transaksi yang bisa diklik (5 Arbitrum, 1 Sepolia) + SRA terdaftar |
| Unit test | 73 |
| Playwright QA | 47 case |
| Partner terintegrasi | 5 dari 5 |
| Slide deck | 10 |
| Alamat pot (owner) | `0x0Eba675deBf832A81815Fe96025E04d5f40379C6` |
| Smart Routing Address | `0x0b72F6cD65c80CD9003128746B42c7dAe738D895` |
