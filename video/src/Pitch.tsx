// The film. Scene order, narration and captions all come from src/timeline.json, which is written
// by scripts/vo.mjs from the real audio durations — so nothing here is timed by hand, and
// re-recording a line re-cuts the picture to match on the next render.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Backdrop, Caption, Chrome, FONT } from "./ui";
import { SCENE_COMPONENTS, ClipScene, type Line } from "./scenes";
import timeline from "./timeline.json";

type SceneRow = { id: string; clip: boolean; from: number; durationInFrames: number; lines: Line[] };
const scenes = timeline.scenes as SceneRow[];

// Every graphic scene fades up over a fifth of a second. The demo cuts hard instead: a dissolve
// into live footage reads as a slideshow effect, a cut reads as "here is the product".
const Enter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 7], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o, transform: `scale(${0.985 + o * 0.015})` }}>{children}</AbsoluteFill>;
};

export const Pitch: React.FC = () => {
  const frame = useCurrentFrame();
  const current = scenes.find((s) => frame >= s.from && frame < s.from + s.durationInFrames) ?? scenes[0];

  return (
    // The font belongs here rather than on each scene: the captions and the frame furniture sit
    // outside every scene, and without it they fall back to the browser's serif default.
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />

      {scenes.map((sc) => {
        const Comp = SCENE_COMPONENTS[sc.id];
        return (
          <Sequence key={sc.id} name={sc.id} from={sc.from} durationInFrames={sc.durationInFrames}>
            {sc.clip
              ? <ClipScene id={sc.id} lines={sc.lines} />
              : <Enter><Comp lines={sc.lines} /></Enter>}
          </Sequence>
        );
      })}

      {/* Voice and captions are one layer over the top, so a line always speaks and reads at the
          same instant no matter which scene is underneath. */}
      {scenes.flatMap((sc) =>
        sc.lines.map((l) => (
          <Sequence key={l.id} name={l.id} from={sc.from + l.from} durationInFrames={l.durationInFrames}>
            <Audio src={staticFile(l.src)} />
            <Caption text={l.text} durationInFrames={l.durationInFrames} />
          </Sequence>
        )),
      )}

      {/* A counter rather than the section name: every scene already prints its own eyebrow, and
          the same words twice on one frame read as a mistake. */}
      <Chrome
        label={`${String(scenes.indexOf(current) + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}`}
        total={timeline.durationInFrames}
        brand={!current.clip}
      />
    </AbsoluteFill>
  );
};
