import assert from 'node:assert/strict';
import test from 'node:test';
import { getQuestion } from '../data/questions';
import type { QuizQuestion } from '../game/types';
import {
  applyVariantToQuestion,
  getAllUnitMastery,
  getDueReviews,
  overallRetentionStats,
  pickDueReviewQuestionId,
  profileSignature,
  recordAttempt,
} from '../personalization/spacedRepetition';
import {
  clearAllPersonalizationData,
  loadConsent,
  loadMastery,
  loadProfile,
  saveConsent,
  saveMastery,
  saveProfile,
} from '../personalization/storage';
import { DEFAULT_PROFILE, type MasteryMap, type PersonalizedVariant } from '../personalization/types';

function createMemoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
}

test('Spaced repetition flags wrong answers as weak and prioritizes them for review', () => {
  const t0 = 1_700_000_000_000;
  let map: MasteryMap = {};

  // Solve Q1 quickly and accurately
  map = recordAttempt(map, { questionId: 1, isCorrect: true, solveMs: 12_000, usedHint: false, now: t0 });
  assert.equal(map[1].weak, false);
  assert.equal(map[1].streak, 1);

  // Miss Q7 (Unit 3 Derivatives)
  map = recordAttempt(map, { questionId: 7, isCorrect: false, solveMs: 28_000, usedHint: false, now: t0 + 5_000 });
  assert.equal(map[7].weak, true);
  assert.equal(map[7].streak, 0);

  // Q7 should immediately be highest-priority due review
  const dueNow = getDueReviews(map, t0 + 10_000);
  assert.equal(dueNow.length, 1);
  assert.equal(dueNow[0].questionId, 7);
  assert.equal(pickDueReviewQuestionId(map, t0 + 10_000), 7);

  // Recover Q7 with two confident correct recalls
  map = recordAttempt(map, { questionId: 7, isCorrect: true, solveMs: 18_000, usedHint: false, now: t0 + 180_000 });
  map = recordAttempt(map, { questionId: 7, isCorrect: true, solveMs: 14_000, usedHint: false, now: t0 + 1_200_000 });
  map = recordAttempt(map, { questionId: 7, isCorrect: true, solveMs: 11_000, usedHint: false, now: t0 + 10_000_000 });
  assert.equal(map[7].streak, 3);
  assert.equal(map[7].weak, false);
  assert.ok(map[7].intervalMs > 2 * 60 * 60_000);

  const units = getAllUnitMastery(map, t0 + 10_000_000);
  assert.equal(units.length, 6);
  assert.equal(units[0].masteredCount, 1);
  assert.equal(units[2].masteredCount, 1);

  const overall = overallRetentionStats(map, t0 + 10_000_000);
  assert.equal(overall.attemptedUnique, 2);
  assert.equal(overall.totalCurriculum, 18);
});

test('applyVariantToQuestion preserves correctOptionId and updates scenario copy cleanly', () => {
  const base = getQuestion(8) as QuizQuestion;
  const variant: PersonalizedVariant = {
    questionId: base.id,
    profileHash: profileSignature(DEFAULT_PROFILE),
    createdAt: Date.now(),
    title: 'Viral Video View Velocity',
    hookTag: 'YouTube Creator Analytics',
    story: ['Your latest edit is spiking on YouTube Shorts.'],
    teaching: 'Apply the Chain Rule cleanly: $\\frac{d}{dx}[f(g(x))] = f\'(g(x))g\'(x)$.',
    objectiveText: 'Given view model $V(x) = \\sin(3x^2)$, compute $V\'(x)$.',
    options: base.options.map((o) => ({ ...o, explanation: `Custom explanation for ${o.id}` })),
    hints: ['Hint 1', 'Hint 2', 'Hint 3'],
    workedSolution: ['Step 1', 'Step 2'],
  };

  const merged = applyVariantToQuestion(base, variant);
  assert.equal(merged.correctOptionId, base.correctOptionId);
  assert.equal(merged.title, 'Viral Video View Velocity');
  assert.equal(merged.personalizedHook, 'YouTube Creator Analytics');
  assert.equal(merged.lesson.hints?.length, 3);
});

test('Consent storage & data wipe revoke permissions and remove local profile/mastery', () => {
  const mem = createMemoryStorage();
  saveConsent(
    {
      decided: true,
      allowAiPersonalization: true,
      allowInterestImport: true,
      allowMasteryTracking: true,
      updatedAt: Date.now(),
    },
    mem,
  );
  saveProfile({ ...DEFAULT_PROFILE, displayName: 'Jordan' }, mem);
  saveMastery(recordAttempt({}, { questionId: 1, isCorrect: true, solveMs: 10_000 }), mem);

  assert.equal(loadProfile(mem).displayName, 'Jordan');
  assert.ok(loadMastery(mem)[1]);

  clearAllPersonalizationData(mem);
  const afterConsent = loadConsent(mem);
  assert.equal(afterConsent.decided, true);
  assert.equal(afterConsent.allowAiPersonalization, false);
  assert.equal(afterConsent.allowMasteryTracking, false);
  assert.equal(Object.keys(loadMastery(mem)).length, 0);
  assert.equal(loadProfile(mem).displayName, DEFAULT_PROFILE.displayName);
});
