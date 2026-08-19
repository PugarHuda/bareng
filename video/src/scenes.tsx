// The seven scenes, in order. Each one is handed its own narration lines and times its visuals to
// them: a card appears on the sentence that describes it, never before. `Sequence layout="none"`
// throughout, because the default wraps children in an AbsoluteFill and that would collapse the
// flex layout each scene is built on.
import React from "react";
import { AbsoluteFill, Sequence, OffthreadVideo, staticFile, useCurrentFrame, interpolate } from "remotion";
import { C, neo } from "./theme";
import { Scene, Rise, Pop, Card, Chip, Eyebrow, Title, Mark, CountUp } from "./ui";

export type Line = { id: string; text: string; src: string; from: number; narrationInFrames: number; durationInFrames: number };
type P = { lines: Line[] };

// Beat n of the scene, mounted only while its line is being spoken. Returns nothing when the line
// does not exist: merging two sentences into one is a normal edit, and it should not take the whole
// render down at the frame where the missing beat would have appeared.
const Beat: React.FC<{ lines: Line[]; n: number; children: React.ReactNode }> = ({ lines, n, children }) => {
  const l = lines[n];
  if (!l) return null;
  return <Sequence layout="none" from={l.from} durationInFrames={l.durationInFrames}>{children}</Sequence>;
};

// A beat that arrives partway through its own line — for a sentence that makes two points and wants
// the second one to land on the words rather than with them.
const Late: React.FC<{ lines: Line[]; n: number; after: number; children: React.ReactNode }> = ({ lines, n, after, children }) => {
  const l = lines[n];
  if (!l) return null;
  return <Sequence layout="none" from={l.from + after} durationInFrames={l.durationInFrames - after}>{children}</Sequence>;
};

const Row: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 26 }) => (
  <div style={{ display: "flex", gap, marginTop: 44 }}>{children}</div>
);

const Big: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ margin: "44px 0 0", fontSize: 62, lineHeight: 1.08, fontWeight: 900, letterSpacing: -1 }}>{children}</p>
);

// ---------------------------------------------------------------- 1 · title

// The beats under the title swap out mid-scene, so they live in a fixed-height box. Letting the
// column resize would bounce the headline every time a card appeared.
const TitleBeats: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ height: 330, marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start" }}>{children}</div>
);

export const TitleScene: React.FC<P> = ({ lines }) => (
  <Scene style={{ alignItems: "center", textAlign: "center" }}>
    <Pop>
      <span style={{
        display: "grid", placeItems: "center", width: 92, height: 92, margin: "0 auto", borderRadius: 22,
        background: C.yellow, fontSize: 52, fontWeight: 900, ...neo(7),
      }}>B</span>
    </Pop>
    <Rise delay={6}>
      <h1 style={{ margin: "28px 0 0", fontSize: 112, lineHeight: 1.02, fontWeight: 900, letterSpacing: -3 }}>
        Money, <Mark bg={C.pink} delay={16}>together.</Mark>
      </h1>
    </Rise>

    <Beat lines={lines} n={0}>
      <TitleBeats>
        <div style={{ display: "flex", gap: 22 }}>
          {["Patungan", "Arisan", "Splitting a bill"].map((t, i) => (
            <Rise key={t} delay={8 + i * 9}>
              <Card bg={[C.yellow, C.blue, C.lime][i]} pad={26}>
                <p style={{ margin: 0, fontSize: 44, fontWeight: 900 }}>{t}</p>
              </Card>
            </Rise>
          ))}
        </div>
      </TitleBeats>
    </Beat>

    <Beat lines={lines} n={1}>
      <TitleBeats>
        <Rise delay={4} travel={26}>
          <Card bg={C.panel} pad={32}>
            <p style={{ margin: 0, fontSize: 48, fontWeight: 900 }}>Every crypto product ever built</p>
          </Card>
        </Rise>
        <Pop delay={16} style={{ marginTop: 26 }}>
          <div style={{ transform: "rotate(-3deg)", background: C.red, borderRadius: 14, padding: "16px 30px", ...neo(6) }}>
            <p style={{ margin: 0, fontSize: 50, fontWeight: 900, letterSpacing: 1 }}>SINGLE USER</p>
          </div>
        </Pop>
      </TitleBeats>
    </Beat>

    <Beat lines={lines} n={2}>
      <TitleBeats>
        <Rise delay={4} travel={26}>
          <Card bg={C.green} pad={32}>
            <p style={{ margin: 0, fontSize: 48, fontWeight: 900 }}>One account · Many people · Real limits</p>
          </Card>
        </Rise>
        <Rise delay={20} style={{ marginTop: 30 }}>
          <Chip>UXmaxx · Universal Accounts (EIP-7702)</Chip>
        </Rise>
      </TitleBeats>
    </Beat>
  </Scene>
);

// ---------------------------------------------------------------- 2 · problem

export const ProblemScene: React.FC<P> = ({ lines }) => (
  <Scene>
    <Rise><Eyebrow>The problem</Eyebrow></Rise>
    <Rise delay={4}>
      <Title>Group money is everywhere.<br />On-chain, it&apos;s a mess.</Title>
    </Rise>

    <Beat lines={lines} n={0}>
      <Row>
        {["A group chat", "A spreadsheet", "One person holding everyone's money"].map((t, i) => (
          <Rise key={t} delay={6 + i * 8} style={{ flex: 1 }}>
            <Card pad={26} style={{ height: "100%" }}>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 900, lineHeight: 1.15 }}>{t}</p>
            </Card>
          </Rise>
        ))}
      </Row>
    </Beat>

    <Beat lines={lines} n={1}>
      <Row>
        {["Share a seed phrase", "Or do not share at all"].map((t, i) => (
          <Rise key={t} delay={6 + i * 12} style={{ flex: 1 }}>
            <Card bg={C.red} pad={30} style={{ height: "100%" }}>
              <p style={{ margin: 0, fontSize: 40, fontWeight: 900, lineHeight: 1.15 }}>{t}</p>
            </Card>
          </Rise>
        ))}
      </Row>
    </Beat>

    <Late lines={lines} n={1} after={140}>
      <Rise delay={3}>
        <Big>Nobody has built <Mark bg={C.yellow} delay={12}>the shared account.</Mark></Big>
      </Rise>
    </Late>
  </Scene>
);

// ---------------------------------------------------------------- 3 · recorded app

// A label per beat. The narration says these things too, but a viewer who glanced away needs one
// glance to know which part of the product is on screen.
const CHAPTERS: Record<string, string> = {
  c1: "One shared balance", c2: "Pay by handle", c3: "Settled on Arbitrum", c4: "The cap refuses",
  u1: "Arisan · verifiable draw", u2: "Split & settle up", u3: "Private receive",
  u4: "Earn on idle balance", u5: "Capped agent · x402",
};

// The footage is fitted above the caption rather than run full-bleed under it. Full-bleed looked
// better on a still frame and was worse to actually watch: the caption sat on top of the member
// list and the amount field, which is exactly the part of the screen the sentence is talking about.
// Losing a fifth of the width costs less than covering the thing being explained.
// Sized to clear CAPTION_BAND with room to spare: 20 + 840 leaves 220px of the frame below it.
const FRAME = { w: 1493, h: 840, top: 20 };

export const ClipScene: React.FC<P & { id: string }> = ({ lines, id }) => {
  const frame = useCurrentFrame();
  const last = lines[lines.length - 1];
  // A slow drift. Barely perceptible, but it keeps a recording of a mostly static page from
  // reading as a frozen frame. Kept small: the frame crops whatever the zoom pushes past its edge.
  const scale = interpolate(frame, [0, last.from + last.durationInFrames], [1.0, 1.03]);
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: FRAME.top, left: (1920 - FRAME.w) / 2, width: FRAME.w, height: FRAME.h,
        borderRadius: 16, overflow: "hidden", background: C.ink, ...neo(12),
      }}>
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
          <OffthreadVideo src={staticFile(`clip/${id}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
        {lines.map((l) => (
          <Sequence key={l.id} layout="none" from={l.from} durationInFrames={l.durationInFrames}>
            <div style={{ position: "absolute", left: 26, top: 22 }}>
              <Rise delay={2} travel={18}>
                <div style={{ background: C.yellow, borderRadius: 12, padding: "10px 20px", ...neo(5) }}>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.ink }}>{CHAPTERS[l.id] ?? ""}</p>
                </div>
              </Rise>
            </div>
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4 · the account

const CHAINS = ["Arbitrum", "Base", "Ethereum", "BNB", "Optimism"];

export const AccountScene: React.FC<P> = ({ lines }) => (
  <Scene>
    <Rise><Eyebrow>How it uses EIP-7702</Eyebrow></Rise>
    <Rise delay={4}>
      <Title>The account <Mark bg={C.yellow} delay={14}>is</Mark> 7702.</Title>
    </Rise>

    <Beat lines={lines} n={0}>
      <Row gap={22}>
        {[["Google login", C.panel], ["Seedless EOA", C.purple], ["Universal Account", C.green]].map(([t, bg], i) => (
          <React.Fragment key={t as string}>
            {i > 0 && <Pop delay={30 + i * 14} style={{ alignSelf: "center" }}><p style={{ margin: 0, fontSize: 44, fontWeight: 900 }}>→</p></Pop>}
            <Rise delay={30 + i * 14} style={{ flex: 1 }}>
              <Card bg={bg as string} pad={22} style={{ height: "100%" }}>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>{t as string}</p>
              </Card>
            </Rise>
          </React.Fragment>
        ))}
      </Row>
    </Beat>

    <Late lines={lines} n={0} after={215}>
      <Row gap={22}>
        <Rise delay={2} style={{ flex: 1 }}>
          <Card pad={26} style={{ height: "100%" }}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 900, opacity: 0.55 }}>BEFORE</p>
            <p style={{ margin: "10px 0 0", fontSize: 30, fontWeight: 900, fontFamily: "monospace" }}>0x0Eba…79C6</p>
            <p style={{ margin: "10px 0 0", fontSize: 26, fontWeight: 700, opacity: 0.7 }}>A plain wallet</p>
          </Card>
        </Rise>
        <Pop delay={10} style={{ alignSelf: "center" }}>
          <p style={{ margin: 0, fontSize: 60, fontWeight: 900 }}>→</p>
        </Pop>
        <Rise delay={16} style={{ flex: 1 }}>
          <Card bg={C.blue} pad={26} style={{ height: "100%" }}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 900, opacity: 0.6 }}>AFTER</p>
            <p style={{ margin: "10px 0 0", fontSize: 30, fontWeight: 900, fontFamily: "monospace" }}>0x0Eba…79C6</p>
            <p style={{ margin: "10px 0 0", fontSize: 26, fontWeight: 700 }}>A Universal Account</p>
          </Card>
        </Rise>
      </Row>
      <Rise delay={26}>
        <p style={{ margin: "22px 0 0", fontSize: 32, fontWeight: 800, opacity: 0.7 }}>
          Same address. Nothing deployed.
        </p>
      </Rise>
    </Late>

    <Beat lines={lines} n={1}>
      <div style={{ display: "flex", gap: 16, marginTop: 44, flexWrap: "wrap" }}>
        {CHAINS.map((c, i) => (
          <Rise key={c} delay={i * 6}><Chip bg={[C.green, C.blue, C.purple, C.yellow, C.pink][i]}>{c}</Chip></Rise>
        ))}
      </div>
      <Rise delay={CHAINS.length * 6 + 4}>
        <Card bg={C.yellow} pad={30} style={{ marginTop: 26 }}>
          <p style={{ margin: 0, fontSize: 40, fontWeight: 900 }}>
            One balance: <CountUp to={420} prefix="$" delay={CHAINS.length * 6 + 8} />
          </p>
        </Card>
      </Rise>
    </Beat>
  </Scene>
);

// ---------------------------------------------------------------- 5 · proof

const PROOFS: { t: string; chain: string; tx: string; c: string }[] = [
  { t: "Shared-UA spend", chain: "Arbitrum", c: C.green, tx: "0x40a4722a…d50f7" },
  { t: "7702 cap enforced", chain: "Sepolia", c: C.blue, tx: "0x73ad508a…34036" },
  { t: "Aave v3 DeFi lend", chain: "Arbitrum", c: C.pink, tx: "0x7b5698c0…606dad" },
  { t: "x402 agent payment", chain: "Arbitrum", c: C.orange, tx: "0x4870c99a…ad67e" },
  { t: "Private stealth sweep", chain: "Arbitrum", c: C.yellow, tx: "0xb338f36d…f3ebe" },
  { t: "Dashboard receipts ×4", chain: "Arbitrum", c: C.purple, tx: "0x4a5d673b…0176e1" },
];

export const ProofScene: React.FC<P> = ({ lines }) => (
  <Scene>
    <Rise><Eyebrow>Not a mockup</Eyebrow></Rise>
    <Rise delay={4}>
      <Title>
        <Mark bg={C.green} delay={12}>Seven</Mark> things settled on-chain.
      </Title>
    </Rise>

    <Beat lines={lines} n={1}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 40 }}>
        {PROOFS.map((p, i) => (
          <Rise key={p.tx} delay={i * 7}>
            <Card pad={22} offset={6}>
              <Chip bg={p.c}>{p.chain}</Chip>
              <p style={{ margin: "12px 0 0", fontSize: 30, fontWeight: 900, lineHeight: 1.1 }}>{p.t}</p>
              <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 800, fontFamily: "monospace", opacity: 0.6 }}>{p.tx} ↗</p>
            </Card>
          </Rise>
        ))}
      </div>
    </Beat>

    <Beat lines={lines} n={2}>
      <Rise delay={3}><Big>Most teams here <Mark bg={C.pink} delay={12}>do not have one.</Mark></Big></Rise>
    </Beat>
  </Scene>
);

// ---------------------------------------------------------------- 6 · partners

const PARTNERS: [string, string, string][] = [
  ["Particle", C.yellow, "Universal Account in EIP-7702 mode — the cross-chain balance."],
  ["Magic", C.blue, "Google login to a seedless EOA. No wallet, no seed phrase."],
  ["Arbitrum", C.green, "Where every spend settles. Five real transactions."],
  ["ZeroDev", C.purple, "Kernel7702 cap enforced on-chain, plus a working cross-chain address."],
  ["Openfort", C.orange, "A real x402 handshake, signed and settled."],
];

export const PartnersScene: React.FC<P> = ({ lines }) => (
  <Scene>
    <Rise><Eyebrow>Built with</Eyebrow></Rise>
    <Rise delay={4}><Title>All five partners. For real.</Title></Rise>

    <Beat lines={lines} n={1}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 36 }}>
        {PARTNERS.map(([n, c, d], i) => (
          <Rise key={n} delay={i * 11} travel={26}>
            <Card pad={18} offset={6} style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <span style={{
                display: "grid", placeItems: "center", width: 210, minWidth: 210, height: 62, borderRadius: 12,
                background: c, fontSize: 30, fontWeight: 900, border: `3px solid ${C.ink}`,
              }}>{n}</span>
              <p style={{ margin: 0, fontSize: 27, fontWeight: 700, opacity: 0.85 }}>{d}</p>
            </Card>
          </Rise>
        ))}
      </div>
    </Beat>
  </Scene>
);

// ---------------------------------------------------------------- 7 · close

export const CloseScene: React.FC<P> = ({ lines }) => (
  <Scene style={{ alignItems: "center", textAlign: "center" }}>
    <Beat lines={lines} n={0}>
      <Rise>
        <h2 style={{ margin: 0, fontSize: 96, fontWeight: 900, letterSpacing: -3 }}>
          Money, <Mark bg={C.pink} delay={12}>together.</Mark>
        </h2>
      </Rise>
      <div style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}>
        {["One shared balance", "Real per-person limits", "Private receives", "No gas, no chains, no seed phrases"].map((t, i) => (
          <Rise key={t} delay={10 + i * 8}><Chip bg={[C.yellow, C.green, C.purple, C.blue][i]}>{t}</Chip></Rise>
        ))}
      </div>
    </Beat>

    <Late lines={lines} n={0} after={275}>
      <Row gap={26}>
        {[["7", "settled on-chain"], ["5", "real integrations"]].map(([n, l], i) => (
          <Rise key={l} delay={i * 12}>
            <Card bg={i === 0 ? C.green : C.yellow} pad={34}>
              <p style={{ margin: 0, fontSize: 96, fontWeight: 900, lineHeight: 1 }}>
                <CountUp to={Number(n)} delay={i * 12 + 6} frames={20} />
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 30, fontWeight: 900 }}>{l}</p>
            </Card>
          </Rise>
        ))}
      </Row>
    </Late>

    <Beat lines={lines} n={1}>
      <Pop>
        <span style={{
          display: "grid", placeItems: "center", width: 92, height: 92, margin: "0 auto", borderRadius: 22,
          background: C.yellow, fontSize: 52, fontWeight: 900, ...neo(7),
        }}>B</span>
      </Pop>
      <Rise delay={8}>
        <p style={{ margin: "30px 0 0", fontSize: 40, fontWeight: 900 }}>bareng-jade.vercel.app</p>
        <p style={{ margin: "10px 0 0", fontSize: 30, fontWeight: 800, opacity: 0.6 }}>github.com/PugarHuda/bareng</p>
      </Rise>
    </Beat>
  </Scene>
);

export const SCENE_COMPONENTS: Record<string, React.FC<P>> = {
  title: TitleScene,
  problem: ProblemScene,
  seven02: AccountScene,
  proof: ProofScene,
  partners: PartnersScene,
  close: CloseScene,
};
