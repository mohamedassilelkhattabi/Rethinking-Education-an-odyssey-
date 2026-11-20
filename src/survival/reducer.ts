import { CHAPTERS, getChapter } from '../data/chapters';
import { getQuestion } from '../data/questions';
import { evaluateAnswer } from '../game/optimization';
import { questionXP } from '../game/scoring';
import {
  ENVIRONMENT_DAMAGE,
  HUNGER_DRAIN_INTERVAL_MS,
  ITEM_ORDER,
  ITEMS,
  MAX_STAT,
  PENALTIES,
  PICKUP_RESPAWN_MS,
  STARTING_INVENTORY,
  STARVATION_DAMAGE,
  STARVATION_INTERVAL_MS,
} from './items';
import type { ChallengeResult, RunSummary, SurvivalAction, SurvivalState } from './types';

export const TOTAL_CHAPTERS = CHAPTERS.length;
const MAX_ITEM_STACK = 99;

const clamp = (v: number) => Math.max(0, Math.min(MAX_STAT, v));

function makeRunId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createRun(runId: string = makeRunId()): SurvivalState {
  return {
    version: 1,
    runId,
    status: 'playing',
    currentChapter: 1,
    completedChapters: [],
    currentStreak: 0,
    answered: [],
    health: MAX_STAT,
    maxHealth: MAX_STAT,
    hunger: MAX_STAT,
    maxHunger: MAX_STAT,
    xp: 0,
    temporaryXP: 0,
    inventory: { ...STARTING_INVENTORY },
    selectedItem: 'apple',
    hintsUsed: {},
    chapterAttempts: { 1: 1 },
    chapterXP: {},
    totalIncorrectAnswers: 0,
    totalHintsUsed: 0,
    questionsSolved: 0,
    foodConsumed: 0,
    timeSurvivedMs: 0,
    hungerTimerMs: 0,
    starvationTimerMs: 0,
    pickedUp: {},
    respawnToken: 0,
    activeChallenge: null,
    challengeNonce: 0,
    introsSeen: [],
    lastResult: null,
    summary: null,
    notice: null,
  };
}

// ── Selectors ────────────────────────────────────────────────

export function chapterQuestionIds(chapterId: number): number[] {
  return [...getChapter(chapterId).questionIds];
}

export type NpcStatus = 'done' | 'next' | 'locked' | 'elsewhere';

export function npcStatus(state: SurvivalState, questionId: number): NpcStatus {
  const q = getQuestion(questionId);
  if (q.chapterId !== state.currentChapter) return 'elsewhere';
  if (state.completedChapters.includes(q.chapterId) || state.answered.includes(questionId)) return 'done';
  return chapterQuestionIds(q.chapterId).indexOf(questionId) === state.currentStreak ? 'next' : 'locked';
}

export function isExitUnlocked(state: SurvivalState): boolean {
  return state.completedChapters.includes(state.currentChapter);
}

export function isPickupAvailable(state: SurvivalState, pickupId: string, renewable: boolean): boolean {
  const at = state.pickedUp[pickupId];
  if (at === undefined) return true;
  if (!renewable) return false;
  return state.timeSurvivedMs - at >= PICKUP_RESPAWN_MS;
}

export function isStarving(state: SurvivalState): boolean {
  return state.status === 'playing' && state.hunger <= 0;
}

// ── Helpers ──────────────────────────────────────────────────

function notice(state: SurvivalState, text: string, tone: 'info' | 'good' | 'bad' = 'info'): SurvivalState {
  return { ...state, notice: { id: (state.notice?.id ?? 0) + 1, text, tone } };
}

function summarize(state: SurvivalState, cause: RunSummary['cause']): RunSummary {
  return {
    chapterReached: state.currentChapter,
    questionsSolved: state.questionsSolved,
    incorrectAnswers: state.totalIncorrectAnswers,
    xp: state.xp,
    timeSurvivedMs: state.timeSurvivedMs,
    foodConsumed: state.foodConsumed,
    cause,
  };
}

/** Health reached zero: the run ends. Saves are cleared by the persistence layer. */
function die(state: SurvivalState, cause: RunSummary['cause']): SurvivalState {
  return { ...state, status: 'dead', health: 0, activeChallenge: null, summary: summarize({ ...state, health: 0 }, cause) };
}

/** Start a fresh attempt at a chapter's three-question sequence. */
function resetChapterAttempt(): Partial<SurvivalState> {
  return { currentStreak: 0, answered: [], temporaryXP: 0, hintsUsed: {}, activeChallenge: null };
}

// ── Reducer ──────────────────────────────────────────────────

export function survivalReducer(state: SurvivalState, action: SurvivalAction): SurvivalState {
  if (action.type === 'NEW_RUN') return createRun(action.runId);
  if (state.status !== 'playing' && action.type !== 'NOTICE') return state;

  switch (action.type) {
    case 'TICK': {
      const ms = Math.max(0, Math.min(action.ms, 5_000));
      if (ms === 0) return state;
      let { hunger, health, hungerTimerMs, starvationTimerMs } = state;
      if (hunger > 0) {
        hungerTimerMs += ms;
        while (hungerTimerMs >= HUNGER_DRAIN_INTERVAL_MS && hunger > 0) {
          hungerTimerMs -= HUNGER_DRAIN_INTERVAL_MS;
          hunger -= 1;
        }
        if (hunger === 0) {
          starvationTimerMs += hungerTimerMs;
          hungerTimerMs = 0;
        }
      } else {
        starvationTimerMs += ms;
      }
      if (hunger === 0) {
        while (starvationTimerMs >= STARVATION_INTERVAL_MS && health > 0) {
          starvationTimerMs -= STARVATION_INTERVAL_MS;
          health = Math.max(0, health - STARVATION_DAMAGE);
        }
      } else {
        starvationTimerMs = 0;
      }
      const next = { ...state, hunger, health, hungerTimerMs, starvationTimerMs, timeSurvivedMs: state.timeSurvivedMs + ms };
      return health <= 0 ? die(next, 'starvation') : next;
    }

    case 'PICKUP': {
      if (!isPickupAvailable(state, action.pickupId, action.renewable)) return state;
      if (state.inventory[action.item] >= MAX_ITEM_STACK) return notice(state, 'Your pack is full.', 'bad');
      const next: SurvivalState = {
        ...state,
        inventory: { ...state.inventory, [action.item]: state.inventory[action.item] + 1 },
        pickedUp: { ...state.pickedUp, [action.pickupId]: state.timeSurvivedMs },
      };
      return notice(next, `+1 ${ITEMS[action.item].name}`, 'good');
    }

    case 'SELECT_ITEM':
      return state.selectedItem === action.item ? state : { ...state, selectedItem: action.item };

    case 'CYCLE_ITEM': {
      const i = ITEM_ORDER.indexOf(state.selectedItem);
      return { ...state, selectedItem: ITEM_ORDER[(i + action.dir + ITEM_ORDER.length) % ITEM_ORDER.length] };
    }

    case 'CONSUME': {
      const item = action.item ?? state.selectedItem;
      const def = ITEMS[item];
      if (state.inventory[item] <= 0) return notice(state, `You have no ${def.name.toLowerCase()} left.`, 'bad');
      if (def.hunger > 0 && state.hunger >= MAX_STAT) return notice(state, 'You are not hungry.', 'info');
      if (def.health > 0 && state.health >= MAX_STAT) return notice(state, 'You are already at full health.', 'info');
      const hunger = clamp(state.hunger + def.hunger);
      const health = clamp(state.health + def.health);
      const next: SurvivalState = {
        ...state,
        hunger,
        health,
        inventory: { ...state.inventory, [item]: state.inventory[item] - 1 },
        foodConsumed: state.foodConsumed + 1,
        starvationTimerMs: hunger > 0 ? 0 : state.starvationTimerMs,
      };
      const gain = def.hunger > 0 ? `+${hunger - state.hunger} hunger` : `+${health - state.health} health`;
      return notice(next, `${def.name}: ${gain}`, 'good');
    }

    case 'OPEN_CHALLENGE': {
      if (npcStatus(state, action.questionId) !== 'next') return state;
      const token = state.challengeNonce + 1;
      return { ...state, challengeNonce: token, activeChallenge: { questionId: action.questionId, token }, lastResult: null };
    }

    case 'CLOSE_CHALLENGE':
      return state.activeChallenge ? { ...state, activeChallenge: null } : state;

    case 'USE_HINT': {
      if (state.activeChallenge?.questionId !== action.questionId || state.hintsUsed[action.questionId]) return state;
      return { ...state, hintsUsed: { ...state.hintsUsed, [action.questionId]: true }, totalHintsUsed: state.totalHintsUsed + 1 };
    }

    case 'SUBMIT': {
      // Atomic resolution: only the open challenge, only once, only in sequence.
      const open = state.activeChallenge;
      if (!open || open.questionId !== action.questionId || open.token !== action.token) return state;
      if (npcStatus(state, action.questionId) !== 'next') return { ...state, activeChallenge: null };

      const chapterId = state.currentChapter;
      const evaluation = evaluateAnswer(getQuestion(action.questionId), action.answer);
      const usedHint = !!state.hintsUsed[action.questionId];
      const base = { ...state, activeChallenge: null };

      if (!evaluation.correct) {
        const penalty = PENALTIES[chapterId] ?? 10;
        const health = clamp(state.health - penalty);
        const hunger = clamp(state.hunger - penalty);
        const result: ChallengeResult = {
          questionId: action.questionId,
          chapterId,
          correct: false,
          evaluation,
          xpEarned: 0,
          usedHint,
          healthLost: state.health - health,
          hungerLost: state.hunger - hunger,
          streakAfter: 0,
          chapterCompleted: false,
          chapterXP: 0,
          died: health <= 0,
        };
        const next: SurvivalState = {
          ...base,
          ...resetChapterAttempt(),
          health,
          hunger,
          hungerTimerMs: hunger === 0 ? 0 : state.hungerTimerMs,
          starvationTimerMs: hunger === 0 ? state.starvationTimerMs : 0,
          totalIncorrectAnswers: state.totalIncorrectAnswers + 1,
          chapterAttempts: { ...state.chapterAttempts, [chapterId]: (state.chapterAttempts[chapterId] ?? 1) + 1 },
          respawnToken: state.respawnToken + 1,
          lastResult: result,
        };
        return result.died ? die(next, 'answer') : next;
      }

      const xpEarned = questionXP(usedHint);
      const answered = [...state.answered, action.questionId];
      const streak = answered.length;
      const temporaryXP = state.temporaryXP + xpEarned;
      const chapterCompleted = streak >= 3;
      const result: ChallengeResult = {
        questionId: action.questionId,
        chapterId,
        correct: true,
        evaluation,
        xpEarned,
        usedHint,
        healthLost: 0,
        hungerLost: 0,
        streakAfter: streak,
        chapterCompleted,
        chapterXP: chapterCompleted ? temporaryXP : 0,
        died: false,
      };
      let next: SurvivalState = {
        ...base,
        answered,
        currentStreak: streak,
        temporaryXP,
        questionsSolved: state.questionsSolved + 1,
        lastResult: result,
      };
      if (chapterCompleted) {
        next = {
          ...next,
          completedChapters: [...new Set([...state.completedChapters, chapterId])].sort((a, b) => a - b),
          xp: state.xp + temporaryXP,
          chapterXP: { ...state.chapterXP, [chapterId]: temporaryXP },
          temporaryXP: 0,
        };
        if (chapterId === TOTAL_CHAPTERS) next = { ...next, status: 'victory', summary: summarize(next, 'answer') };
      }
      return next;
    }

    case 'ENVIRONMENT_DAMAGE': {
      const amount = Math.max(0, Math.round(action.amount || ENVIRONMENT_DAMAGE));
      const health = clamp(state.health - amount);
      const next = notice({ ...state, health }, `${action.reason} (-${state.health - health} HP)`, 'bad');
      return health <= 0 ? die(next, 'environment') : next;
    }

    case 'ENTER_CHAPTER': {
      const target = action.chapterId;
      if (target !== state.currentChapter + 1 || target > TOTAL_CHAPTERS || !isExitUnlocked(state)) {
        return notice(state, 'The way is sealed. Solve all three challenges in a row first.', 'bad');
      }
      return {
        ...state,
        ...resetChapterAttempt(),
        currentChapter: target,
        chapterAttempts: { ...state.chapterAttempts, [target]: (state.chapterAttempts[target] ?? 0) + 1 },
        respawnToken: state.respawnToken + 1,
        lastResult: null,
      };
    }

    case 'SEE_INTRO':
      return state.introsSeen.includes(action.chapterId) ? state : { ...state, introsSeen: [...state.introsSeen, action.chapterId] };

    case 'NOTICE':
      return notice(state, action.text, action.tone);

    // ── Demo-only presenter tools ──
    case 'DEMO_JUMP_CHAPTER': {
      const id = Math.max(1, Math.min(TOTAL_CHAPTERS, action.chapterId));
      const completed = CHAPTERS.filter((c) => c.id < id).map((c) => c.id);
      const chapterXP = Object.fromEntries(completed.map((c) => [c, 300]));
      return {
        ...state,
        ...resetChapterAttempt(),
        currentChapter: id,
        completedChapters: completed,
        chapterXP,
        xp: completed.length * 300,
        chapterAttempts: { ...state.chapterAttempts, [id]: (state.chapterAttempts[id] ?? 0) + 1 },
        respawnToken: state.respawnToken + 1,
      };
    }
    case 'DEMO_REFILL':
      return notice(
        { ...state, health: MAX_STAT, hunger: MAX_STAT, inventory: { apple: 3, fish: 2, bread: 2, ambrosia: 1 } },
        'Presenter: stats and pack refilled.',
        'good',
      );
    case 'DEMO_KILL':
      return die({ ...state, health: 0 }, 'demo');
    case 'DEMO_WIN': {
      const all = CHAPTERS.map((c) => c.id);
      const won: SurvivalState = {
        ...state,
        ...resetChapterAttempt(),
        completedChapters: all,
        chapterXP: Object.fromEntries(all.map((c) => [c, 300])),
        xp: all.length * 300,
        currentChapter: TOTAL_CHAPTERS,
        status: 'victory',
      };
      return { ...won, summary: summarize(won, 'demo') };
    }
  }
  return state;
}
