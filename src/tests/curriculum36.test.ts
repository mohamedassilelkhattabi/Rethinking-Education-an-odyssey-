import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTS_36, getQuestsForRealm, getQuestByRealmStage } from '../curriculum/quests';
import { REALMS } from '../curriculum/realms';
import { evaluateSimulation } from '../engine/simulationMath';

test('36-Quest Spiral Architecture has 6 Realms × 6 Cognitive Stages = 36 unique quests', () => {
  assert.equal(REALMS.length, 6);
  assert.equal(QUESTS_36.length, 36);

  const ids = new Set(QUESTS_36.map((q) => q.id));
  assert.equal(ids.size, 36);

  const expectedArchetypes = [
    'curiosity',
    'manipulation',
    'symbolic',
    'ai-transfer',
    'interleaved',
    'boss-teachback',
  ];

  for (const realm of REALMS) {
    const realmQuests = getQuestsForRealm(realm.id);
    assert.equal(realmQuests.length, 6, `Realm ${realm.id} must have 6 stages`);
    for (let s = 1; s <= 6; s++) {
      const q = getQuestByRealmStage(realm.id, s as 1 | 2 | 3 | 4 | 5 | 6);
      assert.ok(q, `Missing quest R${realm.id}-S${s}`);
      assert.equal(q.stageArchetype, expectedArchetypes[s - 1]);
      if (s === 1 || s === 2) {
        assert.equal(q.hideFormulaInitially, true, `${q.id} must hide formulas initially`);
      } else {
        assert.equal(q.hideFormulaInitially, false, `${q.id} should show symbolic bridge`);
      }
      if (s === 4) {
        assert.ok(q.defaultTransferScenario, `${q.id} must have a curated Stage 4 fallback scenario`);
      }
      if (s === 5) {
        assert.ok(q.interleavedLenses && q.interleavedLenses.options.some((o) => o.isBestFit), `${q.id} needs interleaved lenses`);
      }
      if (s === 6) {
        assert.ok(q.teachBack && q.teachBack.choices.some((c) => c.isCoreInsight), `${q.id} needs Stage 6 teach-back`);
      }
    }
  }
});

test('Every quest simulation has reachable target values within slider bounds and aligns cleanly', () => {
  for (const q of QUESTS_36) {
    assert.ok(q.simulation.controls.length >= 1, `${q.id} needs at least one slider`);
    const targetValues: Record<string, number> = {};
    for (const c of q.simulation.controls) {
      assert.ok(c.target >= c.min && c.target <= c.max, `${q.id}.${c.id} target out of bounds`);
      assert.ok(c.initial >= c.min && c.initial <= c.max, `${q.id}.${c.id} initial out of bounds`);
      targetValues[c.id] = c.target;
    }
    const outcome = evaluateSimulation(q.simulation, targetValues);
    assert.equal(outcome.aligned, true, `${q.id} should align at target values`);
    assert.equal(outcome.direction, 'aligned');
  }
});
