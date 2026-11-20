import { CHAPTERS } from '../data/chapters';
import { getQuestion, QUESTIONS } from '../data/questions';
import type { QuizQuestion } from '../game/types';
import type { MasteryMap, MasteryRecord, PersonalizedVariant, UnitMasterySummary, UserProfile } from './types';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export interface AttemptInput {
  questionId: number;
  isCorrect: boolean;
  solveMs: number;
  usedHint?: boolean;
  now?: number;
}

/**
 * Compute a deterministic lightweight hash of the profile fields sent to the AI
 * so cached personalized variants automatically refresh when the user updates interests.
 */
export function profileSignature(profile: UserProfile): string {
  const payload = [
    profile.ageBracket,
    ...profile.hobbies,
    ...profile.favoriteCreators,
    ...profile.musicGenres,
    ...profile.sportsAndGames,
    ...profile.personalGoals,
    ...profile.importedPlatforms.youtube,
    ...profile.importedPlatforms.instagram,
    ...profile.importedPlatforms.spotify,
    profile.customNotes.trim(),
  ]
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean)
    .join('|');
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Pure SM-2-inspired spaced-repetition update.
 * - Incorrect answers reset streak, mark the concept weak, and schedule a short in-session review (2 min).
 * - Correct answers with hints or slow solve times (>45s) grow interval conservatively.
 * - Fast, unassisted correct answers grow interval exponentially for long-term retention.
 */
export function recordAttempt(map: MasteryMap, input: AttemptInput): MasteryMap {
  const now = input.now ?? Date.now();
  const q = getQuestion(input.questionId);
  const clampedSolveMs = Math.max(500, Math.min(input.solveMs, 10 * MINUTE_MS));
  const prev = map[input.questionId];

  const attempts = (prev?.attempts ?? 0) + 1;
  const correct = (prev?.correct ?? 0) + (input.isCorrect ? 1 : 0);
  const avgSolveMs = prev ? Math.round((prev.avgSolveMs * prev.attempts + clampedSolveMs) / attempts) : Math.round(clampedSolveMs);

  // Quality grade 1..5
  let quality = 2;
  if (input.isCorrect) {
    if (input.usedHint) quality = 3;
    else if (clampedSolveMs > 45_000) quality = 4;
    else quality = 5;
  } else {
    quality = 1;
  }

  const prevEase = prev?.easeFactor ?? 2.3;
  const nextEase = Math.max(1.3, Math.min(2.8, Number((prevEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))).toFixed(2))));

  let streak: number;
  let intervalMs: number;
  let weak: boolean;

  if (!input.isCorrect) {
    streak = 0;
    intervalMs = 2 * MINUTE_MS;
    weak = true;
  } else {
    streak = (prev?.streak ?? 0) + 1;
    if (streak === 1) {
      intervalMs = input.usedHint ? 4 * MINUTE_MS : 15 * MINUTE_MS;
    } else if (streak === 2) {
      intervalMs = input.usedHint ? 15 * MINUTE_MS : 2 * HOUR_MS;
    } else {
      const base = prev?.intervalMs ?? 2 * HOUR_MS;
      intervalMs = Math.min(7 * 24 * HOUR_MS, Math.round(base * nextEase));
    }
    const accuracy = correct / attempts;
    weak = accuracy < 0.7 || (input.usedHint === true && streak < 2);
  }

  const nextRecord: MasteryRecord = {
    questionId: input.questionId,
    chapterId: q.chapterId,
    attempts,
    correct,
    streak,
    easeFactor: nextEase,
    intervalMs,
    nextReviewAt: now + intervalMs,
    lastAttemptAt: now,
    avgSolveMs,
    weak,
  };

  return { ...map, [input.questionId]: nextRecord };
}

/**
 * Returns mastery records that are due for spaced-repetition review, sorted by urgency:
 * weak items first, then most overdue first.
 */
export function getDueReviews(map: MasteryMap, now: number = Date.now()): MasteryRecord[] {
  return Object.values(map)
    .filter((rec) => rec.weak || rec.nextReviewAt <= now)
    .sort((a, b) => {
      if (a.weak !== b.weak) return a.weak ? -1 : 1;
      const aOverdue = now - a.nextReviewAt;
      const bOverdue = now - b.nextReviewAt;
      return bOverdue - aOverdue;
    });
}

/** Pick the single highest-priority due review question ID, or null if caught up. */
export function pickDueReviewQuestionId(map: MasteryMap, now: number = Date.now()): number | null {
  const due = getDueReviews(map, now);
  return due.length > 0 ? due[0].questionId : null;
}

/** Aggregate retention metrics for one Calculus I unit (chapter 1..6). */
export function getUnitMastery(map: MasteryMap, chapterId: number, now: number = Date.now()): UnitMasterySummary {
  const chapter = CHAPTERS.find((c) => c.id === chapterId) ?? CHAPTERS[0];
  const qIds = chapter.questionIds;
  const recs = qIds.map((id) => map[id]).filter((r): r is MasteryRecord => !!r);

  const totalAttempts = recs.reduce((s, r) => s + r.attempts, 0);
  const totalCorrect = recs.reduce((s, r) => s + r.correct, 0);
  const accuracyPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const avgSolveMs = recs.length > 0 ? Math.round(recs.reduce((s, r) => s + r.avgSolveMs, 0) / recs.length) : 0;
  const masteredCount = recs.filter((r) => r.streak >= 1 && !r.weak && r.correct / r.attempts >= 0.7).length;
  const weakQuestionIds = recs.filter((r) => r.weak).map((r) => r.questionId);
  const dueCount = recs.filter((r) => r.weak || r.nextReviewAt <= now).length;

  return {
    chapterId: chapter.id,
    numeral: chapter.numeral,
    unitName: chapter.unitLabel.replace(/^Unit \d+:\s*/i, ''),
    totalQuestions: qIds.length,
    attemptedCount: recs.length,
    masteredCount,
    accuracyPct,
    avgSolveMs,
    dueCount,
    weakQuestionIds,
  };
}

export function getAllUnitMastery(map: MasteryMap, now: number = Date.now()): UnitMasterySummary[] {
  return CHAPTERS.map((c) => getUnitMastery(map, c.id, now));
}

/** Overall retention score across all attempted problems. */
export function overallRetentionStats(map: MasteryMap, now: number = Date.now()) {
  const recs = Object.values(map);
  const totalAttempts = recs.reduce((s, r) => s + r.attempts, 0);
  const totalCorrect = recs.reduce((s, r) => s + r.correct, 0);
  const due = getDueReviews(map, now);
  return {
    attemptedUnique: recs.length,
    totalCurriculum: QUESTIONS.length,
    accuracyPct: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    dueCount: due.length,
    weakCount: recs.filter((r) => r.weak).length,
  };
}

/**
 * Safely apply an AI-generated personalized variant onto a base Calculus I QuizQuestion.
 * Preserves the exact question ID, chapter ID, and correctOptionId so scoring remains deterministic.
 */
export function applyVariantToQuestion(base: QuizQuestion, variant: PersonalizedVariant | null | undefined): QuizQuestion {
  if (!variant || variant.questionId !== base.id) return base;
  const optionMap = new Map(variant.options.map((o) => [o.id, o]));
  const mergedOptions = base.options.map((opt) => {
    const replacement = optionMap.get(opt.id);
    if (!replacement || !replacement.label.trim()) return opt;
    return {
      ...opt,
      label: replacement.label,
      explanation: replacement.explanation?.trim() || opt.explanation,
    };
  });

  return {
    ...base,
    title: variant.title.trim() || base.title,
    personalizedHook: variant.hookTag.trim() || 'Personalized Scenario',
    story: variant.story.length > 0 ? variant.story : base.story,
    teaching: variant.teaching.trim() || base.teaching,
    objectiveText: variant.objectiveText.trim() || base.objectiveText,
    options: mergedOptions,
    lesson: {
      ...base.lesson,
      hint: variant.hints[0]?.trim() || base.lesson.hint,
      hints: variant.hints.length > 0 ? variant.hints : base.lesson.hints,
      workedSolution: variant.workedSolution.length > 0 ? variant.workedSolution : base.lesson.workedSolution,
    },
  };
}
