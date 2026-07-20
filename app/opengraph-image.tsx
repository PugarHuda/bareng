import { ImageResponse } from "next/og";

// Native Next OG image — generated, no external asset. Neobrutalism to match the app.
export const runtime = "edge";
export const alt = "Bareng — a shared group wallet: one Universal Account, per-member EIP-7702 limits.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  const ink = "#111";
  const shadow = `10px 10px 0 ${ink}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FBF7ED",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFD84D",
              border: `4px solid ${ink}`,
              borderRadius: 16,
              boxShadow: shadow,
              fontSize: 46,
              fontWeight: 900,
              color: ink,
            }}
          >
            B
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: ink }}>Bareng</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 1, color: ink }}>Money,</div>
          <div style={{ display: "flex", marginTop: 8 }}>
            <div
              style={{
                fontSize: 108,
                fontWeight: 900,
                lineHeight: 1,
                color: ink,
                background: "#FF8FB1",
                padding: "0 16px",
                border: `4px solid ${ink}`,
                boxShadow: shadow,
              }}
            >
              together.
            </div>
          </div>
          <div style={{ marginTop: 34, fontSize: 34, fontWeight: 600, color: "#333", maxWidth: 940 }}>
            One shared Universal Account · per-member EIP-7702 limits · no gas, no seed phrase.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Particle", "Magic", "Arbitrum", "ZeroDev", "Openfort"].map((p) => (
            <div
              key={p}
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: ink,
                background: "#fff",
                border: `4px solid ${ink}`,
                borderRadius: 10,
                padding: "8px 18px",
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
