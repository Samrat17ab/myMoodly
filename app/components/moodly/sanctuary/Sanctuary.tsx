'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { getScene, type SceneId } from '../lib/scenes';
import { useSanctuary } from './SanctuaryProvider';
import { SceneView } from './SceneView';

export type SanctuaryMode = 'full' | 'soft' | 'recede';

interface Props {
  /** full = landing/home/waiting, soft = check-in steps, recede = chat */
  mode?: SanctuaryMode;
  /** true: covers the viewport behind the page. false: fills its positioned parent. */
  fixed?: boolean;
  /** force a scene for this surface only (rarely needed) */
  scene?: SceneId;
  className?: string;
}

export function Sanctuary({ mode = 'full', fixed = true, scene: forced, className }: Props) {
  const { scene, ready, paused, still } = useSanctuary();
  const reduce = useReducedMotion();
  const s = forced ? getScene(forced) : scene;
  const cls = [
    'mm-sanctuary',
    `mm-sanctuary--${mode}`,
    fixed ? 'mm-sanctuary--fixed' : '',
    paused || still || reduce ? 'is-still' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} data-scene={s.family} aria-hidden="true">
      <AnimatePresence initial={false}>
        {ready && (
          <motion.div
            key={s.id}
            className="mm-sanctuary__layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.3 : 5, ease: 'easeInOut' }}
          >
            <div className="mm-sanctuary__scene">
              <SceneView id={s.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mm-sanctuary__veil" />
    </div>
  );
}
