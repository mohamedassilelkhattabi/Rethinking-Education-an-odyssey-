import type {
  Answer,
  BreakdownRow,
  ChoiceOption,
  Constraint,
  DijkstraStep,
  DijkstraUpdate,
  Evaluation,
  GraphEdge,
  KnapsackItem,
  KnapsackQuestion,
  Metric,
  MultipleChoiceQuestion,
  Question,
  QuizQuestion,
  ShortestPathQuestion,
} from './types';

/** Tolerance for floating-point comparisons (ratios such as meals/coin). */
export const EPSILON = 1e-9;

export const nearlyEqual = (a: number, b: number) => Math.abs(a - b) <= EPSILON;

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

// ═════════════════════════════════════════════════════════════
// 1. MULTIPLE-CHOICE: objective + constraints
// ═════════════════════════════════════════════════════════════

export function metricValue(attributes: Record<string, number>, metric: Metric): number {
  if (metric.kind === 'attribute') {
    const v = attributes[metric.key];
    return typeof v === 'number' ? v : Number.NaN;
  }
  const num = attributes[metric.numerator];
  const den = attributes[metric.denominator];
  if (typeof num !== 'number' || typeof den !== 'number' || den === 0) return Number.NaN;
  return num / den;
}

export function satisfies(value: number, c: Constraint): boolean {
  if (!Number.isFinite(value)) return false;
  switch (c.op) {
    case '<=':
      return value <= c.limit + EPSILON;
    case '>=':
      return value >= c.limit - EPSILON;
    case '==':
      return nearlyEqual(value, c.limit);
  }
}

export function violatedConstraints(attributes: Record<string, number>, constraints: Constraint[]): Constraint[] {
  return constraints.filter((c) => !satisfies(attributes[c.key], c));
}

export function isBetter(a: number, b: number, sense: 'maximize' | 'minimize'): boolean {
  return sense === 'maximize' ? a > b + EPSILON : a < b - EPSILON;
}

export interface ChoiceSolution {
  feasibleIds: string[];
  optimalIds: string[];
  optimalValue: number;
  values: Record<string, number>;
}

export function solveChoice(q: MultipleChoiceQuestion): ChoiceSolution {
  const values: Record<string, number> = {};
  const feasible: ChoiceOption[] = [];
  for (const o of q.options) {
    values[o.id] = metricValue(o.attributes, q.objective.metric);
    if (Number.isFinite(values[o.id]) && violatedConstraints(o.attributes, q.constraints).length === 0) feasible.push(o);
  }
  if (feasible.length === 0) {
    return { feasibleIds: [], optimalIds: [], optimalValue: Number.NaN, values };
  }
  let best = values[feasible[0].id];
  for (const o of feasible) if (isBetter(values[o.id], best, q.objective.sense)) best = values[o.id];
  return {
    feasibleIds: feasible.map((o) => o.id),
    optimalIds: feasible.filter((o) => nearlyEqual(values[o.id], best)).map((o) => o.id),
    optimalValue: best,
    values,
  };
}

function attrUnit(q: MultipleChoiceQuestion, key: string): string {
  return q.attributes.find((a) => a.key === key)?.unit ?? '';
}

function describeViolation(q: MultipleChoiceQuestion, o: ChoiceOption, c: Constraint): string {
  const v = o.attributes[c.key];
  const unit = attrUnit(q, c.key);
  const relation = c.op === '<=' ? 'the limit is' : c.op === '>=' ? 'the minimum is' : 'it must be exactly';
  return `it requires ${formatNumber(v)} ${unit}, but ${relation} ${formatNumber(c.limit)} (${c.label.toLowerCase()})`;
}

export function evaluateChoice(q: MultipleChoiceQuestion, optionId: string): Evaluation {
  const sol = solveChoice(q);
  const chosen = q.options.find((o) => o.id === optionId);
  const optimal = q.options.filter((o) => sol.optimalIds.includes(o.id));
  const optimalLabel = optimal.map((o) => `${o.id}. ${o.label}`).join(' or ');
  const unit = q.objective.unit;

  const breakdown: BreakdownRow[] = q.options.map((o) => {
    const v = violatedConstraints(o.attributes, q.constraints);
    return {
      label: `${o.id}. ${o.label}`,
      metric: `${formatNumber(sol.values[o.id])} ${unit}`,
      feasible: v.length === 0,
      optimal: sol.optimalIds.includes(o.id),
      selected: o.id === optionId,
      note: v.length ? `Violates: ${v.map((c) => c.label).join(', ')}` : 'Satisfies every constraint',
    };
  });

  const base = {
    principle: q.lesson.principle,
    nextTime: q.lesson.nextTime,
    explanation: q.lesson.explanation,
    optimalLabel,
    optimalValue: sol.optimalValue,
    unit,
    breakdown,
  };

  if (!chosen) {
    return {
      ...base,
      correct: false,
      selectedLabel: 'No valid option',
      headline: 'No valid decision was made',
      reason: 'The submitted choice does not match any of the available options.',
      discreetReason: 'The submitted choice does not match any of the available options.',
      playerValue: null,
    };
  }

  const selectedLabel = `${chosen.id}. ${chosen.label}`;
  const value = sol.values[chosen.id];
  const violations = violatedConstraints(chosen.attributes, q.constraints);

  if (violations.length > 0) {
    const bestText = optimal.length
      ? ` Among the options that respect every constraint, ${optimalLabel} gives the best result: ${formatNumber(sol.optimalValue)} ${unit}.`
      : '';
    const core = `${chosen.label} is infeasible: ${violations.map((c) => describeViolation(q, chosen, c)).join('; and ')}. An option that breaks a constraint cannot be chosen, however good its ${q.objective.label} looks.`;
    return {
      ...base,
      correct: false,
      selectedLabel,
      headline: 'A constraint was violated',
      reason: core + bestText,
      discreetReason: core,
      playerValue: value,
    };
  }

  if (sol.optimalIds.includes(chosen.id)) {
    return {
      ...base,
      correct: true,
      selectedLabel,
      headline: 'Optimal decision',
      reason: q.lesson.explanation,
      discreetReason: q.lesson.explanation,
      playerValue: value,
    };
  }

  const direction = q.objective.sense === 'maximize' ? 'larger' : 'smaller';
  const [verb, betterVerb] = q.objective.sense === 'maximize' ? ['gives', 'gives'] : ['takes', 'takes only'];
  return {
    ...base,
    correct: false,
    selectedLabel,
    headline: 'A better option existed',
    reason: `${chosen.label} ${verb} ${formatNumber(value)} ${unit}, but ${optimalLabel} ${betterVerb} ${formatNumber(sol.optimalValue)} ${unit}. The goal is to ${q.objective.sense} ${q.objective.label}, so the ${direction} value wins.`,
    discreetReason: q.constraints.length
      ? `${chosen.label} ${verb} ${formatNumber(value)} ${unit}, but another feasible option does better. The goal is to ${q.objective.sense} ${q.objective.label}, so look for the ${direction} value among the options that satisfy every constraint.`
      : `${chosen.label} ${verb} ${formatNumber(value)} ${unit}, but another option does better. The goal is to ${q.objective.sense} ${q.objective.label}, so look for the ${direction} value.`,
    playerValue: value,
  };
}

// ═════════════════════════════════════════════════════════════
// 2. 0/1 KNAPSACK
// ═════════════════════════════════════════════════════════════

export interface Subset {
  itemIds: string[];
  weight: number;
  value: number;
  feasible: boolean;
}

export const MAX_BRUTE_FORCE_ITEMS = 20;

/** Enumerate every subset of items (2^n). Intended for small inventories. */
export function enumerateSubsets(items: KnapsackItem[], capacity: number): Subset[] {
  if (items.length > MAX_BRUTE_FORCE_ITEMS) throw new Error('Inventory too large for brute force');
  const out: Subset[] = [];
  const total = 1 << items.length;
  for (let mask = 0; mask < total; mask++) {
    let weight = 0;
    let value = 0;
    const ids: string[] = [];
    items.forEach((it, i) => {
      if (mask & (1 << i)) {
        weight += it.weight;
        value += it.value;
        ids.push(it.id);
      }
    });
    out.push({ itemIds: ids, weight, value, feasible: weight <= capacity });
  }
  return out;
}

export interface KnapsackSolution {
  bestValue: number;
  optimalSubsets: Subset[];
  feasibleSubsets: Subset[];
  totalSubsets: number;
}

export function solveKnapsackBruteForce(items: KnapsackItem[], capacity: number): KnapsackSolution {
  const all = enumerateSubsets(items, capacity);
  const feasible = all.filter((s) => s.feasible);
  const bestValue = feasible.reduce((m, s) => Math.max(m, s.value), 0);
  return {
    bestValue,
    optimalSubsets: feasible.filter((s) => s.value === bestValue),
    feasibleSubsets: feasible,
    totalSubsets: all.length,
  };
}

/** Classic dynamic-programming solver — used to cross-check the brute-force evaluator. */
export function solveKnapsackDP(items: KnapsackItem[], capacity: number): { bestValue: number; itemIds: string[] } {
  const n = items.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const { weight, value } = items[i - 1];
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (weight <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weight] + value);
    }
  }
  const ids: string[] = [];
  let w = capacity;
  for (let i = n; i >= 1; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      ids.unshift(items[i - 1].id);
      w -= items[i - 1].weight;
    }
  }
  return { bestValue: dp[n][capacity], itemIds: ids };
}

export function knapsackTotals(items: KnapsackItem[], ids: string[]) {
  const chosen = items.filter((it) => ids.includes(it.id));
  return {
    weight: chosen.reduce((s, it) => s + it.weight, 0),
    value: chosen.reduce((s, it) => s + it.value, 0),
    names: chosen.map((it) => it.name),
  };
}

export function evaluateKnapsack(q: KnapsackQuestion, selectedIds: string[]): Evaluation {
  const sol = solveKnapsackBruteForce(q.items, q.capacity);
  const nameOf = (ids: string[]) =>
    ids.length ? ids.map((id) => q.items.find((it) => it.id === id)?.name ?? id).join(' + ') : 'Nothing';
  const optimalLabel = sol.optimalSubsets.map((s) => nameOf(s.itemIds)).join(' or ');
  const selectedKey = [...selectedIds].sort().join('|');

  const ranked = [...sol.feasibleSubsets]
    .filter((s) => s.itemIds.length > 0)
    .sort((a, b) => b.value - a.value || a.weight - b.weight)
    .slice(0, 5);
  const selectedSubset = { ...knapsackTotals(q.items, selectedIds), ids: selectedIds };
  const inRanked = ranked.some((s) => [...s.itemIds].sort().join('|') === selectedKey);
  const rows: BreakdownRow[] = ranked.map((s) => ({
    label: nameOf(s.itemIds),
    metric: `${s.value} value · ${s.weight}/${q.capacity} weight`,
    feasible: true,
    optimal: s.value === sol.bestValue,
    selected: [...s.itemIds].sort().join('|') === selectedKey,
    note: s.value === sol.bestValue ? 'Maximum feasible value' : `${sol.bestValue - s.value} below optimum`,
  }));
  if (!inRanked && selectedIds.length > 0) {
    const feasible = selectedSubset.weight <= q.capacity;
    rows.push({
      label: nameOf(selectedIds),
      metric: `${selectedSubset.value} value · ${selectedSubset.weight}/${q.capacity} weight`,
      feasible,
      optimal: false,
      selected: true,
      note: feasible ? `${sol.bestValue - selectedSubset.value} below optimum` : 'Exceeds capacity',
    });
  }

  const base = {
    principle: q.lesson.principle,
    nextTime: q.lesson.nextTime,
    explanation: q.lesson.explanation,
    optimalLabel,
    optimalValue: sol.bestValue,
    unit: 'survival value',
    breakdown: rows,
  };

  const unique = new Set(selectedIds);
  const unknown = selectedIds.filter((id) => !q.items.some((it) => it.id === id));
  if (unique.size !== selectedIds.length || unknown.length > 0) {
    return {
      ...base,
      correct: false,
      selectedLabel: 'Invalid cargo manifest',
      headline: 'Invalid cargo selection',
      reason: 'Each supply can be loaded at most once (0 or 1), and only items Aeolus offered may be loaded.',
      discreetReason: 'Each supply can be loaded at most once (0 or 1), and only items Aeolus offered may be loaded.',
      playerValue: null,
    };
  }

  const { weight, value } = knapsackTotals(q.items, selectedIds);
  const selectedLabel = `${nameOf(selectedIds)} (weight ${weight}, value ${value})`;

  if (weight > q.capacity) {
    return {
      ...base,
      correct: false,
      selectedLabel,
      headline: 'The ship is overloaded',
      reason: `Your cargo weighs ${weight} units, but the ship can carry only ${q.capacity}. The capacity constraint Σ weight ≤ ${q.capacity} is violated, so this load is infeasible — the ship would sink. The best feasible cargo was ${optimalLabel}, worth ${sol.bestValue}.`,
      discreetReason: `Your cargo weighs ${weight} units, but the ship can carry only ${q.capacity}. The capacity constraint Σ weight ≤ ${q.capacity} is violated, so this load is infeasible — the ship would sink.`,
      playerValue: value,
    };
  }

  if (value === sol.bestValue) {
    return {
      ...base,
      correct: true,
      selectedLabel,
      headline: 'Optimal cargo',
      reason: q.lesson.explanation,
      discreetReason: q.lesson.explanation,
      playerValue: value,
    };
  }

  const best = sol.optimalSubsets[0];
  return {
    ...base,
    correct: false,
    selectedLabel,
    headline: 'A more valuable cargo existed',
    reason: `Your cargo fits (${weight}/${q.capacity}) but is worth only ${value}. ${nameOf(best.itemIds)} weighs ${best.weight} and is worth ${sol.bestValue}. The goal is the highest total value that still fits — not the heaviest load or the single most valuable item.`,
    discreetReason: `Your cargo fits (${weight}/${q.capacity}) but is worth only ${value}. Another combination that also fits is worth more. The goal is the highest total value within capacity — not the heaviest load, the most items, or the single most valuable item.`,
    playerValue: value,
  };
}

// ═════════════════════════════════════════════════════════════
// 3. SHORTEST PATH (directed, non-negative weights)
// ═════════════════════════════════════════════════════════════

export function findEdge(edges: GraphEdge[], from: string, to: string): GraphEdge | undefined {
  return edges.find((e) => e.from === from && e.to === to);
}

export function outgoing(edges: GraphEdge[], from: string): GraphEdge[] {
  return edges.filter((e) => e.from === from);
}

export interface DijkstraResult {
  distance: number;
  path: string[];
  distances: Record<string, number>;
  steps: DijkstraStep[];
}

export function dijkstra(nodeIds: string[], edges: GraphEdge[], start: string, goal: string): DijkstraResult {
  if (edges.some((e) => e.weight < 0)) throw new Error("Dijkstra's algorithm requires non-negative weights");
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();
  for (const id of nodeIds) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[start] = 0;
  const steps: DijkstraStep[] = [];
  const snapshot = () =>
    Object.fromEntries(nodeIds.map((id) => [id, Number.isFinite(dist[id]) ? dist[id] : null])) as Record<
      string,
      number | null
    >;

  while (visited.size < nodeIds.length) {
    // Select the unvisited node with the lowest tentative cost (ties broken by id order).
    let current: string | null = null;
    for (const id of nodeIds) {
      if (visited.has(id) || !Number.isFinite(dist[id])) continue;
      if (current === null || dist[id] < dist[current]) current = id;
    }
    if (current === null) break;
    visited.add(current);
    const updates: DijkstraUpdate[] = [];
    for (const e of outgoing(edges, current)) {
      if (visited.has(e.to)) continue;
      const candidate = dist[current] + e.weight;
      if (candidate < dist[e.to]) {
        updates.push({ node: e.to, from: Number.isFinite(dist[e.to]) ? dist[e.to] : null, to: candidate });
        dist[e.to] = candidate;
        prev[e.to] = current;
      }
    }
    steps.push({ visit: current, distance: dist[current], updates, table: snapshot() });
    if (current === goal) break;
  }

  const path: string[] = [];
  if (Number.isFinite(dist[goal])) {
    for (let at: string | null = goal; at !== null; at = prev[at]) path.unshift(at);
  }
  return { distance: dist[goal], path, distances: dist, steps };
}

export interface PathCheck {
  valid: boolean;
  cost: number;
  error?: string;
  legs: number[];
}

export function validatePath(q: ShortestPathQuestion, path: string[]): PathCheck {
  const fail = (error: string): PathCheck => ({ valid: false, cost: Number.NaN, error, legs: [] });
  if (path.length === 0) return fail('No route was charted.');
  const known = new Set(q.nodes.map((n) => n.id));
  const unknown = path.find((id) => !known.has(id));
  if (unknown) return fail(`"${unknown}" is not a location on the map.`);
  if (path[0] !== q.start) return fail(`A route must begin at ${q.start}.`);
  if (new Set(path).size !== path.length) return fail('A route may not visit the same location twice.');
  const legs: number[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const e = findEdge(q.edges, path[i], path[i + 1]);
    if (!e) return fail(`There is no sea route from ${path[i]} to ${path[i + 1]}. Routes are one-way and must follow the charted arrows.`);
    legs.push(e.weight);
  }
  if (path[path.length - 1] !== q.goal) return fail(`The route must end at ${q.goal}.`);
  return { valid: true, cost: legs.reduce((s, w) => s + w, 0), legs };
}

/** All simple directed paths from start to goal (small graphs only) — for the educational breakdown. */
export function enumeratePaths(edges: GraphEdge[], start: string, goal: string): { path: string[]; cost: number }[] {
  const out: { path: string[]; cost: number }[] = [];
  const walk = (node: string, path: string[], cost: number) => {
    if (node === goal) {
      out.push({ path: [...path], cost });
      return;
    }
    for (const e of outgoing(edges, node)) {
      if (path.includes(e.to)) continue;
      path.push(e.to);
      walk(e.to, path, cost + e.weight);
      path.pop();
    }
  };
  walk(start, [start], 0);
  return out.sort((a, b) => a.cost - b.cost || a.path.length - b.path.length);
}

export const routeLabel = (path: string[]) => path.join(' → ');

export function evaluatePath(q: ShortestPathQuestion, path: string[]): Evaluation {
  const nodeIds = q.nodes.map((n) => n.id);
  const best = dijkstra(nodeIds, q.edges, q.start, q.goal);
  const routes = enumeratePaths(q.edges, q.start, q.goal);
  const selectedKey = path.join('>');
  const rows: BreakdownRow[] = routes.map((r) => ({
    label: routeLabel(r.path),
    metric: `cost ${r.cost}`,
    feasible: true,
    optimal: r.cost === best.distance,
    selected: r.path.join('>') === selectedKey,
    note:
      r.path
        .slice(1)
        .map((to, i) => findEdge(q.edges, r.path[i], to)?.weight ?? 0)
        .join(' + ') + ` = ${r.cost}`,
  }));
  const optimalRoutes = routes.filter((r) => r.cost === best.distance);
  const base = {
    principle: q.lesson.principle,
    nextTime: q.lesson.nextTime,
    explanation: q.lesson.explanation,
    optimalLabel: optimalRoutes.map((r) => routeLabel(r.path)).join(' or '),
    optimalValue: best.distance,
    unit: 'cost',
    breakdown: rows,
    dijkstra: best.steps,
    optimalPath: best.path,
  };

  const check = validatePath(q, path);
  if (!check.valid) {
    return {
      ...base,
      correct: false,
      selectedLabel: path.length ? routeLabel(path) : 'No route',
      headline: 'Invalid route',
      reason: check.error ?? 'Invalid route.',
      discreetReason: check.error ?? 'Invalid route.',
      playerValue: null,
    };
  }
  const selectedLabel = `${routeLabel(path)} (cost ${check.legs.join(' + ')} = ${check.cost})`;
  if (check.cost === best.distance) {
    return {
      ...base,
      correct: true,
      selectedLabel,
      headline: 'Shortest route found',
      reason: q.lesson.explanation,
      discreetReason: q.lesson.explanation,
      playerValue: check.cost,
    };
  }
  const playerFirst = check.legs[0];
  const bestFirst = findEdge(q.edges, best.path[0], best.path[1])?.weight ?? 0;
  const tip =
    path.length < best.path.length
      ? 'Fewer stops does not mean a lower total — every edge weight along the way must be added.'
      : playerFirst < bestFirst
        ? `Your first leg (cost ${playerFirst}) was cheaper than the best route’s first leg (${bestFirst}), but a cheap start can lead into expensive waters. Compare whole-journey totals.`
        : 'Add up every edge weight on each candidate route and compare the complete totals.';
  return {
    ...base,
    correct: false,
    selectedLabel,
    headline: 'A cheaper route existed',
    reason: `Your route reaches ${q.goal}, but costs ${check.cost}. The route ${routeLabel(best.path)} costs only ${best.distance}. ${tip}`,
    discreetReason: `Your route reaches ${q.goal}, but costs ${check.cost} (${check.legs.join(' + ')}). A cheaper route exists. ${
      path.length < best.path.length
        ? 'Fewer stops does not mean a lower total — every edge weight along the way must be added.'
        : playerFirst < bestFirst
          ? 'A cheap first leg can lead into expensive waters later — compare whole-journey totals.'
          : 'Add up every edge weight on each candidate route and compare the complete totals.'
    }`,
    playerValue: check.cost,
  };
}

// ═════════════════════════════════════════════════════════════
// Dispatch
// ═════════════════════════════════════════════════════════════

export function evaluateQuiz(q: QuizQuestion, optionId: string): Evaluation {
  const selected = q.options.find((o) => o.id === optionId);
  const correct = selected?.id === q.correctOptionId;
  return {
    correct,
    selectedLabel: selected?.label ?? 'No valid answer',
    headline: correct ? 'Correct answer' : 'Try this concept again',
    reason: selected?.explanation ?? 'Choose one of the available answers.',
    discreetReason: correct ? q.lesson.explanation : (selected?.explanation ?? 'That answer does not match the calculus rule. Review the worked solution or Athena’s step-by-step hints.'),
    principle: q.lesson.principle,
    nextTime: q.lesson.nextTime,
    explanation: q.lesson.explanation,
    workedSolution: q.lesson.workedSolution,
    optimalLabel: q.options.find((o) => o.id === q.correctOptionId)!.label,
    optimalValue: 1,
    playerValue: selected ? Number(correct) : null,
    unit: 'answer',
    breakdown: q.options.map((o) => ({
      label: o.label, metric: o.id === q.correctOptionId ? 'Correct' : 'Incorrect',
      feasible: true, optimal: o.id === q.correctOptionId, selected: o.id === optionId, note: o.explanation,
    })),
  };
}

export function evaluateAnswer(q: Question, answer: Answer): Evaluation {
  if (q.kind === 'quiz' && answer.kind === 'quiz') return evaluateQuiz(q, answer.optionId);
  if (q.kind === 'choice' && answer.kind === 'choice') return evaluateChoice(q, answer.optionId);
  if (q.kind === 'knapsack' && answer.kind === 'knapsack') return evaluateKnapsack(q, answer.itemIds);
  if (q.kind === 'graph' && answer.kind === 'graph') return evaluatePath(q, answer.path);
  // Mismatched answer types are never correct.
  const fallback =
    q.kind === 'quiz' ? evaluateQuiz(q, '') : q.kind === 'choice' ? evaluateChoice(q, '') : q.kind === 'knapsack' ? evaluateKnapsack(q, ['__invalid__']) : evaluatePath(q, []);
  return {
    ...fallback,
    correct: false,
    headline: 'Invalid answer',
    reason: 'The submitted answer does not fit this challenge.',
    discreetReason: 'The submitted answer does not fit this challenge.',
  };
}

/** Produce one mathematically optimal answer for a question (used by tests and demo tooling). */
export function optimalAnswer(q: Question): Answer {
  if (q.kind === 'quiz') return { kind: 'quiz', optionId: q.correctOptionId };
  if (q.kind === 'choice') return { kind: 'choice', optionId: solveChoice(q).optimalIds[0] };
  if (q.kind === 'knapsack') return { kind: 'knapsack', itemIds: solveKnapsackBruteForce(q.items, q.capacity).optimalSubsets[0].itemIds };
  return { kind: 'graph', path: dijkstra(q.nodes.map((n) => n.id), q.edges, q.start, q.goal).path };
}

/** Produce a deliberately non-optimal answer for a question (used by tests). */
export function suboptimalAnswer(q: Question): Answer {
  if (q.kind === 'quiz') return { kind: 'quiz', optionId: q.options.find((o) => o.id !== q.correctOptionId)!.id };
  if (q.kind === 'choice') {
    const sol = solveChoice(q);
    return { kind: 'choice', optionId: q.options.find((o) => !sol.optimalIds.includes(o.id))!.id };
  }
  if (q.kind === 'knapsack') {
    const sol = solveKnapsackBruteForce(q.items, q.capacity);
    const worse = sol.feasibleSubsets.find((s) => s.itemIds.length > 0 && s.value < sol.bestValue)!;
    return { kind: 'knapsack', itemIds: worse.itemIds };
  }
  const best = dijkstra(q.nodes.map((n) => n.id), q.edges, q.start, q.goal).distance;
  const worse = enumeratePaths(q.edges, q.start, q.goal).find((r) => r.cost > best)!;
  return { kind: 'graph', path: worse.path };
}
