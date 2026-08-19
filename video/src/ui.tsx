// Shared motion and layout pieces. Everything animated in this film goes through Rise or Pop, so
// the whole thing moves with one physical feel instead of seven scenes each easing differently.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img, staticFile } from "remotion";
import { C, FONT, neo } from "./theme";

// A spring that starts at `delay` frames and is safe to call anywhere: Remotion needs fps, and
// reading it here keeps every caller from threading it through.
export const useEnter = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.6 } });
};

// Enters upward from below. The default of a small travel is intentional: a big slide reads as a
// transition, and most of these are elements appearing inside a scene that is already on screen.
export const Rise: React.FC<{
  delay?: number; travel?: number; style?: React.CSSProperties; children: React.ReactNode;
}> = ({ delay = 0, travel = 34, style, children }) => {
  const e = useEnter(delay);
  return (
    <div style={{ ...style, opacity: e, transform: `translateY(${(1 - e) * travel}px)` }}>{children}</div>
  );
};

// Enters by overshooting its size slightly. For things that should feel stamped down: the logo,
// a badge, a number landing.
export const Pop: React.FC<{
  delay?: number; style?: React.CSSProperties; children: React.ReactNode;
}> = ({ delay = 0, style, children }) => {
  const e = useEnter(delay, 11);
  return <div style={{ ...style, opacity: Math.min(1, e * 2), transform: `scale(${e})` }}>{children}</div>;
};

// Counts up to a number and stops. Used for the balance, because a figure that lands is read and a
// figure that is simply present is skimmed past.
export const CountUp: React.FC<{ to: number; delay?: number; prefix?: string; frames?: number }> = ({
  to, delay = 0, prefix = "", frames = 28,
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame - delay, [0, frames], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>{prefix}{Math.round(v).toLocaleString("en-US")}</>;
};

export const Card: React.FC<{
  bg?: string; pad?: number; offset?: number; style?: React.CSSProperties; children: React.ReactNode;
}> = ({ bg = C.panel, pad = 28, offset = 8, style, children }) => (
  <div style={{ background: bg, borderRadius: 18, padding: pad, color: C.ink, ...neo(offset), ...style }}>{children}</div>
);

export const Chip: React.FC<{ bg?: string; children: React.ReactNode }> = ({ bg = C.lime, children }) => (
  <span style={{
    display: "inline-block", background: bg, borderRadius: 10, padding: "8px 16px",
    fontSize: 22, fontWeight: 900, color: C.ink, border: `3px solid ${C.ink}`,
  }}>{children}</span>
);

export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", opacity: 0.55 }}>{children}</p>
);

export const Title: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <h2 style={{ margin: "14px 0 0", fontSize: 82, lineHeight: 0.98, fontWeight: 900, letterSpacing: -2, ...style }}>{children}</h2>
);

// A marker-pen highlight that wipes across the text as it is spoken.
export const Mark: React.FC<{ bg?: string; delay?: number; children: React.ReactNode }> = ({
  bg = C.yellow, delay = 0, children,
}) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame - delay, [0, 12], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "0 6px" }}>
      <span style={{ position: "absolute", inset: 0, background: bg, width: `${w}%`, zIndex: 0 }} />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
};

// The ground every scene sits on: cream, a faint ink grid, and a few colour fields that drift far
// too slowly to notice directly. They exist so a held frame is never completely static.
export const Backdrop: React.FC<{ seed?: number }> = ({ seed = 0 }) => {
  const frame = useCurrentFrame();
  const blob = (i: number, color: string, x: number, y: number, r: number) => {
    const t = (frame + seed * 40 + i * 90) / 90;
    return (
      <div key={i} style={{
        position: "absolute", left: x + Math.sin(t) * 22, top: y + Math.cos(t * 0.8) * 18,
        width: r, height: r, borderRadius: "50%", background: color, opacity: 0.22, filter: "blur(60px)",
      }} />
    );
  };
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {blob(0, C.yellow, -140, -120, 620)}
      {blob(1, C.pink, 1480, 720, 560)}
      {blob(2, C.blue, 1180, -220, 480)}
      <AbsoluteFill style={{
        backgroundImage: `radial-gradient(${C.ink}22 2px, transparent 2px)`,
        backgroundSize: "46px 46px",
        backgroundPosition: `${(frame * 0.14) % 46}px ${(frame * 0.09) % 46}px`,
        opacity: 0.5,
      }} />
    </AbsoluteFill>
  );
};

// Persistent frame furniture: who this is, where we are, and how far in. The progress bar is the
// quiet promise that this ends — three minutes of talking head with no horizon feels much longer
// than three minutes with one.
export const Chrome: React.FC<{ label: string; total: number; brand?: boolean }> = ({ label, total, brand = true }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* The app in the recorded footage has its own logo in the same corner. Two of them, one
          on top of the other, reads as a rendering fault rather than branding. */}
      <div style={{ position: "absolute", left: 56, top: 44, display: brand ? "flex" : "none", alignItems: "center", gap: 14 }}>
        <span style={{
          display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: 12,
          background: C.yellow, fontSize: 26, fontWeight: 900, ...neo(4),
        }}>B</span>
        <span style={{ fontSize: 26, fontWeight: 900 }}>Bareng</span>
      </div>
      <div style={{ position: "absolute", right: 56, top: 48, fontSize: 20, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", opacity: 0.5 }}>
        {label}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, background: "#1111111a" }}>
        <div style={{ height: "100%", width: `${(frame / total) * 100}%`, background: C.ink }} />
      </div>
    </AbsoluteFill>
  );
};

// One caption at a time, in the same black box the rest of the film uses. Judges watch these
// back-to-back, often on a shared screen with imperfect audio, so every spoken word is also on
// screen. It enters and leaves with the line, so it is never a stale sentence under a new visual.
export const CAPTION_BAND = 200;

export const Caption: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const o = Math.min(inn, out);
  return (
    // A band of fixed height rather than a box that grows upward off the bottom edge. A four line
    // sentence would otherwise climb into whatever is above it, and over the recorded app that
    // means covering the thing being described — which is the one thing this must never do.
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0, height: CAPTION_BAND,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: o, transform: `translateY(${(1 - o) * 12}px)`,
    }}>
      <p style={{
        margin: 0, maxWidth: 1600, background: C.ink, color: "#fff", borderRadius: 12,
        padding: "16px 26px", fontSize: 32, lineHeight: 1.25, fontWeight: 800, textAlign: "center",
      }}>{text}</p>
    </div>
  );
};

export const Scene: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{
    fontFamily: FONT, color: C.ink, padding: "150px 120px 210px",
    display: "flex", flexDirection: "column", justifyContent: "center", ...style,
  }}>{children}</AbsoluteFill>
);

export { C, FONT, neo, Img, staticFile };
