import { intensityOf, quadrantOf, type MoodPoint, type Quadrant } from './mood';

/**
 * Words per quadrant, ordered from gentlest to strongest. These are exactly
 * the words the backend stores (same spelling and case, e.g. "At Ease") --
 * the partner's quadrant is also inferred from their word, so the sets must
 * not drift. Only the order is new.
 */
export const WORDS: Record<Quadrant, string[]> = {
  stirred: [
    'Bothered', 'Uneasy', 'Peeved', 'Annoyed', 'Displeased', 'Nervous', 'Restless', 'Worried', 'Irritated',
    'Troubled', 'Tense', 'Apprehensive', 'Jittery', 'Frustrated', 'Stressed', 'Anxious', 'Repulsed',
    'Overwhelmed', 'Stunned', 'Shocked', 'Fuming', 'Panicked', 'Furious', 'Livid', 'Enraged',
  ],
  bright: [
    'Pleased', 'Focused', 'Hopeful', 'Upbeat', 'Cheerful', 'Amused', 'Proud', 'Motivated', 'Eager',
    'Optimistic', 'Playful', 'Inspired', 'Joyful', 'Energized', 'Delighted', 'Enthusiastic', 'Surprised',
    'Excited', 'Festive', 'Hyper', 'Thrilled', 'Elated', 'Blissful', 'Exhilarated', 'Ecstatic',
  ],
  heavy: [
    'Bored', 'Tired', 'Apathetic', 'Down', 'Disappointed', 'Fatigued', 'Weary', 'Pessimistic', 'Sad',
    'Gloomy', 'Lonely', 'Withdrawn', 'Numb', 'Empty', 'Isolated', 'Alienated', 'Disheartened', 'Guilty',
    'Remorseful', 'Melancholic', 'Exhausted', 'Miserable', 'Depressed', 'Despondent', 'Hopeless',
  ],
  settled: [
    'Sleepy', 'Complacent', 'Mellow', 'Chill', 'Thoughtful', 'Reflective', 'Comfortable', 'Content',
    'At Ease', 'Relaxed', 'Restful', 'Cozy', 'Calm', 'Balanced', 'Satisfied', 'Secure', 'Carefree',
    'Grateful', 'Touched', 'Loving', 'Fulfilled', 'Peaceful', 'Blessed', 'Tranquil', 'Serene',
  ],
};

/**
 * The ~10 words closest to where the light sits: the quadrant picks the
 * list, the distance from the centre picks how strong the words are.
 */
export function wordsFor(p: MoodPoint, count = 10, all = false): string[] {
  const list = WORDS[quadrantOf(p)];
  if (all || count >= list.length) return list;
  const start = Math.round(intensityOf(p) * (list.length - count));
  return list.slice(start, start + count);
}

/** Which quadrant a stored word belongs to (used for the partner's colour). */
export function quadrantOfWord(word: string): Quadrant | undefined {
  return (Object.keys(WORDS) as Quadrant[]).find((q) => WORDS[q].includes(word));
}
