// ─────────────────────────────────────────────────────────────
// Core domain types for ODYSSEY: THE PATH TO ITHACA (Calculus I Edition)
// ─────────────────────────────────────────────────────────────

export type ScreenId =
  | 'title'
  | 'howToPlay'
  | 'intro'
  | 'map'
  | 'chapterIntro'
  | 'challenge'
  | 'correct'
  | 'failure'
  | 'chapterComplete'
  | 'victory'
  | 'review'
  | 'demo';

export type ChapterTheme = 'lotus' | 'cyclops' | 'aeolus' | 'sirens' | 'passage' | 'ithaca';

export type ObjectiveSense = 'maximize' | 'minimize';

/** Names an icon in the UI icon registry (kept as a string so data stays framework-free). */
export type IconKey = string;

// ── Multiple-choice optimization ─────────────────────────────

export interface AttributeDef {
  key: string;
  label: string;
  unit: string;
  icon: IconKey;
}

export type Metric =
  | { kind: 'attribute'; key: string }
  | { kind: 'ratio'; numerator: string; denominator: string };

export interface Objective {
  sense: ObjectiveSense;
  metric: Metric;
  label: string;
  unit: string;
}

export type ConstraintOp = '<=' | '>=' | '==';

export interface Constraint {
  key: string;
  op: ConstraintOp;
  limit: number;
  label: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  description: string;
  icon: IconKey;
  attributes: Record<string, number>;
}

export interface Lesson {
  explanation: string;
  hint: string;
  /** Progressive multi-step interactive hints (Strategy -> Formula -> Calculation). */
  hints?: string[];
  /** Complete step-by-step LaTeX worked solution. */
  workedSolution?: string[];
  principle: string;
  nextTime: string;
}

interface QuestionBase {
  id: number;
  chapterId: number;
  title: string;
  story: string[];
  objectiveText: string;
  lesson: Lesson;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  kind: 'choice';
  visual: 'cards' | 'trails';
  objective: Objective;
  attributes: AttributeDef[];
  constraints: Constraint[];
  options: ChoiceOption[];
}

// ── 0/1 Knapsack ─────────────────────────────────────────────

export interface KnapsackItem {
  id: string;
  name: string;
  weight: number;
  value: number;
  icon: IconKey;
  flavor: string;
}

export interface KnapsackQuestion extends QuestionBase {
  kind: 'knapsack';
  capacity: number;
  items: KnapsackItem[];
}

// ── Shortest path ────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  role: 'start' | 'island' | 'goal';
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  curve?: number;
  labelT?: number;
}

export interface GraphHazard {
  kind: 'scylla' | 'charybdis' | 'rocks';
  x: number;
  y: number;
}

export interface ShortestPathQuestion extends QuestionBase {
  kind: 'graph';
  nodes: GraphNode[];
  edges: GraphEdge[];
  start: string;
  goal: string;
  hazards?: GraphHazard[];
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuizQuestion extends QuestionBase {
  kind: 'quiz';
  difficulty: Difficulty;
  topic: string;
  unitName: string;
  subtopics: string[];
  formulaRef?: string;
  teaching: string;
  code?: string;
  expectedBehavior?: string;
  options: { id: string; label: string; explanation: string }[];
  correctOptionId: string;
  /** Optional tag when personalized via Gemini AI. */
  personalizedHook?: string;
}

export type Question = QuizQuestion | MultipleChoiceQuestion | KnapsackQuestion | ShortestPathQuestion;
export type QuestionKind = Question['kind'];

// ── Answers ──────────────────────────────────────────────────

export type Answer =
  | { kind: 'quiz'; optionId: string }
  | { kind: 'choice'; optionId: string }
  | { kind: 'knapsack'; itemIds: string[] }
  | { kind: 'graph'; path: string[] };

// ── Evaluation (pure, JSON-serialisable) ─────────────────────

export interface BreakdownRow {
  label: string;
  metric: string;
  feasible: boolean;
  optimal: boolean;
  selected: boolean;
  note: string;
}

export interface DijkstraUpdate {
  node: string;
  from: number | null;
  to: number;
}

export interface DijkstraStep {
  visit: string;
  distance: number;
  updates: DijkstraUpdate[];
  table: Record<string, number | null>;
}

export interface Evaluation {
  correct: boolean;
  selectedLabel: string;
  headline: string;
  reason: string;
  discreetReason: string;
  principle: string;
  nextTime: string;
  explanation: string;
  workedSolution?: string[];
  optimalLabel: string;
  optimalValue: number;
  playerValue: number | null;
  unit: string;
  breakdown: BreakdownRow[];
  dijkstra?: DijkstraStep[];
  optimalPath?: string[];
}

// ── Chapters ─────────────────────────────────────────────────

export interface ResourceEffect {
  supplies?: number;
  elapsedTime?: number;
  crew?: number;
}

export interface Chapter {
  id: number;
  numeral: string;
  unitLabel: string;
  title: string;
  location: string;
  difficulty: Difficulty;
  focus: string[];
  theme: ChapterTheme;
  intro: string[];
  completion: string[];
  questionIds: [number, number, number];
  completionEffect: ResourceEffect;
  completionEffectText: string;
  badge: { name: string; description: string; icon: IconKey };
}

// ── Game state ───────────────────────────────────────────────

export interface Resources {
  crew: number;
  supplies: number;
  elapsedTime: number;
}

export interface QuestionResult {
  questionId: number;
  xp: number;
  usedHint: boolean;
}

export interface ChapterRecord {
  xp: number;
  hintsUsed: number;
  attemptsToComplete: number;
}

export interface Outcome {
  questionId: number;
  chapterId: number;
  questionIndex: number;
  correct: boolean;
  evaluation: Evaluation;
  xpEarned: number;
  usedHint: boolean;
  attemptNumber: number;
  streakBefore: number;
  temporaryXPLost: number;
  chapterCompleted: boolean;
  chapterXPAwarded: number;
  resourceDelta: ResourceEffect;
  replay: boolean;
}

export interface GameState {
  version: 1;
  screen: ScreenId;
  previousScreen: ScreenId;
  currentChapter: number;
  currentQuestion: number;
  completedChapters: number[];
  currentStreak: number;
  chapterAttempts: Record<number, number>;
  permanentXP: number;
  temporaryXP: number;
  crew: number;
  supplies: number;
  elapsedTime: number;
  chapterStartResources: Resources;
  hintsUsed: Record<number, boolean>;
  totalHintsUsed: number;
  totalFailures: number;
  completedQuestionIds: number[];
  attemptResults: QuestionResult[];
  chapterRecords: Record<number, ChapterRecord>;
  lastOutcome: Outcome | null;
  pendingShipMove: { from: number; to: number } | null;
  isReplay: boolean;
  introSeen: boolean;
}
