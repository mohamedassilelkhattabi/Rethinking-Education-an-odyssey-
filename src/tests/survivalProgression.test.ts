import { describe, expect, it } from 'vitest';
import { getQuestion } from '../data/questions';
import { optimalAnswer, suboptimalAnswer, evaluateAnswer } from '../game/optimization';
import { createRun, isExitUnlocked, npcStatus, survivalReducer as reduce } from '../survival/reducer';
import { loadRun, saveRun, sanitizeRun, SURVIVAL_SAVE_KEY } from '../survival/save';
import { GameStore } from '../survival/store';
import type { SurvivalState } from '../survival/types';

/** Open a challenge and submit an answer through the atomic resolution path. */
function attempt(s: SurvivalState, qid: number, correct: boolean, hint = false): SurvivalState {
  s = reduce(s, { type: 'OPEN_CHALLENGE', questionId: qid });
  if (hint) s = reduce(s, { type: 'USE_HINT', questionId: qid });
  const token = s.activeChallenge!.token;
  const q = getQuestion(qid);
  return reduce(s, { type: 'SUBMIT', questionId: qid, token, answer: correct ? optimalAnswer(q) : suboptimalAnswer(q) });
}

const QIDS: Record<number, number[]> = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] };

function clearChapter(s: SurvivalState, ch: number): SurvivalState {
  for (const q of QIDS[ch]) s = attempt(s, q, true);
  return s;
}

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    map: m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe('NPC question order', () => {
  it('only the next NPC in sequence can open a challenge', () => {
    const s = createRun();
    expect(npcStatus(s, 1)).toBe('next');
    expect(npcStatus(s, 2)).toBe('locked');
    expect(npcStatus(s, 4)).toBe('elsewhere');
    expect(reduce(s, { type: 'OPEN_CHALLENGE', questionId: 2 })).toBe(s);
    expect(reduce(s, { type: 'OPEN_CHALLENGE', questionId: 3 })).toBe(s);
  });

  it('solving one NPC unlocks the next', () => {
    const s = attempt(createRun(), 1, true);
    expect(npcStatus(s, 1)).toBe('done');
    expect(npcStatus(s, 2)).toBe('next');
    expect(npcStatus(s, 3)).toBe('locked');
  });
});

describe('correct answers', () => {
  it('increment the streak and award temporary XP only', () => {
    let s = attempt(createRun(), 1, true);
    expect(s.currentStreak).toBe(1);
    expect(s.temporaryXP).toBe(100);
    expect(s.xp).toBe(0);
    expect(s.lastResult?.correct).toBe(true);
    s = attempt(s, 2, true, true);
    expect(s.currentStreak).toBe(2);
    expect(s.temporaryXP).toBe(150);
    expect(s.lastResult?.xpEarned).toBe(50);
  });

  it('three in a row completes the chapter and commits XP exactly once', () => {
    const s = clearChapter(createRun(), 1);
    expect(s.completedChapters).toEqual([1]);
    expect(s.xp).toBe(300);
    expect(s.temporaryXP).toBe(0);
    expect(s.lastResult?.chapterCompleted).toBe(true);
    // No NPC in a completed chapter can be re-opened for more XP.
    expect(reduce(s, { type: 'OPEN_CHALLENGE', questionId: 3 })).toBe(s);
  });
});

describe('incorrect answers', () => {
  it.each([
    [1, 10],
    [2, 15],
    [3, 20],
    [4, 25],
  ])('Chapter %i costs %i health and %i hunger exactly once', (ch, penalty) => {
    let s = createRun();
    for (let c = 1; c < ch; c++) {
      s = clearChapter(s, c);
      s = reduce(s, { type: 'ENTER_CHAPTER', chapterId: c + 1 });
    }
    const before = { health: s.health, hunger: s.hunger };
    s = attempt(s, QIDS[ch][0], false);
    expect(s.health).toBe(before.health - penalty);
    expect(s.hunger).toBe(before.hunger - penalty);
    expect(s.lastResult?.healthLost).toBe(penalty);
    expect(s.lastResult?.hungerLost).toBe(penalty);
  });

  it('reset the streak, discard temporary XP and send the player to the checkpoint', () => {
    let s = attempt(attempt(createRun(), 1, true), 2, true);
    const token = s.respawnToken;
    s = attempt(s, 3, false);
    expect(s.currentStreak).toBe(0);
    expect(s.answered).toEqual([]);
    expect(s.temporaryXP).toBe(0);
    expect(s.respawnToken).toBe(token + 1);
    expect(npcStatus(s, 1)).toBe('next');
    expect(npcStatus(s, 2)).toBe('locked');
    expect(s.chapterAttempts[1]).toBe(2);
    expect(s.totalIncorrectAnswers).toBe(1);
  });

  it('keep inventory and previously completed chapters', () => {
    let s = clearChapter(createRun(), 1);
    s = reduce(s, { type: 'ENTER_CHAPTER', chapterId: 2 });
    s = reduce(s, { type: 'PICKUP', pickupId: 'x', item: 'fish', renewable: true });
    const inv = s.inventory;
    s = attempt(s, 4, false);
    expect(s.inventory).toEqual(inv);
    expect(s.completedChapters).toEqual([1]);
    expect(s.xp).toBe(300);
    expect(s.status).toBe('playing');
  });

  it('do not reveal the optimal answer in the spoiler-free explanation', () => {
    for (const qid of [1, 3, 4, 5, 7, 9, 11, 12]) {
      const q = getQuestion(qid);
      const ev = evaluateAnswer(q, suboptimalAnswer(q));
      expect(ev.correct).toBe(false);
      expect(ev.discreetReason.length).toBeGreaterThan(20);
      if (q.kind === 'graph') expect(ev.discreetReason).not.toContain(ev.optimalPath!.join(' → '));
      else expect(ev.discreetReason).not.toContain(ev.optimalLabel);
    }
  });
});

describe('duplicate submission prevention', () => {
  it('a token can resolve only once (no double damage, no double XP)', () => {
    let s = reduce(createRun(), { type: 'OPEN_CHALLENGE', questionId: 1 });
    const token = s.activeChallenge!.token;
    const wrong = { type: 'SUBMIT' as const, questionId: 1, token, answer: suboptimalAnswer(getQuestion(1)) };
    s = reduce(s, wrong);
    expect(s.health).toBe(90);
    expect(reduce(s, wrong)).toBe(s);

    let c = reduce(createRun(), { type: 'OPEN_CHALLENGE', questionId: 1 });
    const right = { type: 'SUBMIT' as const, questionId: 1, token: c.activeChallenge!.token, answer: optimalAnswer(getQuestion(1)) };
    c = reduce(c, right);
    expect(reduce(c, right)).toBe(c);
    expect(c.temporaryXP).toBe(100);
  });

  it('submissions without an open challenge are ignored', () => {
    const s = createRun();
    expect(reduce(s, { type: 'SUBMIT', questionId: 1, token: 1, answer: optimalAnswer(getQuestion(1)) })).toBe(s);
  });
});

describe('chapter exits and progression', () => {
  it('the exit stays locked until the chapter is complete', () => {
    let s = attempt(attempt(createRun(), 1, true), 2, true);
    expect(isExitUnlocked(s)).toBe(false);
    const blocked = reduce(s, { type: 'ENTER_CHAPTER', chapterId: 2 });
    expect(blocked.currentChapter).toBe(1);
    s = attempt(s, 3, true);
    expect(isExitUnlocked(s)).toBe(true);
    s = reduce(s, { type: 'ENTER_CHAPTER', chapterId: 2 });
    expect(s.currentChapter).toBe(2);
    expect(s.currentStreak).toBe(0);
  });

  it('chapters cannot be skipped', () => {
    const s = clearChapter(createRun(), 1);
    expect(reduce(s, { type: 'ENTER_CHAPTER', chapterId: 3 }).currentChapter).toBe(1);
  });

  it('completing all four chapters wins the game with 1,200 XP', () => {
    let s = createRun();
    for (const ch of [1, 2, 3]) s = reduce(clearChapter(s, ch), { type: 'ENTER_CHAPTER', chapterId: ch + 1 });
    s = clearChapter(s, 4);
    expect(s.status).toBe('victory');
    expect(s.xp).toBe(1200);
    expect(s.completedChapters).toEqual([1, 2, 3, 4]);
    expect(s.questionsSolved).toBe(12);
  });
});

describe('permadeath', () => {
  it('a fatal wrong answer kills Odysseus and ends the run', () => {
    let s: SurvivalState = { ...createRun(), health: 10 };
    s = attempt(s, 1, false);
    expect(s.status).toBe('dead');
    expect(s.lastResult?.died).toBe(true);
    expect(s.summary?.cause).toBe('answer');
  });

  it('death wipes the save so the run cannot be continued, and a new run starts at Chapter I', () => {
    const storage = memoryStorage();
    const store = new GameStore({ persist: true, demo: false, storage });
    store.newRun();
    // Progress, then die.
    for (const q of [1, 2, 3]) {
      store.dispatch({ type: 'OPEN_CHALLENGE', questionId: q });
      store.dispatch({ type: 'SUBMIT', questionId: q, token: store.state.activeChallenge!.token, answer: optimalAnswer(getQuestion(q)) });
    }
    store.dispatch({ type: 'ENTER_CHAPTER', chapterId: 2 });
    expect(storage.map.has(SURVIVAL_SAVE_KEY)).toBe(true);
    expect(store.hasLivingSave()).toBe(true);
    for (let i = 0; i < 7; i++) {
      store.dispatch({ type: 'OPEN_CHALLENGE', questionId: 4 });
      store.dispatch({ type: 'SUBMIT', questionId: 4, token: store.state.activeChallenge!.token, answer: suboptimalAnswer(getQuestion(4)) });
    }
    expect(store.state.status).toBe('dead');
    expect(storage.map.has(SURVIVAL_SAVE_KEY)).toBe(false);
    expect(store.hasLivingSave()).toBe(false);
    expect(store.continueRun()).toBe(false);

    store.newRun();
    const fresh = store.state;
    expect(fresh.status).toBe('playing');
    expect(fresh.currentChapter).toBe(1);
    expect(fresh.completedChapters).toEqual([]);
    expect(fresh.xp).toBe(0);
    expect(fresh.health).toBe(100);
    expect(fresh.hunger).toBe(100);
    expect(fresh.inventory).toEqual({ apple: 2, fish: 0, bread: 1, ambrosia: 0 });
  });

  it('demo-only actions are ignored by the campaign store', () => {
    const store = new GameStore({ persist: false, demo: false });
    store.newRun();
    store.dispatch({ type: 'DEMO_KILL' });
    expect(store.state.status).toBe('playing');
    const demo = new GameStore({ persist: false, demo: true });
    demo.newRun();
    demo.dispatch({ type: 'DEMO_KILL' });
    expect(demo.state.status).toBe('dead');
  });
});

describe('save and restore', () => {
  it('restores a living run exactly (minus transient UI fields)', () => {
    const storage = memoryStorage();
    let s = attempt(attempt(createRun('abc'), 1, true, true), 2, true);
    s = reduce(s, { type: 'TICK', ms: 4000 });
    s = reduce(s, { type: 'PICKUP', pickupId: 'c1-fish-beach', item: 'fish', renewable: true });
    saveRun(s, storage);
    const loaded = loadRun(storage)!;
    expect(loaded).toEqual({ ...s, lastResult: null, notice: null, activeChallenge: null });
  });

  it('a refresh cannot undo a penalty: the damaged state is what gets saved', () => {
    const storage = memoryStorage();
    const store = new GameStore({ persist: true, demo: false, storage });
    store.newRun();
    store.dispatch({ type: 'OPEN_CHALLENGE', questionId: 1 });
    store.dispatch({ type: 'SUBMIT', questionId: 1, token: store.state.activeChallenge!.token, answer: suboptimalAnswer(getQuestion(1)) });
    expect(loadRun(storage)!.health).toBe(90);
    expect(loadRun(storage)!.hunger).toBe(90);
  });

  it('rejects dead, corrupt or tampered saves', () => {
    expect(sanitizeRun(null)).toBeNull();
    expect(sanitizeRun({ ...createRun(), status: 'dead' })).toBeNull();
    expect(sanitizeRun({ ...createRun(), health: 0 })).toBeNull();
    expect(sanitizeRun({ ...createRun(), health: 'lots' })).toBeNull();
    const skip = sanitizeRun({ ...createRun(), completedChapters: [3], currentChapter: 4, xp: 900 })!;
    expect(skip.currentChapter).toBe(1);
    expect(skip.xp).toBe(0);
    const order = sanitizeRun({ ...createRun(), answered: [2, 3], currentStreak: 2 })!;
    expect(order.answered).toEqual([]);
    expect(order.currentStreak).toBe(0);
  });
});
