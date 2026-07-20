import { ImageResponse } from "next/og";

// OG card for the pitch deck (/deck) — generated, no external asset. Neobrutalism, deck-flavored.
export const runtime = "edge";
export const alt = "Bareng — pitch deck. A shared group wallet, proven on-chain across 7 artifacts.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  const ink = "#111";
  const shadow = `10px 10px 0 ${ink}`;
  const chip = (bg: string, label: string) => (
    <div style={{ display: "flex", fontSize: 22, fontWeight: 900, color: ink, background: bg, border: `4px solid ${ink}`, borderRadius: 10, padding: "8px 16px" }}>{label}</div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FBF7ED", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", background: "#FFD84D", border: `4px solid ${ink}`, borderRadius: 16, boxShadow: shadow, fontSize: 42, fontWeight: 900, color: ink }}>B</div>
            <div style={{ fontSize: 38, fontWeight: 900, color: ink }}>Bareng</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 900, color: "#333", background: "#D9F99D", border: `4px solid ${ink}`, borderRadius: 10, padding: "8px 16px" }}>PITCH DECK</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex" }}>
            <div style={{ fontSize: 92, fontWeight: 900, lineHeight: 1.05, color: ink, background: "#FF8FB1", padding: "0 16px", border: `4px solid ${ink}`, boxShadow: shadow }}>
              Money, together.
            </div>
          </div>
          <div style={{ marginTop: 30, fontSize: 34, fontWeight: 700, color: "#222" }}>
            A shared group wallet — proven on-chain across 7 real artifacts.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {chip("#FDE68A", "Particle")}{chip("#BFDBFE", "Magic")}{chip("#A7F3D0", "Arbitrum")}{chip("#E9D5FF", "ZeroDev")}{chip("#FED7AA", "Openfort")}
        </div>
      </div>
    ),
    size,
  );
}
