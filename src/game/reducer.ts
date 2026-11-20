import { CHAPTERS, TOTAL_CHAPTERS, getChapter } from '../data/chapters';
import { getQuestion } from '../data/questions';
import { evaluateAnswer } from './optimization';
import { QUESTIONS_PER_CHAPTER, questionXP } from './scoring';
import type { Answer, GameState, Outcome, Question, ResourceEffect, Resources, ScreenId } from './types';

export const INITIAL_RESOURCES: Resources = { crew: 12, supplies: 15, elapsedTime: 0 };

export type GameAction =
  | { type: 'NAVIGATE'; screen: 'title' | 'howToPlay' | 'intro' | 'map' | 'review' | 'demo' | 'victory' }
  | { type: 'BACK' }
  | { type: 'NEW_GAME' }
  | { type: 'FINISH_INTRO' }
  | { type: 'OPEN_CHAPTER'; chapterId: number }
  | { type: 'START_CHAPTER' }
  | { type: 'USE_HINT'; questionId: number }
  | { type: 'SUBMIT_ANSWER'; questionId: number; answer: Answer }
  | { type: 'CONTINUE' }
  | { type: 'RETRY_CHAPTER' }
  | { type: 'ABANDON_CHAPTER' }
  | { type: 'FINISH_CHAPTER' }
  | { type: 'SHIP_ARRIVED' }
  | { type: 'PLAY_AGAIN' };

/** Screens that belong to an in-progress chapter attempt; free navigation is blocked from them. */
export const ATTEMPT_SCREENS: ScreenId[] = ['challenge', 'correct', 'chapterComplete'];

export function createInitialState(): GameState {
  return {
    version: 1,
    screen: 'title',
    previousScreen: 'title',
    currentChapter: 1,
    currentQuestion: 0,
    completedChapters: [],
    currentStreak: 0,
    chapterAttempts: {},
    permanentXP: 0,
    temporaryXP: 0,
    ...INITIAL_RESOURCES,
    chapterStartResources: { ...INITIAL_RESOURCES },
    hintsUsed: {},
    totalHintsUsed: 0,
    totalFailures: 0,
    completedQuestionIds: [],
    attemptResults: [],
    chapterRecords: {},
    lastOutcome: null,
    pendingShipMove: null,
    isReplay: false,
    introSeen: false,
  };
}

// ── Selectors ────────────────────────────────────────────────

/** First chapter not yet completed; TOTAL_CHAPTERS + 1 once the voyage is finished. */
export function frontierChapter(completed: number[]): number {
  for (const c of CHAPTERS) if (!completed.includes(c.id)) return c.id;
  return TOTAL_CHAPTERS + 1;
}

export function isChapterUnlocked(state: Pick<GameState, 'completedChapters'>, chapterId: number): boolean {
  return chapterId >= 1 && chapterId <= TOTAL_CHAPTERS && chapterId <= frontierChapter(state.completedChapters);
}

export function currentQuestionOf(state: GameState): Question {
  const chapter = getChapter(state.currentChapter);
  return getQuestion(chapter.questionIds[Math.min(state.currentQuestion, QUESTIONS_PER_CHAPTER - 1)]);
}

export function resourcesOf(state: Resources): Resources {
  return { crew: state.crew, supplies: state.supplies, elapsedTime: state.elapsedTime };
}

export function applyEffect(res: Resources, effect: ResourceEffect): Resources {
  return {
    crew: Math.max(0, res.crew + (effect.crew ?? 0)),
    supplies: Math.max(0, res.supplies + (effect.supplies ?? 0)),
    elapsedTime: Math.max(0, res.elapsedTime + (effect.elapsedTime ?? 0)),
  };
}

export function isVoyageComplete(state: Pick<GameState, 'completedChapters'>): boolean {
  return CHAPTERS.every((c) => state.completedChapters.includes(c.id));
}

// ── Transitions ──────────────────────────────────────────────

/** Discard every temporary effect of the current attempt and restore the chapter-start snapshot. */
export function clearAttempt(state: GameState, screen: ScreenId): GameState {
  return {
    ...state,
    ...state.chapterStartResources,
    screen,
    currentQuestion: 0,
    currentStreak: 0,
    temporaryXP: 0,
    hintsUsed: {},
    attemptResults: [],
    lastOutcome: null,
    isReplay: false,
  };
}

function startAttempt(state: GameState, chapterId: number): GameState {
  return {
    ...clearAttempt(state, 'challenge'),
    currentChapter: chapterId,
    chapterAttempts: { ...state.chapterAttempts, [chapterId]: (state.chapterAttempts[chapterId] ?? 0) + 1 },
    isReplay: state.completedChapters.includes(chapterId),
    pendingShipMove: null,
  };
}

function submitAnswer(state: GameState, questionId: number, answer: Answer): GameState {
  if (state.screen !== 'challenge') return state; // prevents double submissions
  const question = currentQuestionOf(state);
  if (question.id !== questionId) return state;

  const evaluation = evaluateAnswer(question, answer);
  const usedHint = !!state.hintsUsed[question.id];
  const attemptNumber = state.chapterAttempts[state.currentChapter] ?? 1;
  const baseOutcome = {
    questionId: question.id,
    chapterId: state.currentChapter,
    questionIndex: state.currentQuestion,
    evaluation,
    usedHint,
    attemptNumber,
    streakBefore: state.currentStreak,
    replay: state.isReplay,
  };

  // ── Failure: end the attempt immediately ──
  if (!evaluation.correct) {
    const outcome: Outcome = {
      ...baseOutcome,
      correct: false,
      xpEarned: 0,
      temporaryXPLost: state.temporaryXP,
      chapterCompleted: false,
      chapterXPAwarded: 0,
      resourceDelta: {},
    };
    return {
      ...state,
      ...state.chapterStartResources,
      screen: 'failure',
      currentStreak: 0,
      temporaryXP: 0,
      attemptResults: [],
      totalFailures: state.totalFailures + 1,
      lastOutcome: outcome,
    };
  }

  // ── Correct ──
  const xp = state.isReplay ? 0 : questionXP(usedHint);
  const resourceDelta: ResourceEffect =
    question.kind === 'graph' && !state.isReplay && evaluation.playerValue !== null ? { elapsedTime: evaluation.playerValue } : {};
  const streak = state.currentStreak + 1;
  const attemptResults = [...state.attemptResults, { questionId: question.id, xp, usedHint }];
  const temporaryXP = state.temporaryXP + xp;
  let resources = applyEffect(resourcesOf(state), resourceDelta);

  const outcome: Outcome = {
    ...baseOutcome,
    correct: true,
    xpEarned: xp,
    temporaryXPLost: 0,
    chapterCompleted: false,
    chapterXPAwarded: 0,
    resourceDelta,
  };

  let next: GameState = { ...state, screen: 'correct', currentStreak: streak, attemptResults, temporaryXP, ...resources };

  if (streak >= QUESTIONS_PER_CHAPTER) {
    const chapter = getChapter(state.currentChapter);
    outcome.chapterCompleted = true;
    if (state.isReplay) {
      // Practice voyage: nothing is awarded or changed a second time.
      resources = { ...state.chapterStartResources };
    } else {
      resources = applyEffect(resources, chapter.completionEffect);
      outcome.chapterXPAwarded = temporaryXP;
      next = {
        ...next,
        permanentXP: state.permanentXP + temporaryXP,
        completedChapters: [...new Set([...state.completedChapters, chapter.id])].sort((a, b) => a - b),
        completedQuestionIds: [...new Set([...state.completedQuestionIds, ...chapter.questionIds])].sort((a, b) => a - b),
        chapterRecords: {
          ...state.chapterRecords,
          [chapter.id]: { xp: temporaryXP, hintsUsed: attemptResults.filter((r) => r.usedHint).length, attemptsToComplete: attemptNumber },
        },
        pendingShipMove: { from: chapter.id, to: chapter.id + 1 },
      };
    }
    next = { ...next, ...resources, chapterStartResources: { ...resources }, temporaryXP: 0 };
  }

  return { ...next, lastOutcome: outcome };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
    case 'PLAY_AGAIN':
      return { ...createInitialState(), screen: 'intro', previousScreen: 'title' };

    case 'FINISH_INTRO': {
      if (state.screen !== 'intro') return state;
      const firstVoyage = !state.introSeen && state.completedChapters.length === 0;
      return { ...state, screen: 'map', introSeen: true, pendingShipMove: firstVoyage ? { from: 0, to: 1 } : state.pendingShipMove };
    }

    case 'NAVIGATE': {
      if (ATTEMPT_SCREENS.includes(state.screen)) return state;
      if (state.screen === action.screen) return state;
      if (action.screen === 'victory' && !isVoyageComplete(state)) return state;
      const leavingAttempt = state.screen === 'failure' || state.screen === 'chapterIntro';
      const base = leavingAttempt ? clearAttempt(state, action.screen) : state;
      const remember = ['review', 'howToPlay', 'demo'].includes(action.screen);
      const previousScreen = remember ? (leavingAttempt ? 'map' : state.screen) : state.previousScreen;
      return { ...base, screen: action.screen, previousScreen };
    }

    case 'BACK': {
      if (!['review', 'howToPlay', 'demo'].includes(state.screen)) return state;
      let target = state.previousScreen;
      if (ATTEMPT_SCREENS.includes(target) || target === 'failure' || target === 'chapterIntro' || target === state.screen) target = 'title';
      if (target === 'victory' && !isVoyageComplete(state)) target = 'map';
      return { ...state, screen: target };
    }

    case 'OPEN_CHAPTER': {
      if (state.screen !== 'map' && state.screen !== 'victory') return state;
      if (!isChapterUnlocked(state, action.chapterId)) return state;
      return { ...state, screen: 'chapterIntro', currentChapter: action.chapterId, pendingShipMove: null };
    }

    case 'START_CHAPTER':
      if (state.screen !== 'chapterIntro' || !isChapterUnlocked(state, state.currentChapter)) return state;
      return startAttempt(state, state.currentChapter);

    case 'USE_HINT': {
      if (state.screen !== 'challenge') return state;
      const q = currentQuestionOf(state);
      if (q.id !== action.questionId || state.hintsUsed[q.id]) return state;
      return { ...state, hintsUsed: { ...state.hintsUsed, [q.id]: true }, totalHintsUsed: state.totalHintsUsed + 1 };
    }

    case 'SUBMIT_ANSWER':
      return submitAnswer(state, action.questionId, action.answer);

    case 'CONTINUE': {
      if (state.screen !== 'correct' || !state.lastOutcome) return state;
      if (state.lastOutcome.chapterCompleted) return { ...state, screen: 'chapterComplete' };
      return { ...state, screen: 'challenge', currentQuestion: state.currentStreak, lastOutcome: null };
    }

    case 'RETRY_CHAPTER':
      if (state.screen !== 'failure') return state;
      return startAttempt(state, state.currentChapter);

    case 'ABANDON_CHAPTER':
      if (!['challenge', 'chapterIntro', 'failure'].includes(state.screen)) return state;
      return { ...clearAttempt(state, 'map'), currentChapter: Math.min(frontierChapter(state.completedChapters), TOTAL_CHAPTERS) };

    case 'FINISH_CHAPTER': {
      if (state.screen !== 'chapterComplete' || !state.lastOutcome) return state;
      const finishedVoyage =
        !state.lastOutcome.replay && state.lastOutcome.chapterId === TOTAL_CHAPTERS && isVoyageComplete(state);
      return {
        ...clearAttempt(state, finishedVoyage ? 'victory' : 'map'),
        currentChapter: Math.min(frontierChapter(state.completedChapters), TOTAL_CHAPTERS),
      };
    }

    case 'SHIP_ARRIVED':
      return state.pendingShipMove ? { ...state, pendingShipMove: null } : state;

    default:
      return state;
  }
}
