import type { AiTransferSkin, CompassProfile, Quest } from '../curriculum/types';
import { buildGentleVisualNudge, evaluateSimulation } from './simulationMath';

const TRANSFER_CACHE_KEY = 'odyssey.aiTransferCache.v1';

function readCache(): Record<string, AiTransferSkin> {
  try {
    const raw = window.localStorage.getItem(TRANSFER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AiTransferSkin>) : {};
  } catch {
    return {};
  }
}

function writeCache(map: Record<string, AiTransferSkin>): void {
  try {
    window.localStorage.setItem(TRANSFER_CACHE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function cacheKey(questId: string, profile: CompassProfile): string {
  const interests = [...profile.interests, profile.customInterest]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
  return `${questId}::${profile.archetype}::${interests}`;
}

export function getCuratedFallbackSkin(quest: Quest): AiTransferSkin {
  const def = quest.defaultTransferScenario;
  return {
    questId: quest.id,
    hookTag: def?.hookTag ?? quest.conceptName,
    title: def?.title ?? quest.title,
    story: def?.story ?? quest.invitation,
    symbolicNote: quest.symbolicBridgeNote,
    realWorldTakeaway: def?.realWorldTakeaway ?? quest.symbolicBridgeNote,
    source: 'curated-fallback',
    generatedAt: Date.now(),
  };
}

export async function requestQuestTransferSkin(
  quest: Quest,
  profile: CompassProfile,
  forceRefresh = false,
): Promise<{ skin: AiTransferSkin; notice?: string }> {
  const key = cacheKey(quest.id, profile);
  if (!forceRefresh) {
    const cached = readCache()[key];
    if (cached) return { skin: cached };
  }

  try {
    const res = await fetch('/api/ai/personalize-quest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quest: {
          id: quest.id,
          realmId: quest.realmId,
          conceptName: quest.conceptName,
          title: quest.title,
          invitation: quest.invitation,
          symbolicEquation: quest.symbolicEquation,
          symbolicBridgeNote: quest.symbolicBridgeNote,
          physicalGoal: quest.simulation.physicalGoal,
        },
        profile: {
          displayName: profile.displayName,
          archetype: profile.archetype,
          calmChallengeDial: profile.calmChallengeDial,
          interests: [...profile.interests, profile.customInterest].filter(Boolean),
        },
      }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        skin: getCuratedFallbackSkin(quest),
        notice: payload.error || 'Using curated real-world scenario while live AI is offline.',
      };
    }

    const data = (await res.json()) as { skin: AiTransferSkin };
    if (!data?.skin) {
      return {
        skin: getCuratedFallbackSkin(quest),
        notice: 'Using curated real-world scenario.',
      };
    }

    const all = readCache();
    all[key] = data.skin;
    writeCache(all);
    return { skin: data.skin };
  } catch {
    return {
      skin: getCuratedFallbackSkin(quest),
      notice: 'Using curated real-world scenario (offline mode).',
    };
  }
}

export async function requestGentleOracleNudge(
  quest: Quest,
  values: Record<string, number>,
  profile: CompassProfile,
): Promise<{ text: string; source: 'gemini' | 'visual-fallback' }> {
  const fallbackText = buildGentleVisualNudge(quest, values, profile.calmChallengeDial);

  if (!profile.allowOracleNudges) {
    return { text: fallbackText, source: 'visual-fallback' };
  }

  const outcome = evaluateSimulation(quest.simulation, values);
  try {
    const res = await fetch('/api/ai/oracle-nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questTitle: quest.title,
        conceptName: quest.conceptName,
        hideFormula: quest.hideFormulaInitially,
        physicalGoal: quest.simulation.physicalGoal,
        direction: outcome.direction,
        readout: `${outcome.readoutLabel}: ${outcome.readoutValue}`,
        calmChallengeDial: profile.calmChallengeDial,
        archetype: profile.archetype,
      }),
    });
    if (!res.ok) {
      return { text: fallbackText, source: 'visual-fallback' };
    }
    const data = (await res.json()) as { nudge?: string };
    if (data?.nudge?.trim()) {
      return { text: data.nudge.trim(), source: 'gemini' };
    }
    return { text: fallbackText, source: 'visual-fallback' };
  } catch {
    return { text: fallbackText, source: 'visual-fallback' };
  }
}
