import { beforeEach, describe, expect, it } from 'vitest';
import { getChapter } from '../data/chapters';
import { getQuestion } from '../data/questions';
import { optimalAnswer, suboptimalAnswer } from '../game/optimization';
import { createInitialState, currentQuestionOf, gameReducer, INITIAL_RESOURCES, type GameAction } from '../game/reducer';
import { loadGame, sanitizeState, saveGame, SAVE_KEY } from '../game/storage';
import type { GameState } from '../game/types';

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);

function answer(state: GameState, correct: boolean): GameState {
  const q = currentQuestionOf(state);
  return gameReducer(state, { type: 'SUBMIT_ANSWER', questionId: q.id, answer: correct ? optimalAnswer(q) : suboptimalAnswer(q) });
}

/** Correct answer + continue. */
function solve(state: GameState): GameState {
  return gameReducer(answer(state, true), { type: 'CONTINUE' });
}

function onMap(): GameState {
  return run(createInitialState(), { type: 'NEW_GAME' }, { type: 'FINISH_INTRO' });
}

function enterChapter(state: GameState, chapterId: number): GameState {
  return run(state, { type: 'OPEN_CHAPTER', chapterId }, { type: 'START_CHAPTER' });
}

function completeChapter(state: GameState, chapterId: number): GameState {
  let s = enterChapter(state, chapterId);
  s = solve(solve(solve(s))); // three correct → chapterComplete screen
  return gameReducer(s, { type: 'FINISH_CHAPTER' });
}

describe('three-in-a-row progression', () => {
  let s: GameState;
  beforeEach(() => {
    s = enterChapter(onMap(), 1);
  });

  it('starts chapter I at question 1 with streak 0 and attempt 1', () => {
    expect(s.screen).toBe('challenge');
    expect(s.currentQuestion).toBe(0);
    expect(s.currentStreak).toBe(0);
    expect(s.chapterAttempts[1]).toBe(1);
    expect(currentQuestionOf(s).id).toBe(1);
  });

  it('1. Q1 correct advances to Q2', () => {
    const a = answer(s, true);
    expect(a.screen).toBe('correct');
    expect(a.currentStreak).toBe(1);
    expect(a.temporaryXP).toBe(100);
    const b = gameReducer(a, { type: 'CONTINUE' });
    expect(b.screen).toBe('challenge');
    expect(currentQuestionOf(b).id).toBe(2);
  });

  it('2. Q2 correct advances to Q3', () => {
    const b = solve(solve(s));
    expect(b.currentStreak).toBe(2);
    expect(currentQuestionOf(b).id).toBe(3);
  });

  it('3. Q3 correct completes the chapter', () => {
    const c = answer(solve(solve(s)), true);
    expect(c.lastOutcome?.chapterCompleted).toBe(true);
    expect(c.completedChapters).toEqual([1]);
    expect(c.permanentXP).toBe(300);
    expect(gameReducer(c, { type: 'CONTINUE' }).screen).toBe('chapterComplete');
    const done = run(c, { type: 'CONTINUE' }, { type: 'FINISH_CHAPTER' });
    expect(done.screen).toBe('map');
    expect(done.currentChapter).toBe(2);
    expect(done.pendingShipMove).toEqual({ from: 1, to: 2 });
  });

  it('4. Q1 incorrect triggers chapter failure', () => {
    const f = answer(s, false);
    expect(f.screen).toBe('failure');
    expect(f.currentStreak).toBe(0);
    expect(f.lastOutcome?.correct).toBe(false);
    expect(f.lastOutcome?.questionIndex).toBe(0);
    expect(f.totalFailures).toBe(1);
  });

  it('5. Q2 incorrect resets the chapter to Q1', () => {
    const f = answer(solve(s), false);
    expect(f.screen).toBe('failure');
    expect(f.lastOutcome?.questionIndex).toBe(1);
    expect(f.lastOutcome?.streakBefore).toBe(1);
    const r = gameReducer(f, { type: 'RETRY_CHAPTER' });
    expect(r.screen).toBe('challenge');
    expect(r.currentQuestion).toBe(0);
    expect(r.currentStreak).toBe(0);
    expect(currentQuestionOf(r).id).toBe(1);
    expect(r.chapterAttempts[1]).toBe(2);
  });

  it('6. Q3 incorrect resets the chapter to Q1', () => {
    const f = answer(solve(solve(s)), false);
    expect(f.lastOutcome?.questionIndex).toBe(2);
    expect(f.completedChapters).toEqual([]);
    const r = gameReducer(f, { type: 'RETRY_CHAPTER' });
    expect(currentQuestionOf(r).id).toBe(1);
    expect(r.currentStreak).toBe(0);
  });

  it('cannot resume at Q2/Q3 after failure, nor submit from the failure screen', () => {
    const f = answer(solve(solve(s)), false);
    const q3 = getQuestion(3);
    const sneaky = gameReducer(f, { type: 'SUBMIT_ANSWER', questionId: 3, answer: optimalAnswer(q3) });
    expect(sneaky).toBe(f);
    expect(gameReducer(f, { type: 'CONTINUE' })).toBe(f);
  });

  it('re-submitting the same wrong answer after retry still fails', () => {
    const f1 = answer(s, false);
    const retry = gameReducer(f1, { type: 'RETRY_CHAPTER' });
    const f2 = answer(retry, false);
    expect(f2.screen).toBe('failure');
    expect(f2.totalFailures).toBe(2);
  });

  it('ignores double submissions', () => {
    const a = answer(s, true);
    const again = gameReducer(a, { type: 'SUBMIT_ANSWER', questionId: 1, answer: optimalAnswer(getQuestion(1)) });
    expect(again).toBe(a);
    expect(a.currentStreak).toBe(1);
  });

  it('ignores answers for a question that is not current', () => {
    const wrongQ = gameReducer(s, { type: 'SUBMIT_ANSWER', questionId: 2, answer: optimalAnswer(getQuestion(2)) });
    expect(wrongQ).toBe(s);
  });
});

describe('chapter isolation and rewards', () => {
  it('7. failure does not reset earlier chapters', () => {
    let s = completeChapter(onMap(), 1);
    s = enterChapter(s, 2);
    s = answer(solve(s), false);
    expect(s.screen).toBe('failure');
    expect(s.completedChapters).toEqual([1]);
    expect(s.permanentXP).toBe(300);
    const retry = gameReducer(s, { type: 'RETRY_CHAPTER' });
    expect(retry.currentChapter).toBe(2);
    expect(currentQuestionOf(retry).id).toBe(4);
  });

  it('8. a failed attempt discards temporary XP', () => {
    let s = enterChapter(onMap(), 1);
    s = solve(solve(s));
    expect(s.temporaryXP).toBe(200);
    s = answer(s, false);
    expect(s.temporaryXP).toBe(0);
    expect(s.permanentXP).toBe(0);
    expect(s.lastOutcome?.temporaryXPLost).toBe(200);
  });

  it('9. a completed chapter commits XP exactly once', () => {
    let s = completeChapter(onMap(), 1);
    expect(s.permanentXP).toBe(300);
    // Replaying a completed chapter awards nothing.
    s = completeChapter(s, 1);
    expect(s.permanentXP).toBe(300);
    expect(s.completedChapters).toEqual([1]);
    expect(s.screen).toBe('map');
  });

  it('10. resource changes are not duplicated', () => {
    let s = completeChapter(onMap(), 1);
    expect(s.supplies).toBe(INITIAL_RESOURCES.supplies + 3);
    s = completeChapter(s, 1);
    expect(s.supplies).toBe(INITIAL_RESOURCES.supplies + 3);
    s = completeChapter(s, 2);
    expect(s.elapsedTime).toBe(6);
    expect(s.crew).toBe(12);
  });

  it('11. restarting restores the chapter-start state', () => {
    let s = completeChapter(completeChapter(completeChapter(onMap(), 1), 2), 3);
    const before = { crew: s.crew, supplies: s.supplies, elapsedTime: s.elapsedTime };
    s = enterChapter(s, 4);
    s = solve(s); // quiz answers do not add sailing time
    expect(s.elapsedTime).toBe(before.elapsedTime);
    s = answer(s, false);
    expect({ crew: s.crew, supplies: s.supplies, elapsedTime: s.elapsedTime }).toEqual(before);
    s = gameReducer(s, { type: 'RETRY_CHAPTER' });
    expect({ crew: s.crew, supplies: s.supplies, elapsedTime: s.elapsedTime }).toEqual(before);
    expect(s.hintsUsed).toEqual({});
  });

  it('hints halve XP, do not fail the chapter, and reset on retry', () => {
    let s = enterChapter(onMap(), 1);
    s = gameReducer(s, { type: 'USE_HINT', questionId: 1 });
    s = gameReducer(s, { type: 'USE_HINT', questionId: 1 }); // idempotent
    expect(s.screen).toBe('challenge');
    expect(s.totalHintsUsed).toBe(1);
    s = answer(s, true);
    expect(s.lastOutcome?.xpEarned).toBe(50);
    s = gameReducer(s, { type: 'CONTINUE' });
    s = answer(s, false);
    s = gameReducer(s, { type: 'RETRY_CHAPTER' });
    expect(s.hintsUsed).toEqual({});
    s = solve(solve(solve(s)));
    expect(s.permanentXP).toBe(300);
    expect(s.totalHintsUsed).toBe(1);
  });

  it('locked chapters cannot be opened', () => {
    const s = onMap();
    expect(gameReducer(s, { type: 'OPEN_CHAPTER', chapterId: 2 })).toBe(s);
    expect(gameReducer(s, { type: 'OPEN_CHAPTER', chapterId: 4 })).toBe(s);
  });

  it('abandoning a chapter mid-attempt discards its progress', () => {
    let s = enterChapter(onMap(), 1);
    s = solve(s);
    s = gameReducer(s, { type: 'ABANDON_CHAPTER' });
    expect(s.screen).toBe('map');
    expect(s.currentStreak).toBe(0);
    expect(s.temporaryXP).toBe(0);
  });
});

describe('persistence', () => {
  it('12. refresh restores the exact legal game state', () => {
    const storage = new Map<string, string>();
    const mock = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => void storage.set(k, v), removeItem: (k: string) => void storage.delete(k) };
    const snapshots: GameState[] = [];
    let s = completeChapter(onMap(), 1);
    snapshots.push(s);
    s = enterChapter(s, 2);
    snapshots.push(s);
    s = answer(s, true);
    snapshots.push(s); // correct screen
    s = gameReducer(s, { type: 'CONTINUE' });
    s = gameReducer(s, { type: 'USE_HINT', questionId: 5 });
    snapshots.push(s); // mid-question with a hint
    const failed = answer(s, false);
    snapshots.push(failed); // failure screen
    const done = answer(gameReducer(answer(s, true), { type: 'CONTINUE' }), true);
    snapshots.push(done); // chapter just committed
    snapshots.push(gameReducer(done, { type: 'CONTINUE' })); // chapterComplete screen
    for (const snap of snapshots) {
      saveGame(snap, mock);
      expect(loadGame(mock)).toEqual(snap);
    }
    expect(storage.has(SAVE_KEY)).toBe(true);
  });

  it('handles corrupt saved data gracefully', () => {
    const bad = (text: string) => ({ getItem: () => text, setItem: () => {}, removeItem: () => {} });
    expect(loadGame(bad('{not json'))).toBeNull();
    expect(loadGame(bad('null'))).toBeNull();
    expect(loadGame(bad('{"version":99}'))).toBeNull();
    expect(sanitizeState({ ...createInitialState(), crew: 'twelve' })).toBeNull();
  });

  it('repairs illegal but parseable saves', () => {
    // Claims to be on question 3 with no streak — must not let the player skip ahead.
    const s = enterChapter(onMap(), 1);
    const tampered = sanitizeState({ ...s, currentQuestion: 2, currentStreak: 0 })!;
    expect(tampered.screen).toBe('map');
    expect(tampered.currentStreak).toBe(0);
    // Claims chapter 3 complete without 1–2.
    const skip = sanitizeState({ ...createInitialState(), completedChapters: [3], permanentXP: 300 })!;
    expect(skip.completedChapters).toEqual([]);
    expect(skip.permanentXP).toBe(0);
    // Inflated XP is recomputed from chapter records.
    const done = completeChapter(onMap(), 1);
    expect(sanitizeState({ ...done, permanentXP: 9999 })!.permanentXP).toBe(300);
    // Victory without finishing is refused.
    expect(sanitizeState({ ...done, screen: 'victory' })!.screen).toBe('map');
  });

  it('13. Play Again resets everything', () => {
    let s = completeChapter(completeChapter(onMap(), 1), 2);
    s = gameReducer(s, { type: 'PLAY_AGAIN' });
    expect(s).toEqual({ ...createInitialState(), screen: 'intro', previousScreen: 'title' });
  });
});

describe('full campaign', () => {
  it('14. all four chapters can be completed, ending in victory with max XP', () => {
    let s = onMap();
    for (const id of [1, 2, 3]) {
      s = completeChapter(s, id);
      expect(s.screen).toBe('map');
    }
    s = completeChapter(s, 4);
    expect(s.screen).toBe('victory');
    expect(s.completedChapters).toEqual([1, 2, 3, 4]);
    expect(s.completedQuestionIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(s.permanentXP).toBe(1200);
    expect(s.supplies).toBe(18);
    expect(s.elapsedTime).toBe(6);
    expect(s.crew).toBe(12);
    expect(getChapter(4).questionIds).toEqual([10, 11, 12]);
  });

  it('the streak can never exceed three or skip a question', () => {
    let s = enterChapter(onMap(), 1);
    const seen: number[] = [];
    for (let i = 0; i < 3; i++) {
      seen.push(currentQuestionOf(s).id);
      s = solve(s);
    }
    expect(seen).toEqual([1, 2, 3]);
    expect(s.screen).toBe('chapterComplete');
  });
});
