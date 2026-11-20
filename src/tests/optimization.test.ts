import { describe, expect, it } from 'vitest';
import { getQuestion, QUESTIONS } from './fixtures/optimizationQuestions';
import {
  dijkstra,
  enumeratePaths,
  evaluateAnswer,
  evaluateChoice,
  evaluateKnapsack,
  evaluatePath,
  optimalAnswer,
  solveChoice,
  solveKnapsackBruteForce,
  solveKnapsackDP,
  suboptimalAnswer,
  validatePath,
} from '../game/optimization';
import type { KnapsackQuestion, MultipleChoiceQuestion, ShortestPathQuestion } from '../game/types';

const choice = (id: number) => getQuestion(id) as MultipleChoiceQuestion;
const knap = (id: number) => getQuestion(id) as KnapsackQuestion;
const graph = (id: number) => getQuestion(id) as ShortestPathQuestion;

describe('data integrity', () => {
  it('has exactly 12 questions, three per chapter, with unique ids', () => {
    expect(QUESTIONS).toHaveLength(12);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(12);
    for (const ch of [1, 2, 3, 4]) expect(QUESTIONS.filter((q) => q.chapterId === ch)).toHaveLength(3);
  });

  it('uses multiple choice for I–II, knapsack for III and graphs for IV', () => {
    expect(QUESTIONS.filter((q) => q.chapterId <= 2).every((q) => q.kind === 'choice')).toBe(true);
    expect(QUESTIONS.filter((q) => q.chapterId === 3).every((q) => q.kind === 'knapsack')).toBe(true);
    expect(QUESTIONS.filter((q) => q.chapterId === 4).every((q) => q.kind === 'graph')).toBe(true);
  });

  it('every question has a verifiable optimal answer and a failing answer', () => {
    for (const q of QUESTIONS) {
      expect(evaluateAnswer(q, optimalAnswer(q)).correct).toBe(true);
      expect(evaluateAnswer(q, suboptimalAnswer(q)).correct).toBe(false);
    }
  });
});

describe('Chapter I — beginner optimization', () => {
  it('Q1 maximization: fishing (B, 20 portions) is optimal', () => {
    const sol = solveChoice(choice(1));
    expect(sol.optimalIds).toEqual(['B']);
    expect(sol.optimalValue).toBe(20);
    expect(evaluateChoice(choice(1), 'B').correct).toBe(true);
    expect(evaluateChoice(choice(1), 'A').correct).toBe(false);
    expect(evaluateChoice(choice(1), 'C').correct).toBe(false);
  });

  it('Q2 minimization: the Coastal Trail (B, 10 minutes) is optimal', () => {
    expect(solveChoice(choice(2)).optimalIds).toEqual(['B']);
    expect(solveChoice(choice(2)).optimalValue).toBe(10);
    expect(evaluateChoice(choice(2), 'C').correct).toBe(false);
  });

  it('Q3 efficiency ratio: merchant C (4 meals/coin) is optimal', () => {
    const sol = solveChoice(choice(3));
    expect(sol.values).toEqual({ A: 2, B: 3, C: 4 });
    expect(sol.optimalIds).toEqual(['C']);
    // The biggest raw total is not the most efficient option.
    expect(evaluateChoice(choice(3), 'B').correct).toBe(false);
  });
});

describe('Chapter II — constrained optimization', () => {
  it('Q4: only the Disguise (B) is feasible', () => {
    const sol = solveChoice(choice(4));
    expect(sol.feasibleIds).toEqual(['B']);
    expect(sol.optimalIds).toEqual(['B']);
    const tunnel = evaluateChoice(choice(4), 'A');
    expect(tunnel.correct).toBe(false);
    expect(tunnel.headline).toMatch(/constraint/i);
    expect(tunnel.reason).toMatch(/6 tools/);
    const cliff = evaluateChoice(choice(4), 'C');
    expect(cliff.correct).toBe(false);
    expect(cliff.reason).toMatch(/casualt/i);
  });

  it('Q5: fastest feasible route is the Rocky Trail (B), not the infeasible tunnel', () => {
    const sol = solveChoice(choice(5));
    expect(sol.feasibleIds).toEqual(['B', 'C']);
    expect(sol.optimalIds).toEqual(['B']);
    expect(evaluateChoice(choice(5), 'A').correct).toBe(false);
    expect(evaluateChoice(choice(5), 'C').headline).toMatch(/better option/i);
  });

  it('Q6: six sailors (B) is the largest feasible rescue', () => {
    const sol = solveChoice(choice(6));
    expect(sol.feasibleIds).toEqual(['B', 'C']);
    expect(sol.optimalIds).toEqual(['B']);
    expect(sol.optimalValue).toBe(6);
    expect(evaluateChoice(choice(6), 'A').reason).toMatch(/18 minutes/);
  });

  it('rejects options that do not exist', () => {
    expect(evaluateChoice(choice(4), 'Z').correct).toBe(false);
  });

  it('accepts any equally optimal option', () => {
    const tie: MultipleChoiceQuestion = {
      ...choice(1),
      options: [
        { ...choice(1).options[0], id: 'A', attributes: { portions: 20 } },
        { ...choice(1).options[1], id: 'B', attributes: { portions: 20 } },
        { ...choice(1).options[2], id: 'C', attributes: { portions: 5 } },
      ],
    };
    expect(solveChoice(tie).optimalIds).toEqual(['A', 'B']);
    expect(evaluateChoice(tie, 'A').correct).toBe(true);
    expect(evaluateChoice(tie, 'B').correct).toBe(true);
    expect(evaluateChoice(tie, 'C').correct).toBe(false);
  });
});

describe('Chapter III — 0/1 knapsack', () => {
  const cases: [number, number, string[]][] = [
    [7, 11, ['food', 'shield']],
    [8, 14, ['sail', 'medicine']],
    [9, 18, ['water', 'medicine']],
  ];

  it.each(cases)('Q%i optimal value is %i via %j', (id, value, items) => {
    const q = knap(id);
    const sol = solveKnapsackBruteForce(q.items, q.capacity);
    expect(sol.bestValue).toBe(value);
    expect(sol.optimalSubsets).toHaveLength(1);
    expect([...sol.optimalSubsets[0].itemIds].sort()).toEqual([...items].sort());
    expect(sol.totalSubsets).toBe(2 ** q.items.length);
    expect(evaluateKnapsack(q, items).correct).toBe(true);
    // Order of selection does not matter.
    expect(evaluateKnapsack(q, [...items].reverse()).correct).toBe(true);
  });

  it('brute force agrees with dynamic programming', () => {
    for (const id of [7, 8, 9]) {
      const q = knap(id);
      expect(solveKnapsackDP(q.items, q.capacity).bestValue).toBe(solveKnapsackBruteForce(q.items, q.capacity).bestValue);
    }
  });

  it('rejects overweight cargo even when its value is higher', () => {
    const q = knap(7);
    const all = evaluateKnapsack(q, ['water', 'food', 'shield']);
    expect(all.correct).toBe(false);
    expect(all.headline).toMatch(/overloaded/i);
    expect(evaluateKnapsack(q, ['water', 'shield']).correct).toBe(false); // weight 7 > 6
  });

  it('rejects feasible but sub-optimal cargo', () => {
    expect(evaluateKnapsack(knap(8), ['rope', 'sail']).correct).toBe(false); // 13 < 14, uses all 7 units
    expect(evaluateKnapsack(knap(9), ['map', 'lantern', 'water']).correct).toBe(false); // 17 < 18
    expect(evaluateKnapsack(knap(9), ['medicine']).correct).toBe(false); // single best item
    expect(evaluateKnapsack(knap(7), []).correct).toBe(false);
  });

  it('rejects duplicated or unknown items', () => {
    expect(evaluateKnapsack(knap(7), ['food', 'food', 'shield']).correct).toBe(false);
    expect(evaluateKnapsack(knap(7), ['food', 'trident']).correct).toBe(false);
  });

  it('accepts any equally optimal combination', () => {
    const q: KnapsackQuestion = {
      ...knap(7),
      capacity: 5,
      items: [
        { id: 'a', name: 'A', weight: 2, value: 3, icon: '', flavor: '' },
        { id: 'b', name: 'B', weight: 3, value: 4, icon: '', flavor: '' },
        { id: 'c', name: 'C', weight: 5, value: 7, icon: '', flavor: '' },
      ],
    };
    const sol = solveKnapsackBruteForce(q.items, q.capacity);
    expect(sol.bestValue).toBe(7);
    expect(sol.optimalSubsets).toHaveLength(2);
    expect(evaluateKnapsack(q, ['a', 'b']).correct).toBe(true);
    expect(evaluateKnapsack(q, ['c']).correct).toBe(true);
    expect(evaluateKnapsack(q, ['b']).correct).toBe(false);
  });
});

describe('Chapter IV — shortest paths', () => {
  const cases: [number, number, string[]][] = [
    [10, 7, ['START', 'B', 'C', 'ITHACA']],
    [11, 10, ['START', 'B', 'D', 'ITHACA']],
    [12, 10, ['START', 'B', 'C', 'E', 'ITHACA']],
  ];

  it.each(cases)('Q%i shortest cost is %i via %j', (id, cost, path) => {
    const q = graph(id);
    const result = dijkstra(q.nodes.map((n) => n.id), q.edges, q.start, q.goal);
    expect(result.distance).toBe(cost);
    expect(result.path).toEqual(path);
    // Cross-check with exhaustive enumeration of every route.
    expect(Math.min(...enumeratePaths(q.edges, q.start, q.goal).map((r) => r.cost))).toBe(cost);
    expect(evaluatePath(q, path).correct).toBe(true);
    expect(validatePath(q, path).cost).toBe(cost);
  });

  it('does not assume the fewest stops is shortest', () => {
    const q = graph(10);
    const direct = evaluatePath(q, ['START', 'B', 'ITHACA']);
    expect(direct.correct).toBe(false);
    expect(direct.playerValue).toBe(10);
    expect(evaluatePath(q, ['START', 'A', 'ITHACA']).playerValue).toBe(9);
  });

  it('greedy first step fails in Q12', () => {
    const r = evaluatePath(graph(12), ['START', 'A', 'C', 'E', 'ITHACA']);
    expect(r.correct).toBe(false);
    expect(r.playerValue).toBe(11);
  });

  it('rejects invalid edges, wrong start, wrong destination and revisits', () => {
    const q = graph(11);
    expect(validatePath(q, ['START', 'C', 'ITHACA']).valid).toBe(false); // no START → C edge
    expect(validatePath(q, ['START', 'B', 'A', 'C', 'ITHACA']).valid).toBe(false); // B → A does not exist
    expect(validatePath(q, ['ITHACA', 'D', 'B', 'START']).valid).toBe(false); // reversed direction
    expect(validatePath(q, ['A', 'C', 'ITHACA']).valid).toBe(false); // wrong start
    expect(validatePath(q, ['START', 'B', 'D']).valid).toBe(false); // wrong destination
    expect(validatePath(q, ['START', 'X', 'ITHACA']).valid).toBe(false); // unknown node
    expect(validatePath(q, []).valid).toBe(false);
    expect(evaluatePath(q, ['START', 'C', 'ITHACA']).correct).toBe(false);
  });

  it('accepts any path achieving the true minimum', () => {
    const q: ShortestPathQuestion = {
      ...graph(10),
      edges: [
        { from: 'START', to: 'A', weight: 3 },
        { from: 'START', to: 'B', weight: 2 },
        { from: 'A', to: 'ITHACA', weight: 3 },
        { from: 'B', to: 'ITHACA', weight: 4 },
      ],
    };
    expect(evaluatePath(q, ['START', 'A', 'ITHACA']).correct).toBe(true);
    expect(evaluatePath(q, ['START', 'B', 'ITHACA']).correct).toBe(true);
  });

  it('records a Dijkstra trace that finalizes nodes in non-decreasing distance', () => {
    const q = graph(12);
    const { steps } = dijkstra(q.nodes.map((n) => n.id), q.edges, q.start, q.goal);
    expect(steps[0].visit).toBe('START');
    expect(steps[steps.length - 1].visit).toBe('ITHACA');
    for (let i = 1; i < steps.length; i++) expect(steps[i].distance).toBeGreaterThanOrEqual(steps[i - 1].distance);
  });

  it('rejects negative weights', () => {
    expect(() => dijkstra(['S', 'T'], [{ from: 'S', to: 'T', weight: -1 }], 'S', 'T')).toThrow();
  });
});

describe('answer type safety', () => {
  it('mismatched answer kinds are never correct', () => {
    expect(evaluateAnswer(getQuestion(1), { kind: 'graph', path: ['START'] }).correct).toBe(false);
    expect(evaluateAnswer(getQuestion(7), { kind: 'choice', optionId: 'B' }).correct).toBe(false);
    expect(evaluateAnswer(getQuestion(10), { kind: 'knapsack', itemIds: [] }).correct).toBe(false);
  });
});
