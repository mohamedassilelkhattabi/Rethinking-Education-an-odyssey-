import {
  DEFAULT_CONSENT,
  DEFAULT_PROFILE,
  type ConsentSettings,
  type MasteryMap,
  type PersonalizedVariant,
  type UserProfile,
} from './types';

const CONSENT_KEY = 'odyssey/consent/v1';
const PROFILE_KEY = 'odyssey/profile/v1';
const MASTERY_KEY = 'odyssey/mastery/v1';
const VARIANTS_KEY = 'odyssey/ai-variants/v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(custom?: StorageLike | null): StorageLike | null {
  if (custom !== undefined) return custom;
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadConsent(storage?: StorageLike | null): ConsentSettings {
  const s = getStorage(storage);
  if (!s) return { ...DEFAULT_CONSENT };
  try {
    const raw = s.getItem(CONSENT_KEY);
    if (!raw) return { ...DEFAULT_CONSENT };
    const parsed = JSON.parse(raw) as Partial<ConsentSettings>;
    return {
      decided: Boolean(parsed.decided),
      allowAiPersonalization: parsed.allowAiPersonalization ?? true,
      allowInterestImport: parsed.allowInterestImport ?? true,
      allowMasteryTracking: parsed.allowMasteryTracking ?? true,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : null,
    };
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

export function saveConsent(consent: ConsentSettings, storage?: StorageLike | null): void {
  const s = getStorage(storage);
  if (!s) return;
  try {
    s.setItem(CONSENT_KEY, JSON.stringify({ ...consent, updatedAt: Date.now() }));
  } catch {
    /* ignore quota errors */
  }
}

export function loadProfile(storage?: StorageLike | null): UserProfile {
  const s = getStorage(storage);
  if (!s) return { ...DEFAULT_PROFILE, importedPlatforms: { ...DEFAULT_PROFILE.importedPlatforms } };
  try {
    const raw = s.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE, importedPlatforms: { ...DEFAULT_PROFILE.importedPlatforms } };
    const p = JSON.parse(raw) as Partial<UserProfile>;
    return {
      displayName: typeof p.displayName === 'string' && p.displayName.trim() ? p.displayName : DEFAULT_PROFILE.displayName,
      ageBracket: p.ageBracket === '15' || p.ageBracket === '16' || p.ageBracket === '17' ? p.ageBracket : '16',
      hobbies: Array.isArray(p.hobbies) ? p.hobbies : [...DEFAULT_PROFILE.hobbies],
      favoriteCreators: Array.isArray(p.favoriteCreators) ? p.favoriteCreators : [...DEFAULT_PROFILE.favoriteCreators],
      musicGenres: Array.isArray(p.musicGenres) ? p.musicGenres : [...DEFAULT_PROFILE.musicGenres],
      sportsAndGames: Array.isArray(p.sportsAndGames) ? p.sportsAndGames : [...DEFAULT_PROFILE.sportsAndGames],
      personalGoals: Array.isArray(p.personalGoals) ? p.personalGoals : [...DEFAULT_PROFILE.personalGoals],
      importedPlatforms: {
        youtube: Array.isArray(p.importedPlatforms?.youtube) ? p.importedPlatforms.youtube : [],
        instagram: Array.isArray(p.importedPlatforms?.instagram) ? p.importedPlatforms.instagram : [],
        spotify: Array.isArray(p.importedPlatforms?.spotify) ? p.importedPlatforms.spotify : [],
      },
      customNotes: typeof p.customNotes === 'string' ? p.customNotes : '',
    };
  } catch {
    return { ...DEFAULT_PROFILE, importedPlatforms: { ...DEFAULT_PROFILE.importedPlatforms } };
  }
}

export function saveProfile(profile: UserProfile, storage?: StorageLike | null): void {
  const s = getStorage(storage);
  if (!s) return;
  try {
    s.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function loadMastery(storage?: StorageLike | null): MasteryMap {
  const s = getStorage(storage);
  if (!s) return {};
  try {
    const raw = s.getItem(MASTERY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MasteryMap;
  } catch {
    return {};
  }
}

export function saveMastery(map: MasteryMap, storage?: StorageLike | null): void {
  const s = getStorage(storage);
  if (!s) return;
  try {
    s.setItem(MASTERY_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function loadCachedVariants(storage?: StorageLike | null): Record<string, PersonalizedVariant> {
  const s = getStorage(storage);
  if (!s) return {};
  try {
    const raw = s.getItem(VARIANTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PersonalizedVariant>;
  } catch {
    return {};
  }
}

export function saveCachedVariant(variant: PersonalizedVariant, storage?: StorageLike | null): void {
  const s = getStorage(storage);
  if (!s) return;
  try {
    const existing = loadCachedVariants(s);
    const key = `${variant.questionId}:${variant.profileHash}`;
    existing[key] = variant;
    s.setItem(VARIANTS_KEY, JSON.stringify(existing));
  } catch {
    /* ignore */
  }
}

export function getCachedVariant(questionId: number, profileHash: string, storage?: StorageLike | null): PersonalizedVariant | null {
  const all = loadCachedVariants(storage);
  return all[`${questionId}:${profileHash}`] ?? null;
}

export function clearAllPersonalizationData(storage?: StorageLike | null): void {
  const s = getStorage(storage);
  if (!s) return;
  try {
    s.removeItem(PROFILE_KEY);
    s.removeItem(MASTERY_KEY);
    s.removeItem(VARIANTS_KEY);
    s.setItem(
      CONSENT_KEY,
      JSON.stringify({
        decided: true,
        allowAiPersonalization: false,
        allowInterestImport: false,
        allowMasteryTracking: false,
        updatedAt: Date.now(),
      }),
    );
  } catch {
    /* ignore */
  }
}
