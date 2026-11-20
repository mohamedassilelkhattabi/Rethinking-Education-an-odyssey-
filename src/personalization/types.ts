import type { QuizQuestion } from '../game/types';

export interface ConsentSettings {
  decided: boolean;
  allowAiPersonalization: boolean;
  allowInterestImport: boolean;
  allowMasteryTracking: boolean;
  updatedAt: number | null;
}

export interface ImportedPlatformTags {
  youtube: string[];
  instagram: string[];
  spotify: string[];
}

export interface UserProfile {
  displayName: string;
  ageBracket: '15' | '16' | '17';
  hobbies: string[];
  favoriteCreators: string[];
  musicGenres: string[];
  sportsAndGames: string[];
  personalGoals: string[];
  importedPlatforms: ImportedPlatformTags;
  customNotes: string;
}

export interface MasteryRecord {
  questionId: number;
  chapterId: number;
  attempts: number;
  correct: number;
  streak: number;
  easeFactor: number;
  intervalMs: number;
  nextReviewAt: number;
  lastAttemptAt: number;
  avgSolveMs: number;
  weak: boolean;
}

export type MasteryMap = Record<number, MasteryRecord>;

export interface UnitMasterySummary {
  chapterId: number;
  numeral: string;
  unitName: string;
  totalQuestions: number;
  attemptedCount: number;
  masteredCount: number;
  accuracyPct: number;
  avgSolveMs: number;
  dueCount: number;
  weakQuestionIds: number[];
}

export interface PersonalizedVariant {
  questionId: number;
  profileHash: string;
  createdAt: number;
  title: string;
  hookTag: string;
  story: string[];
  teaching: string;
  objectiveText: string;
  options: QuizQuestion['options'];
  hints: string[];
  workedSolution: string[];
}

export const DEFAULT_CONSENT: ConsentSettings = {
  decided: false,
  allowAiPersonalization: true,
  allowInterestImport: true,
  allowMasteryTracking: true,
  updatedAt: null,
};

export const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Alex',
  ageBracket: '16',
  hobbies: ['Gaming', 'Video Editing', 'Music Production'],
  favoriteCreators: ['MrBeast', 'Mark Rober', '3Blue1Brown'],
  musicGenres: ['Lo-Fi Beats', 'Hip-Hop', 'Indie Pop'],
  sportsAndGames: ['Valorant', 'Basketball', 'Minecraft'],
  personalGoals: ['Ace AP Calculus AB', 'Build an indie game'],
  importedPlatforms: {
    youtube: [],
    instagram: [],
    spotify: [],
  },
  customNotes: '',
};
