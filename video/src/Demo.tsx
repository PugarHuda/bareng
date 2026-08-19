// The recorded scenes on their own, for a live pitch.
//
// If the organisers cannot play the pre-recorded film and ask for a live presentation instead, the
// presenter speaks the deck and this plays at the demo slide while they stay quiet. So it keeps its
// own voice and captions — the whole point is that it does not need narrating over — and drops the
// section counter, which means nothing outside the full film.
//
// It is the same scenes, the same audio and the same frames as the pitch video. Rebuilding the demo
// separately would mean two versions of the product footage that could drift apart, and the one
// being played would be the one nobody checked.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Caption, FONT, C } from "./ui";
import { ClipScene, type Line } from "./scenes";
import timeline from "./timeline.json";

type SceneRow = { id: string; clip: boolean; from: number; durationInFrames: number; lines: Line[] };

// Re-based to start at zero: the scenes carry their offset within the full film, which is most of
// the way in, and playing this composition from there would be sixty seconds of nothing.
const clips = (timeline.scenes as SceneRow[]).filter((s) => s.clip);
export const DEMO_FRAMES = clips.reduce((n, s) => n + s.durationInFrames, 0);
const rebased = clips.map((s, i) => ({
  ...s,
  from: clips.slice(0, i).reduce((n, p) => n + p.durationInFrames, 0),
}));

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />

      {rebased.map((sc) => (
        <Sequence key={sc.id} name={sc.id} from={sc.from} durationInFrames={sc.durationInFrames}>
          <ClipScene id={sc.id} lines={sc.lines} />
        </Sequence>
      ))}

      {rebased.flatMap((sc) =>
        sc.lines.map((l) => (
          <Sequence key={l.id} name={l.id} from={sc.from + l.from} durationInFrames={l.durationInFrames}>
            <Audio src={staticFile(l.src)} />
            <Caption text={l.text} durationInFrames={l.durationInFrames} />
          </Sequence>
        )),
      )}

      {/* The progress bar stays. A presenter standing beside a screen needs to know how much of the
          silence is left, and so does the room. */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, background: "#1111111a" }}>
        <div style={{ height: "100%", width: `${(frame / DEMO_FRAMES) * 100}%`, background: C.ink }} />
      </div>
    </AbsoluteFill>
  );
};
