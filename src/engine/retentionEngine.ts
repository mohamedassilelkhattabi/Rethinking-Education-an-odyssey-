import type { CircadianMode, CompassProfile, MotivationArchetype, RealmId } from '../curriculum/types';

export interface ConceptMemory {
  conceptId: string;
  realmId: RealmId;
  questId: string;
  /** Estimated memory half-life in hours (HLR: p = 2^(-deltaHours / halfLifeHours)) */
  halfLifeHours: number;
  lastPracticedAt: number;
  attempts: number;
  fluentSolves: number;
  /** Running average fluidity (0..1, higher = calmer, fewer frantic overshoots) */
  fluidity: number;
  misconceptions: string[];
  completed: boolean;
}

export interface RetentionState {
  version: number;
  concepts: Record<string, ConceptMemory>;
  completedQuestIds: string[];
  compass: CompassProfile;
  circadianMode: CircadianMode;
  eyeRestMode: boolean;
  explorerMode: boolean;
  /** Number of silent ambient current reinforcements completed */
  ambientCurrentsRidden: number;
}

export interface AmbientCurrentEvent {
  conceptId: string;
  questId: string;
  realmId: RealmId;
  recallProbability: number;
  whisperText: string;
}

export interface RetentionStorageAdapter {
  load(): RetentionState | null;
  save(state: RetentionState): void;
  clear(): void;
}

const STORAGE_KEY = 'odyssey.neuroRetention.v1';

export const DEFAULT_COMPASS: CompassProfile = {
  consentGiven: false,
  allowAiTransfer: false,
  allowOracleNudges: true,
  displayName: 'Voyager',
  calmChallengeDial: 38,
  archetype: 'explorer',
  interests: ['Gaming & Physics', 'Music & Audio', 'Sports & Athletics'],
  customInterest: '',
  updatedAt: 0,
};

export function createInitialRetentionState(): RetentionState {
  return {
    version: 1,
    concepts: {},
    completedQuestIds: [],
    compass: { ...DEFAULT_COMPASS },
    circadianMode: 'daylight',
    eyeRestMode: false,
    explorerMode: false,
    ambientCurrentsRidden: 0,
  };
}

export const localRetentionStorage: RetentionStorageAdapter = {
  load(): RetentionState | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<RetentionState>;
      return {
        ...createInitialRetentionState(),
        ...parsed,
        compass: {
          ...DEFAULT_COMPASS,
          ...(parsed.compass ?? {}),
        },
      };
    } catch {
      return null;
    }
  },
  save(state: RetentionState): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore storage quota */
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

/**
 * Half-Life Regression recall probability: p = 2^(-deltaHours / halfLifeHours)
 * Clamped cleanly to [0.05, 1].
 */
export function computeRecallProbability(memory: ConceptMemory, nowMs: number = Date.now()): number {
  const deltaHours = Math.max(0, (nowMs - memory.lastPracticedAt) / 3_600_000);
  const hl = Math.max(0.25, memory.halfLifeHours);
  const p = Math.pow(2, -deltaHours / hl);
  return Math.max(0.05, Math.min(1, p));
}

export interface PracticeSignal {
  conceptId: string;
  questId: string;
  realmId: RealmId;
  completed: boolean;
  /** Number of calm exploratory adjustments before aligning */
  adjustments: number;
  /** Time spent exploring in milliseconds */
  durationMs: number;
  usedOracleNudge: boolean;
  misconceptionTag?: string;
  nowMs?: number;
}

/**
 * Pure HLR memory update.
 * Rewards curiosity and calm fluency; productive exploration gently calibrates half-life
 * without punitive resets or anxiety.
 */
export function recordConceptPractice(
  state: RetentionState,
  signal: PracticeSignal,
): RetentionState {
  const now = signal.nowMs ?? Date.now();
  const prev = state.concepts[signal.conceptId];

  // Fluidity score: 1.0 for smooth alignment, gently lower when many exploratory adjustments were needed
  const adjustmentPenalty = Math.min(0.45, Math.max(0, signal.adjustments - 2) * 0.08);
  const nudgePenalty = signal.usedOracleNudge ? 0.12 : 0;
  const sessionFluidity = Math.max(0.25, Math.min(1, 1 - adjustmentPenalty - nudgePenalty));

  const prevHalfLife = prev?.halfLifeHours ?? 6; // start at 6 hours for fresh encoding
  const prevRecall = prev ? computeRecallProbability(prev, now) : 0.6;

  // HLR multiplicative half-life update (inspired by Settles & Meeder 2016)
  // Spacing bonus: practicing when recall has gently dipped (0.4..0.8) strengthens memory more!
  const spacingBonus = prev && prevRecall < 0.85 ? 0.35 : 0.1;
  let nextHalfLife = prevHalfLife;

  if (signal.completed) {
    const exponent = 0.55 + sessionFluidity * 0.65 + spacingBonus;
    nextHalfLife = Math.min(720, Math.max(4, prevHalfLife * Math.pow(2, exponent * 0.55)));
  } else {
    // Productive failure still encodes curiosity trace — gently shorten half-life for earlier ambient weaving
    nextHalfLife = Math.max(1.5, prevHalfLife * 0.78);
  }

  const misconceptions = new Set(prev?.misconceptions ?? []);
  if (!signal.completed && signal.misconceptionTag) {
    misconceptions.add(signal.misconceptionTag);
  } else if (signal.completed && signal.misconceptionTag && sessionFluidity >= 0.75) {
    misconceptions.delete(signal.misconceptionTag);
  }

  const updatedMemory: ConceptMemory = {
    conceptId: signal.conceptId,
    realmId: signal.realmId,
    questId: signal.questId,
    halfLifeHours: Number(nextHalfLife.toFixed(2)),
    lastPracticedAt: now,
    attempts: (prev?.attempts ?? 0) + 1,
    fluentSolves: (prev?.fluentSolves ?? 0) + (signal.completed && sessionFluidity >= 0.7 ? 1 : 0),
    fluidity: prev ? Number((prev.fluidity * 0.6 + sessionFluidity * 0.4).toFixed(3)) : Number(sessionFluidity.toFixed(3)),
    misconceptions: Array.from(misconceptions),
    completed: Boolean(prev?.completed || signal.completed),
  };

  const completedQuestIds =
    signal.completed && !state.completedQuestIds.includes(signal.questId)
      ? [...state.completedQuestIds, signal.questId]
      : state.completedQuestIds;

  return {
    ...state,
    concepts: {
      ...state.concepts,
      [signal.conceptId]: updatedMemory,
    },
    completedQuestIds,
  };
}

/**
 * Silent ambient weaving: selects the single practiced concept closest to its forgetting threshold
 * (recallProbability < threshold) so the world map can offer a gentle atmospheric sea current
 * instead of a nagging "Time to review!" alert.
 */
export function pickAmbientCurrent(
  state: RetentionState,
  nowMs: number = Date.now(),
  threshold = 0.78,
): AmbientCurrentEvent | null {
  const candidates = Object.values(state.concepts)
    .filter((c) => c.attempts > 0)
    .map((c) => ({
      memory: c,
      recall: computeRecallProbability(c, nowMs),
    }))
    .filter((item) => item.recall < threshold || item.memory.misconceptions.length > 0)
    .sort((a, b) => a.recall - b.recall);

  if (candidates.length === 0) return null;
  const pick = candidates[0];
  return {
    conceptId: pick.memory.conceptId,
    questId: pick.memory.questId,
    realmId: pick.memory.realmId,
    recallProbability: Number(pick.recall.toFixed(2)),
    whisperText:
      pick.memory.misconceptions.length > 0
        ? `A gentle cross-current stirs near Realm ${pick.memory.realmId} — revisit its balance for a smooth tailwind.`
        : `A familiar tide rises near Realm ${pick.memory.realmId} — ride it briefly to deepen your compass memory.`,
  };
}

/** Compute calm mastery strength (0..1) per Realm for subtle visual lantern brightness on the map. */
export function realmMasteryRatio(state: RetentionState, realmId: RealmId): number {
  const doneInRealm = state.completedQuestIds.filter((id) => id.startsWith(`R${realmId}-`)).length;
  return Math.min(1, doneInRealm / 6);
}

/** Determine whether a realm is naturally unlocked (Realm 1 always open; Explorer Mode opens all 6). */
export function isRealmUnlocked(state: RetentionState, realmId: RealmId): boolean {
  if (state.explorerMode || realmId === 1) return true;
  // Unlock next realm once player has completed at least 2 quests (or Stage 6) of the previous realm
  const prevPrefix = `R${realmId - 1}-`;
  const prevCompleted = state.completedQuestIds.filter((id) => id.startsWith(prevPrefix));
  return prevCompleted.length >= 2 || prevCompleted.includes(`R${realmId - 1}-S6`);
}

/** Determine whether a specific quest is unlocked inside its realm. */
export function isQuestUnlocked(state: RetentionState, realmId: RealmId, stage: number): boolean {
  if (state.explorerMode) return true;
  if (!isRealmUnlocked(state, realmId)) return false;
  if (stage === 1) return true;
  return state.completedQuestIds.includes(`R${realmId}-S${stage - 1}`);
}

/** Resolve 'auto' circadian mode based on local hour (Evening Dusk from 19:00 to 06:59). */
export function resolveEffectiveTheme(mode: CircadianMode, hour: number = new Date().getHours()): 'daylight' | 'dusk' {
  if (mode === 'daylight' || mode === 'dusk') return mode;
  return hour >= 19 || hour < 7 ? 'dusk' : 'daylight';
}

export const MOTIVATION_ARCHETYPES: {
  id: MotivationArchetype;
  name: string;
  tagline: string;
  rewardStyle: string;
}[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    tagline: 'Drawn to hidden patterns, secret mechanics, and seeing how things work underneath.',
    rewardStyle: 'Unlocks deeper visual layers and hidden geometric symmetries.',
  },
  {
    id: 'achiever',
    name: 'Achiever',
    tagline: 'Loves crisp precision, steady spiral progress, and mastering all 36 harbor trials.',
    rewardStyle: 'Highlights mastery milestones and precision alignment feedback.',
  },
  {
    id: 'socializer',
    name: 'Socializer',
    tagline: 'Energized by companions, shared intuitions, and trading strategies in the Study Hub.',
    rewardStyle: 'Spotlights companion dialogue and peer teach-back prompts.',
  },
  {
    id: 'free-spirit',
    name: 'Free Spirit',
    tagline: 'Prefers open-ended experimentation, creative curves, and self-paced discovery.',
    rewardStyle: 'Emphasizes sandbox freedom and creative shaping.',
  },
  {
    id: 'philanthropist',
    name: 'Philanthropist',
    tagline: 'Motivated by purpose — guiding ships, restoring beacons, and helping others understand.',
    rewardStyle: 'Frames every trial around helping island communities and apprentices.',
  },
];

export const TEEN_INTEREST_OPTIONS = [
  'Gaming & Physics',
  'Music & Audio Production',
  'Basketball & Sports',
  'Video Editing & Creators',
  'Skateboarding & Action',
  'Space & Robotics',
  'Photography & Cinema',
  'Coding & Game Dev',
  'Architecture & Design',
  'Nature & Ocean Sailing',
];
