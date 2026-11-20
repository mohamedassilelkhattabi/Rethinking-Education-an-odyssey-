import { CHAPTERS, TOTAL_CHAPTERS } from '../data/chapters';
import { clearAttempt, createInitialState, frontierChapter, isChapterUnlocked } from './reducer';
import { MAX_CHAPTER_XP, QUESTIONS_PER_CHAPTER } from './scoring';
import type { ChapterRecord, GameState, Outcome, QuestionResult, Resources, ScreenId } from './types';

export const SAVE_KEY = 'odyssey-path-to-ithaca/save/v1';
export const SETTINGS_KEY = 'odyssey-path-to-ithaca/settings/v1';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

const SCREENS: ScreenId[] = [
  'title', 'howToPlay', 'intro', 'map', 'chapterIntro', 'challenge', 'correct',
  'failure', 'chapterComplete', 'victory', 'review', 'demo',
];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
const isAmount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e9;

function readResources(v: unknown): Resources | null {
  if (!isObj(v) || !isAmount(v.crew) || !isAmount(v.supplies) || !isAmount(v.elapsedTime)) return null;
  return { crew: v.crew, supplies: v.supplies, elapsedTime: v.elapsedTime };
}

function readOutcome(v: unknown): Outcome | null {
  if (!isObj(v)) return null;
  const e = v.evaluation;
  if (
    !isCount(v.questionId) || !isCount(v.chapterId) || !isCount(v.questionIndex, 2) || typeof v.correct !== 'boolean' ||
    !isObj(e) || typeof e.reason !== 'string' || typeof e.headline !== 'string' || !Array.isArray(e.breakdown) ||
    !isCount(v.xpEarned, 100) || typeof v.chapterCompleted !== 'boolean' || !isCount(v.chapterXPAwarded, MAX_CHAPTER_XP) ||
    !isCount(v.temporaryXPLost, MAX_CHAPTER_XP) || !isCount(v.attemptNumber) || !isCount(v.streakBefore, 3)
  ) {
    return null;
  }
  return v as unknown as Outcome;
}

/**
 * Validate and repair a parsed save. Returns null when the data is unusable.
 * Repairs keep permanent progress whenever possible and always produce a legal state.
 */
export function sanitizeState(raw: unknown): GameState | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  const init = createInitialState();

  const resources = readResources(raw);
  const startResources = readResources(raw.chapterStartResources);
  if (!resources || !startResources) return null;
  if (!SCREENS.includes(raw.screen as ScreenId)) return null;

  // Completed chapters must be a contiguous prefix 1..k (chapters unlock sequentially).
  const rawCompleted = Array.isArray(raw.completedChapters) ? raw.completedChapters : [];
  const completedSet = new Set(rawCompleted.filter((c) => isCount(c) && c >= 1 && c <= TOTAL_CHAPTERS) as number[]);
  const completedChapters: number[] = [];
  for (const c of CHAPTERS) {
    if (completedSet.has(c.id)) completedChapters.push(c.id);
    else break;
  }

  const recordsRaw = isObj(raw.chapterRecords) ? raw.chapterRecords : {};
  const chapterRecords: Record<number, ChapterRecord> = {};
  for (const id of completedChapters) {
    const r = recordsRaw[id];
    chapterRecords[id] =
      isObj(r) && isCount(r.xp, MAX_CHAPTER_XP) && r.xp % 50 === 0 && isCount(r.hintsUsed, 3) && isCount(r.attemptsToComplete) && r.attemptsToComplete >= 1
        ? { xp: r.xp, hintsUsed: r.hintsUsed, attemptsToComplete: r.attemptsToComplete }
        : { xp: 0, hintsUsed: 0, attemptsToComplete: 1 };
  }
  const permanentXP = Object.values(chapterRecords).reduce((s, r) => s + r.xp, 0);

  const attemptsRaw = isObj(raw.chapterAttempts) ? raw.chapterAttempts : {};
  const chapterAttempts: Record<number, number> = {};
  for (const c of CHAPTERS) if (isCount(attemptsRaw[c.id]) && (attemptsRaw[c.id] as number) > 0) chapterAttempts[c.id] = attemptsRaw[c.id] as number;
  for (const id of completedChapters) chapterAttempts[id] = Math.max(chapterAttempts[id] ?? 1, chapterRecords[id].attemptsToComplete);

  const frontier = frontierChapter(completedChapters);
  let currentChapter = isCount(raw.currentChapter) ? raw.currentChapter : 1;
  if (!isChapterUnlocked({ completedChapters }, currentChapter)) currentChapter = Math.min(frontier, TOTAL_CHAPTERS);

  const chapter = CHAPTERS.find((c) => c.id === currentChapter)!;
  const currentStreak = isCount(raw.currentStreak, QUESTIONS_PER_CHAPTER) ? raw.currentStreak : 0;
  const currentQuestion = isCount(raw.currentQuestion, QUESTIONS_PER_CHAPTER - 1) ? raw.currentQuestion : 0;

  const resultsRaw = Array.isArray(raw.attemptResults) ? raw.attemptResults : [];
  const attemptResults: QuestionResult[] = resultsRaw.filter(
    (r, i): r is QuestionResult =>
      isObj(r) && r.questionId === chapter.questionIds[i] && isCount(r.xp, 100) && typeof r.usedHint === 'boolean',
  );

  const hintsRaw = isObj(raw.hintsUsed) ? raw.hintsUsed : {};
  const hintsUsed: Record<number, boolean> = {};
  for (const qid of chapter.questionIds) if (hintsRaw[qid] === true) hintsUsed[qid] = true;

  const ship = isObj(raw.pendingShipMove) && isCount(raw.pendingShipMove.from, 5) && isCount(raw.pendingShipMove.to, 5)
    ? { from: raw.pendingShipMove.from, to: raw.pendingShipMove.to }
    : null;

  const lastOutcome = readOutcome(raw.lastOutcome);
  // Once a chapter is committed its XP is permanent, so temporary XP is zero on the completion screens.
  const committed = (raw.screen === 'correct' || raw.screen === 'chapterComplete') && lastOutcome?.chapterCompleted === true;

  let state: GameState = {
    ...init,
    ...resources,
    screen: raw.screen as ScreenId,
    previousScreen: SCREENS.includes(raw.previousScreen as ScreenId) ? (raw.previousScreen as ScreenId) : 'title',
    currentChapter,
    currentQuestion,
    completedChapters,
    currentStreak,
    chapterAttempts,
    permanentXP,
    temporaryXP: committed ? 0 : attemptResults.reduce((s, r) => s + r.xp, 0),
    chapterStartResources: startResources,
    hintsUsed,
    totalHintsUsed: isCount(raw.totalHintsUsed) ? raw.totalHintsUsed : 0,
    totalFailures: isCount(raw.totalFailures) ? raw.totalFailures : 0,
    completedQuestionIds: CHAPTERS.filter((c) => completedChapters.includes(c.id)).flatMap((c) => c.questionIds),
    attemptResults,
    chapterRecords,
    lastOutcome,
    pendingShipMove: ship,
    isReplay: completedChapters.includes(currentChapter) && raw.isReplay === true,
    introSeen: raw.introSeen === true,
  };

  // ── Screen-level consistency ──
  const o = state.lastOutcome;
  const toMap = () => ({ ...clearAttempt(state, 'map'), currentChapter: Math.min(frontier, TOTAL_CHAPTERS) });
  const replayOk = state.isReplay === completedChapters.includes(currentChapter);

  switch (state.screen) {
    case 'demo':
      state = { ...clearAttempt(state, 'title') };
      break;
    case 'challenge':
      if (!replayOk || currentStreak !== currentQuestion || currentStreak >= 3 || attemptResults.length !== currentStreak) state = toMap();
      break;
    case 'correct': {
      const legal =
        o && o.correct && o.chapterId === currentChapter &&
        (o.chapterCompleted
          ? currentStreak === 3 && (o.replay || completedChapters.includes(currentChapter))
          : replayOk && currentStreak === currentQuestion + 1 && attemptResults.length === currentStreak);
      if (!legal) state = toMap();
      break;
    }
    case 'failure':
      if (!o || o.correct || o.chapterId !== currentChapter) state = toMap();
      else state = { ...state, ...startResources, currentStreak: 0, temporaryXP: 0, attemptResults: [] };
      break;
    case 'chapterComplete':
      if (!o || !o.chapterCompleted || (!o.replay && !completedChapters.includes(o.chapterId))) state = toMap();
      break;
    case 'victory':
      if (completedChapters.length !== TOTAL_CHAPTERS) state = toMap();
      break;
    default:
      // Outside an attempt there must be no dangling temporary progress.
      if (state.currentStreak !== 0 || state.temporaryXP !== 0 || state.attemptResults.length) {
        state = clearAttempt(state, state.screen);
      }
  }
  return state;
}

export function saveGame(state: GameState, storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(storage: StorageLike | null = defaultStorage()): GameState | null {
  if (!storage) return null;
  try {
    const text = storage.getItem(SAVE_KEY);
    if (!text) return null;
    return sanitizeState(JSON.parse(text));
  } catch {
    return null;
  }
}

export function clearSave(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/** True when a save exists with meaningful progress. */
export function hasProgress(state: GameState): boolean {
  return state.introSeen || state.completedChapters.length > 0 || Object.keys(state.chapterAttempts).length > 0;
}

export interface Settings {
  muted: boolean;
}

export function loadSettings(storage: StorageLike | null = defaultStorage()): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { muted: isObj(parsed) && parsed.muted === true };
  } catch {
    return { muted: false };
  }
}

export function saveSettings(settings: Settings, storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
