import { QUESTS_REALMS_1_TO_3 } from './questsPart1';
import { QUESTS_REALMS_4_TO_6 } from './questsPart2';
import type { Quest, RealmId, StageNumber } from './types';

export const QUESTS_36: Quest[] = [...QUESTS_REALMS_1_TO_3, ...QUESTS_REALMS_4_TO_6];

export function getQuestById(id: string): Quest | undefined {
  return QUESTS_36.find((q) => q.id === id);
}

export function getQuestsForRealm(realmId: RealmId): Quest[] {
  return QUESTS_36.filter((q) => q.realmId === realmId).sort((a, b) => a.stage - b.stage);
}

export function getQuestByRealmStage(realmId: RealmId, stage: StageNumber): Quest | undefined {
  return QUESTS_36.find((q) => q.realmId === realmId && q.stage === stage);
}

export function getNextQuest(currentId: string): Quest | null {
  const idx = QUESTS_36.findIndex((q) => q.id === currentId);
  if (idx < 0 || idx + 1 >= QUESTS_36.length) return null;
  return QUESTS_36[idx + 1];
}
