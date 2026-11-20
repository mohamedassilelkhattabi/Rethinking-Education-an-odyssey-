export const XP_PER_QUESTION = 100;
export const XP_WITH_HINT = 50;
export const QUESTIONS_PER_CHAPTER = 3;
export const MAX_CHAPTER_XP = XP_PER_QUESTION * QUESTIONS_PER_CHAPTER;
export const MAX_XP = MAX_CHAPTER_XP * 6;

/** XP for a correct answer. Incorrect answers never call this — they fail the chapter (0 XP). */
export function questionXP(usedHint: boolean): number {
  return usedHint ? XP_WITH_HINT : XP_PER_QUESTION;
}

export interface Rank {
  title: string;
  min: number;
  max: number;
  description: string;
}

export const RANKS: Rank[] = [
  { title: 'Calculus Laureate', min: 1600, max: 1800, description: 'Athena herself would seek your counsel on limits and integrals.' },
  { title: 'Master Strategist', min: 1200, max: 1599, description: 'Your calculus reasoning steers true through every storm.' },
  { title: 'Wise Navigator', min: 800, max: 1199, description: 'Bold and growing sharper with every derivative and integral.' },
  { title: 'Aspiring Voyager', min: 0, max: 799, description: 'Every mathematical odyssey begins with a first step.' },
];

export function getRank(xp: number): Rank {
  const clamped = Math.max(0, Math.min(MAX_XP, Math.floor(xp)));
  return RANKS.find((r) => clamped >= r.min && clamped <= r.max) ?? RANKS[RANKS.length - 1];
}
