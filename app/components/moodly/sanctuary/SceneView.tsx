import type { SceneId } from '../lib/scenes';
import { DawnLake } from './scenes/DawnLake';
import { DayMeadow } from './scenes/DayMeadow';
import { GoldenShore } from './scenes/GoldenShore';
import { NightAurora } from './scenes/NightAurora';

export function SceneView({ id }: { id: SceneId }) {
  switch (id) {
    case 'dawn-lake':
      return <DawnLake />;
    case 'golden-shore':
      return <GoldenShore />;
    case 'night-aurora':
      return <NightAurora />;
    case 'day-meadow':
    default:
      return <DayMeadow />;
  }
}
