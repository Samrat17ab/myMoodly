import type { SceneFamily } from "../scenes";
import { DawnIllustration } from "./DawnIllustration";
import { DayIllustration } from "./DayIllustration";
import { GoldenIllustration } from "./GoldenIllustration";
import { NightIllustration } from "./NightIllustration";

/** One hand-illustrated backdrop per time-of-day family. Individual scenes
 * within a family still vary via their own gradient tint (used for the
 * scene-picker swatches) and overlay mix (mist/birds/fireflies/etc). */
export function IllustrationView({ family }: { family: SceneFamily }) {
  switch (family) {
    case "dawn":
      return <DawnIllustration />;
    case "golden":
      return <GoldenIllustration />;
    case "night":
      return <NightIllustration />;
    case "day":
    default:
      return <DayIllustration />;
  }
}
