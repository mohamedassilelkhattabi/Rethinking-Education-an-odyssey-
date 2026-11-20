import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRecallProbability,
  createInitialRetentionState,
  isQuestUnlocked,
  isRealmUnlocked,
  pickAmbientCurrent,
  recordConceptPractice,
  resolveEffectiveTheme,
} from '../engine/retentionEngine';

test('HLR recall probability decays smoothly with elapsed hours and expands half-life on fluent solves', () => {
  const baseTime = 1_700_000_000_000;
  let state = createInitialRetentionState();

  state = recordConceptPractice(state, {
    conceptId: 'r2-secant-approach',
    questId: 'R2-S1',
    realmId: 2,
    completed: true,
    adjustments: 1,
    durationMs: 9000,
    usedOracleNudge: false,
    nowMs: baseTime,
  });

  const mem1 = state.concepts['r2-secant-approach'];
  assert.ok(mem1.halfLifeHours > 6, 'Fluent solve should expand half-life above 6h baseline');
  assert.equal(computeRecallProbability(mem1, baseTime), 1);

  // At exactly 1 half-life later, recall should equal ~0.5
  const oneHalfLifeLater = baseTime + mem1.halfLifeHours * 3_600_000;
  const pHalf = computeRecallProbability(mem1, oneHalfLifeLater);
  assert.ok(Math.abs(pHalf - 0.5) < 0.01, `Expected ~0.5 at 1 half-life, got ${pHalf}`);

  // Practicing again when recall has dipped expands half-life even further (spacing effect)
  state = recordConceptPractice(state, {
    conceptId: 'r2-secant-approach',
    questId: 'R2-S1',
    realmId: 2,
    completed: true,
    adjustments: 1,
    durationMs: 7000,
    usedOracleNudge: false,
    nowMs: oneHalfLifeLater,
  });
  const mem2 = state.concepts['r2-secant-approach'];
  assert.ok(mem2.halfLifeHours > mem1.halfLifeHours, 'Spaced fluent review should increase half-life');
});

test('Silent ambient weaving surfaces concepts nearing forgetting threshold without nagging fresh memories', () => {
  const t0 = 1_700_000_000_000;
  let state = createInitialRetentionState();
  state = recordConceptPractice(state, {
    conceptId: 'r1-function-shift',
    questId: 'R1-S1',
    realmId: 1,
    completed: true,
    adjustments: 1,
    durationMs: 5000,
    usedOracleNudge: false,
    nowMs: t0,
  });

  // Immediately after practice, no ambient current needed
  assert.equal(pickAmbientCurrent(state, t0), null);

  // 24 hours later, recall has dropped below 0.78 -> silent ambient current appears
  const ambient = pickAmbientCurrent(state, t0 + 24 * 3_600_000);
  assert.ok(ambient, 'Expected silent ambient current when memory approaches forgetting curve');
  assert.equal(ambient.questId, 'R1-S1');
  assert.ok(ambient.recallProbability < 0.78);
});

test('Progression unlocks realms naturally and Explorer Mode unlocks all 36 quests immediately', () => {
  let state = createInitialRetentionState();
  assert.equal(isRealmUnlocked(state, 1), true);
  assert.equal(isRealmUnlocked(state, 2), false);
  assert.equal(isQuestUnlocked(state, 1, 1), true);
  assert.equal(isQuestUnlocked(state, 1, 2), false);

  state = { ...state, explorerMode: true };
  assert.equal(isRealmUnlocked(state, 6), true);
  assert.equal(isQuestUnlocked(state, 6, 6), true);

  assert.equal(resolveEffectiveTheme('auto', 14), 'daylight');
  assert.equal(resolveEffectiveTheme('auto', 21), 'dusk');
});
