import { CHAPTERS } from '../data/chapters';
import { ITEM_ORDER, MAX_STAT } from './items';
import { chapterQuestionIds, createRun, TOTAL_CHAPTERS } from './reducer';
import type { ItemId, RunSummary, SurvivalState } from './types';

export const SURVIVAL_SAVE_KEY = 'odyssey-survival/run/v1';
export const SURVIVAL_RECORD_KEY = 'odyssey-survival/records/v1';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function browserStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/**
 * Validate and repair a parsed save. Returns null when unusable.
 * Only living runs are restorable — a dead or finished run never comes back.
 */
export function sanitizeRun(raw: unknown): SurvivalState | null {
  if (!isObj(raw) || raw.version !== 1 || raw.status !== 'playing' || typeof raw.runId !== 'string') return null;
  if (!isNum(raw.health) || !isNum(raw.hunger) || raw.health <= 0) return null;
  const base = createRun(raw.runId);

  // Chapters unlock in order: completed must be a prefix 1..k.
  const rawDone = Array.isArray(raw.completedChapters) ? raw.completedChapters : [];
  const completed: number[] = [];
  for (const c of CHAPTERS) {
    if (rawDone.includes(c.id) && c.id < TOTAL_CHAPTERS) completed.push(c.id);
    else break;
  }
  const maxChapter = Math.min(TOTAL_CHAPTERS, completed.length + 1);
  let currentChapter = isInt(raw.currentChapter) ? raw.currentChapter : 1;
  if (currentChapter < 1 || currentChapter > maxChapter) currentChapter = maxChapter;
  // A completed chapter may only be "current" while its exit has not been taken yet.
  const chapterDone = completed.includes(currentChapter);

  const qids = chapterQuestionIds(currentChapter);
  const rawAnswered = Array.isArray(raw.answered) ? raw.answered : [];
  let answered = chapterDone ? qids : qids.slice(0, rawAnswered.length).filter((q, i) => rawAnswered[i] === q);
  if (!chapterDone && answered.length >= 3) answered = [];

  const rawHints = isObj(raw.hintsUsed) ? raw.hintsUsed : {};
  const hintsUsed: Record<number, boolean> = {};
  for (const q of qids) if (rawHints[q] === true) hintsUsed[q] = true;

  const rawXP = isObj(raw.chapterXP) ? raw.chapterXP : {};
  const chapterXP: Record<number, number> = {};
  for (const c of completed) chapterXP[c] = isInt(rawXP[c], 300) && rawXP[c] % 50 === 0 ? (rawXP[c] as number) : 0;

  const rawInv = isObj(raw.inventory) ? raw.inventory : {};
  const inventory = { ...base.inventory };
  for (const id of ITEM_ORDER) inventory[id] = isInt(rawInv[id], 99) ? (rawInv[id] as number) : 0;

  const rawPicked = isObj(raw.pickedUp) ? raw.pickedUp : {};
  const pickedUp: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawPicked)) if (isNum(v)) pickedUp[k] = v;

  const rawAttempts = isObj(raw.chapterAttempts) ? raw.chapterAttempts : {};
  const chapterAttempts: Record<number, number> = {};
  for (const c of CHAPTERS) if (isInt(rawAttempts[c.id]) && (rawAttempts[c.id] as number) > 0) chapterAttempts[c.id] = rawAttempts[c.id] as number;
  chapterAttempts[currentChapter] ??= 1;

  const count = (v: unknown) => (isInt(v) ? v : 0);
  const time = isNum(raw.timeSurvivedMs) ? raw.timeSurvivedMs : 0;

  return {
    ...base,
    currentChapter,
    completedChapters: completed,
    answered,
    currentStreak: answered.length,
    health: Math.min(MAX_STAT, raw.health),
    hunger: Math.min(MAX_STAT, raw.hunger),
    xp: Object.values(chapterXP).reduce((s, x) => s + x, 0),
    temporaryXP: chapterDone ? 0 : answered.reduce((s, q) => s + (hintsUsed[q] ? 50 : 100), 0),
    inventory,
    selectedItem: ITEM_ORDER.includes(raw.selectedItem as ItemId) ? (raw.selectedItem as ItemId) : 'apple',
    hintsUsed,
    chapterAttempts,
    chapterXP,
    totalIncorrectAnswers: count(raw.totalIncorrectAnswers),
    totalHintsUsed: count(raw.totalHintsUsed),
    questionsSolved: count(raw.questionsSolved),
    foodConsumed: count(raw.foodConsumed),
    timeSurvivedMs: time,
    hungerTimerMs: isNum(raw.hungerTimerMs) ? Math.min(raw.hungerTimerMs, 15_000) : 0,
    starvationTimerMs: isNum(raw.starvationTimerMs) ? Math.min(raw.starvationTimerMs, 5_000) : 0,
    pickedUp,
    respawnToken: count(raw.respawnToken),
    challengeNonce: count(raw.challengeNonce),
    introsSeen: Array.isArray(raw.introsSeen) ? raw.introsSeen.filter((c): c is number => isInt(c, TOTAL_CHAPTERS)) : [],
    // Transient fields never survive a reload.
    activeChallenge: null,
    lastResult: null,
    notice: null,
    summary: null,
  };
}

export function saveRun(state: SurvivalState, storage: StorageLike | null = browserStorage()): void {
  if (!storage) return;
  try {
    if (state.status === 'playing') {
      storage.setItem(SURVIVAL_SAVE_KEY, JSON.stringify({ ...state, lastResult: null, notice: null }));
    } else {
      // Permadeath (and a finished voyage) wipes the campaign save.
      storage.removeItem(SURVIVAL_SAVE_KEY);
      if (state.summary) recordRun(state.status, state.summary, storage);
    }
  } catch {
    /* storage full or blocked — the game keeps running */
  }
}

export function loadRun(storage: StorageLike | null = browserStorage()): SurvivalState | null {
  if (!storage) return null;
  try {
    const text = storage.getItem(SURVIVAL_SAVE_KEY);
    return text ? sanitizeRun(JSON.parse(text)) : null;
  } catch {
    return null;
  }
}

export function clearRun(storage: StorageLike | null = browserStorage()): void {
  try {
    storage?.removeItem(SURVIVAL_SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export interface Records {
  bestXP: number;
  runs: number;
  victories: number;
}

export function loadRecords(storage: StorageLike | null = browserStorage()): Records {
  try {
    const raw = storage?.getItem(SURVIVAL_RECORD_KEY);
    const p = raw ? JSON.parse(raw) : null;
    if (isObj(p)) return { bestXP: isInt(p.bestXP) ? p.bestXP : 0, runs: isInt(p.runs) ? p.runs : 0, victories: isInt(p.victories) ? p.victories : 0 };
  } catch {
    /* ignore */
  }
  return { bestXP: 0, runs: 0, victories: 0 };
}

/** Lifetime statistics only — they never affect progression. */
function recordRun(status: SurvivalState['status'], summary: RunSummary, storage: StorageLike) {
  if (summary.cause === 'demo') return;
  const r = loadRecords(storage);
  storage.setItem(
    SURVIVAL_RECORD_KEY,
    JSON.stringify({ bestXP: Math.max(r.bestXP, summary.xp), runs: r.runs + 1, victories: r.victories + (status === 'victory' ? 1 : 0) }),
  );
}
