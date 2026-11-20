import type { QuizQuestion } from '../game/types';
import { profileSignature } from './spacedRepetition';
import { getCachedVariant, saveCachedVariant } from './storage';
import type { PersonalizedVariant, UserProfile } from './types';

export interface PersonalizeResult {
  variant?: PersonalizedVariant;
  cached?: boolean;
  error?: string;
}

/**
 * Request an AI-personalized Calculus I scenario from the server-side Gemini endpoint.
 * Never swallows errors silently: returns a descriptive error message when the server/API is unavailable.
 */
export async function requestPersonalizedQuestion(
  question: QuizQuestion,
  profile: UserProfile,
  opts?: { forceRefresh?: boolean; includeImportedTags?: boolean },
): Promise<PersonalizeResult> {
  const sanitizedProfile: UserProfile = opts?.includeImportedTags
    ? profile
    : { ...profile, importedPlatforms: { youtube: [], instagram: [], spotify: [] } };

  const hash = profileSignature(sanitizedProfile);
  if (!opts?.forceRefresh) {
    const cached = getCachedVariant(question.id, hash);
    if (cached) return { variant: cached, cached: true };
  }

  const importedTags = [
    ...sanitizedProfile.importedPlatforms.youtube,
    ...sanitizedProfile.importedPlatforms.instagram,
    ...sanitizedProfile.importedPlatforms.spotify,
    ...(sanitizedProfile.customNotes.trim() ? [sanitizedProfile.customNotes.trim()] : []),
  ];

  try {
    const res = await fetch('/api/ai/personalize-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: {
          id: question.id,
          chapterId: question.chapterId,
          topic: question.topic,
          difficulty: question.difficulty,
          title: question.title,
          story: question.story,
          teaching: question.teaching,
          objectiveText: question.objectiveText,
          options: question.options,
          correctOptionId: question.correctOptionId,
          hints: question.lesson.hints ?? [question.lesson.hint],
          workedSolution: question.lesson.workedSolution ?? [],
        },
        profile: {
          displayName: sanitizedProfile.displayName,
          ageGroup: sanitizedProfile.ageBracket,
          hobbies: sanitizedProfile.hobbies,
          favoriteCreators: sanitizedProfile.favoriteCreators,
          musicGenres: sanitizedProfile.musicGenres,
          sportsAndGames: sanitizedProfile.sportsAndGames,
          personalGoals: sanitizedProfile.personalGoals,
          importedTags,
          learningStyle: 'real-world-challenges',
        },
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      variant?: {
        title: string;
        hookTag: string;
        story: string[];
        teaching: string;
        objectiveText: string;
        options: QuizQuestion['options'];
        hints: string[];
        workedSolution: string[];
      };
    };

    if (!res.ok || !data.variant) {
      return {
        error: data.error || `Personalization service returned HTTP ${res.status}. You can still solve the classic Calculus I version.`,
      };
    }

    const variant: PersonalizedVariant = {
      questionId: question.id,
      profileHash: hash,
      createdAt: Date.now(),
      title: data.variant.title,
      hookTag: data.variant.hookTag,
      story: data.variant.story,
      teaching: data.variant.teaching,
      objectiveText: data.variant.objectiveText,
      options: data.variant.options,
      hints: data.variant.hints,
      workedSolution: data.variant.workedSolution,
    };
    saveCachedVariant(variant);
    return { variant, cached: false };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unable to reach the AI personalization server.',
    };
  }
}
