"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SCENES,
  scenesForFamily,
  pickScene,
  SCENE_ROTATION_MS,
  CROSSFADE_MS,
  type MoodAffinity,
} from "./scenes";
import { useSceneFamily } from "./useSceneFamily";
import { useReducedMotionSafe } from "@/app/hooks/useReducedMotionSafe";
import { useStoredValue, writeStored } from "@/app/hooks/useStoredValue";
import { OVERLAY_COMPONENTS } from "./overlays";
import { IllustrationView } from "./illustrations/IllustrationView";
import { useAmbientAudio } from "./useAmbientAudio";
import { SceneControls } from "./SceneControls";

const PIN_KEY = "moodly:pinned-scene";
const MOVEMENT_KEY = "moodly:scene-movement";

export type SanctuaryMode = "full" | "softened" | "receded";

export function Sanctuary({
  mood,
  mode = "full",
  showControls = true,
  mutedByContext = false,
}: {
  mood?: MoodAffinity;
  mode?: SanctuaryMode;
  showControls?: boolean;
  mutedByContext?: boolean;
}) {
  const family = useSceneFamily();
  const reduced = useReducedMotionSafe();
  const pinnedId = useStoredValue(PIN_KEY);
  const movementOn = useStoredValue(MOVEMENT_KEY) !== "0";
  const [tabHidden, setTabHidden] = useState(false);
  const [sceneId, setSceneId] = useState<string>(() => scenesForFamily("day")[0].id);

  // Reset the scene when the time family, mood, or pin changes. Computed
  // during render (React's documented pattern for "adjusting state when a
  // prop changes") rather than in an effect, so it takes effect in the same
  // commit instead of one render later.
  const resetKey = `${family}|${mood ?? ""}|${pinnedId ?? ""}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setSceneId(pinnedId ?? pickScene(family, mood).id);
  }

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // tokens.css keys a light-on-dark override off data-scene-theme="night" on
  // <html>, so text stays readable once the night scene is showing -- nothing
  // was ever setting it, so every screen used dark text even over the night
  // sky.
  useEffect(() => {
    document.documentElement.dataset.sceneTheme = family === "night" ? "dark" : "light";
  }, [family]);

  const paused = reduced || !movementOn || tabHidden || Boolean(pinnedId);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setSceneId((current) => pickScene(family, mood, current).id);
    }, SCENE_ROTATION_MS);
    return () => clearInterval(id);
  }, [paused, family, mood]);

  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
  const audio = useAmbientAudio(scene.ambientAudio, mutedByContext || tabHidden);

  const togglePin = useCallback(() => {
    writeStored(PIN_KEY, pinnedId ? null : sceneId);
  }, [pinnedId, sceneId]);

  const toggleMovement = useCallback(() => {
    writeStored(MOVEMENT_KEY, movementOn ? "0" : "1");
  }, [movementOn]);

  return (
    <>
      <div
        className={`sanctuary is-${mode}`}
        data-motion={reduced || !movementOn ? "off" : "on"}
        style={{ "--sanctuary-crossfade": `${CROSSFADE_MS}ms` } as React.CSSProperties}
      >
        <AnimatePresence>
          <motion.div
            key={scene.id}
            className="sanctuary-poster is-active"
            style={
              scene.poster
                ? { backgroundImage: `url(${scene.poster})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: scene.gradient }
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: CROSSFADE_MS / 1000 }}
          >
            {scene.video && !reduced && (
              <video className="sanctuary-video" autoPlay muted loop playsInline src={scene.video} />
            )}
            {!scene.poster && !scene.video && <IllustrationView family={scene.family} />}
            {mode !== "receded" &&
              scene.overlays.map((kind) => {
                const Overlay = OVERLAY_COMPONENTS[kind];
                return <Overlay key={kind} />;
              })}
          </motion.div>
        </AnimatePresence>
      </div>
      {showControls && (
        <SceneControls
          scenes={scenesForFamily(family)}
          currentId={scene.id}
          pinned={Boolean(pinnedId)}
          movementOn={movementOn}
          soundOn={audio.enabled}
          onPick={setSceneId}
          onTogglePin={togglePin}
          onToggleMovement={toggleMovement}
          onToggleSound={audio.toggle}
        />
      )}
    </>
  );
}
