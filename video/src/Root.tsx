import React from "react";
import { Composition } from "remotion";
import { Pitch } from "./Pitch";
import { Demo, DEMO_FRAMES } from "./Demo";
import timeline from "./timeline.json";

// Two compositions from one timeline. Pitch is what gets sent to the organisers; Demo is the
// recorded scenes on their own, for the case where they cannot play it and ask for a live pitch —
// same footage, same audio, so the two can never drift apart.
//
// Neither length is set by hand: scripts/vo.mjs measures the narration, so the three minute limit
// is checked there rather than discovered at the end of a render.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Pitch"
      component={Pitch}
      durationInFrames={timeline.durationInFrames}
      fps={timeline.fps}
      width={1920}
      height={1080}
    />
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={DEMO_FRAMES}
      fps={timeline.fps}
      width={1920}
      height={1080}
    />
  </>
);
