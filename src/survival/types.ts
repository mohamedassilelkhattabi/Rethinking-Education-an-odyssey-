import type { Answer, Evaluation } from '../game/types';

export type ItemId = 'apple' | 'fish' | 'bread' | 'ambrosia';

export interface ItemDef {
  id: ItemId;
  name: string;
  hunger: number;
  health: number;
  description: string;
}

export type RunStatus = 'playing' | 'dead' | 'victory';

export interface ChallengeResult {
  questionId: number;
  chapterId: number;
  correct: boolean;
  evaluation: Evaluation;
  xpEarned: number;
  usedHint: boolean;
  healthLost: number;
  hungerLost: number;
  streakAfter: number;
  chapterCompleted: boolean;
  chapterXP: number;
  died: boolean;
}

export interface RunSummary {
  chapterReached: number;
  questionsSolved: number;
  incorrectAnswers: number;
  xp: number;
  timeSurvivedMs: number;
  foodConsumed: number;
  cause: 'answer' | 'starvation' | 'environment' | 'demo';
}

export interface SurvivalState {
  version: 1;
  runId: string;
  status: RunStatus;

  currentChapter: number;
  completedChapters: number[];
  currentStreak: number;
  /** Question ids answered correctly in the current chapter attempt, in order. */
  answered: number[];

  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;

  xp: number;
  temporaryXP: number;

  inventory: Record<ItemId, number>;
  selectedItem: ItemId;

  hintsUsed: Record<number, boolean>;
  chapterAttempts: Record<number, number>;
  chapterXP: Record<number, number>;
  totalIncorrectAnswers: number;
  totalHintsUsed: number;
  questionsSolved: number;
  foodConsumed: number;

  /** Active (unpaused) play time for this run. */
  timeSurvivedMs: number;
  hungerTimerMs: number;
  starvationTimerMs: number;

  /** Pickup id → active time at which it was collected (for respawn cooldowns). */
  pickedUp: Record<string, number>;

  /** Changes whenever the player must be sent back to the chapter's starting checkpoint. */
  respawnToken: number;
  /** The challenge currently open; submissions must carry its token (prevents duplicate resolution). */
  activeChallenge: { questionId: number; token: number } | null;
  challengeNonce: number;

  introsSeen: number[];
  lastResult: ChallengeResult | null;
  summary: RunSummary | null;
  /** Latest player-facing notice (eating, locked exits…); `id` changes so repeats still show. */
  notice: { id: number; text: string; tone: 'info' | 'good' | 'bad' } | null;
}

export type SurvivalAction =
  | { type: 'NEW_RUN'; runId?: string }
  | { type: 'TICK'; ms: number }
  | { type: 'PICKUP'; pickupId: string; item: ItemId; renewable: boolean }
  | { type: 'SELECT_ITEM'; item: ItemId }
  | { type: 'CYCLE_ITEM'; dir: 1 | -1 }
  | { type: 'CONSUME'; item?: ItemId }
  | { type: 'OPEN_CHALLENGE'; questionId: number }
  | { type: 'CLOSE_CHALLENGE' }
  | { type: 'USE_HINT'; questionId: number }
  | { type: 'SUBMIT'; questionId: number; token: number; answer: Answer }
  | { type: 'ENVIRONMENT_DAMAGE'; amount: number; reason: string }
  | { type: 'ENTER_CHAPTER'; chapterId: number }
  | { type: 'SEE_INTRO'; chapterId: number }
  | { type: 'NOTICE'; text: string; tone?: 'info' | 'good' | 'bad' }
  // Demo-mode presenter tools (ignored unless the store is a demo store).
  | { type: 'DEMO_JUMP_CHAPTER'; chapterId: number }
  | { type: 'DEMO_REFILL' }
  | { type: 'DEMO_KILL' }
  | { type: 'DEMO_WIN' };
