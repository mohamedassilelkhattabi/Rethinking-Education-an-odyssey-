import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAPTERS, LOCATIONS } from '../data/chapters';
import { getQuestion, QUESTIONS } from '../data/questions';
import { evaluateAnswer, optimalAnswer } from '../game/optimization';
import { MAX_XP } from '../game/scoring';
import { LEVELS } from '../survival/levels';
import { NPC_BY_QUESTION, NPCS } from '../survival/npcs';

test('Calculus I curriculum covers all 6 units and 18 problems with complete metadata', () => {
  assert.equal(CHAPTERS.length, 6);
  assert.equal(QUESTIONS.length, 18);
  assert.equal(LOCATIONS.length, 8);
  assert.equal(MAX_XP, 1800);
  assert.equal(NPCS.length, 18);
  assert.equal(LEVELS.length, 6);

  const expectedUnits = [
    'Unit 1: Pre-Calculus & Review',
    'Unit 2: Limits & Continuity',
    'Unit 3: Derivatives',
    'Unit 4: Applications of Derivatives',
    'Unit 5: Integrals',
    'Unit 6: Applications of Integrals',
  ];

  for (let i = 0; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i];
    assert.equal(ch.id, i + 1);
    assert.equal(ch.unitLabel, expectedUnits[i]);
    assert.equal(ch.questionIds.length, 3);
    assert.ok(ch.focus.length >= 3);
    const level = LEVELS.find((l) => l.chapterId === ch.id);
    assert.ok(level, `Missing level for chapter ${ch.id}`);
    assert.equal(level.npcs.length, 3);
  }
});

test('Every Calculus I problem has LaTeX, 4 options, 3 progressive hints, worked solution, and deterministic evaluation', () => {
  const seenIds = new Set<number>();
  for (const q of QUESTIONS) {
    assert.ok(!seenIds.has(q.id), `Duplicate question id ${q.id}`);
    seenIds.add(q.id);
    assert.equal(q.kind, 'quiz');
    assert.equal(q.options.length, 4);
    assert.ok(q.options.some((o) => o.id === q.correctOptionId), `Missing correctOptionId on Q${q.id}`);
    assert.ok(q.objectiveText.includes('$') || q.teaching.includes('$'), `Q${q.id} should include LaTeX math`);
    assert.ok(Array.isArray(q.lesson.hints) && q.lesson.hints.length >= 3, `Q${q.id} must include 3 progressive hints`);
    assert.ok(
      Array.isArray(q.lesson.workedSolution) && q.lesson.workedSolution.length >= 3,
      `Q${q.id} must include step-by-step worked solution`,
    );
    assert.ok(NPC_BY_QUESTION[q.id], `Missing NPC for Q${q.id}`);

    const best = optimalAnswer(q);
    const rightEval = evaluateAnswer(q, best);
    assert.equal(rightEval.correct, true);
    assert.ok(rightEval.workedSolution && rightEval.workedSolution.length >= 3);

    const wrongOpt = q.options.find((o) => o.id !== q.correctOptionId)!;
    const wrongEval = evaluateAnswer(q, { kind: 'quiz', optionId: wrongOpt.id });
    assert.equal(wrongEval.correct, false);
    assert.ok(wrongEval.workedSolution && wrongEval.workedSolution.length >= 3);
  }

  assert.equal(getQuestion(18).chapterId, 6);
});
