import React from "react";
import { Composition } from "remotion";
import { Pitch } from "./Pitch";
import timeline from "./timeline.json";

// One composition. Its length is the narration's length, so the three minute limit is checked by
// scripts/vo.mjs rather than by watching the render finish.
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Pitch"
    component={Pitch}
    durationInFrames={timeline.durationInFrames}
    fps={timeline.fps}
    width={1920}
    height={1080}
  />
);
