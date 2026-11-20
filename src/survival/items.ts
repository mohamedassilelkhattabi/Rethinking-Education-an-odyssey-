import type { ItemDef, ItemId } from './types';

export const ITEMS: Record<ItemId, ItemDef> = {
  apple: { id: 'apple', name: 'Apple', hunger: 15, health: 0, description: 'Restores 15 hunger.' },
  fish: { id: 'fish', name: 'Fish', hunger: 25, health: 0, description: 'Restores 25 hunger.' },
  bread: { id: 'bread', name: 'Bread', hunger: 30, health: 0, description: 'Restores 30 hunger.' },
  ambrosia: { id: 'ambrosia', name: 'Ambrosia', hunger: 0, health: 25, description: 'Food of the gods. Restores 25 health.' },
};

export const ITEM_ORDER: ItemId[] = ['apple', 'fish', 'bread', 'ambrosia'];

export const STARTING_INVENTORY: Record<ItemId, number> = { apple: 2, fish: 0, bread: 1, ambrosia: 0 };

/** Health and hunger lost per incorrect answer, by chapter. */
export const PENALTIES: Record<number, number> = { 1: 10, 2: 12, 3: 15, 4: 18, 5: 20, 6: 25 };

export const MAX_STAT = 100;
export const HUNGER_DRAIN_INTERVAL_MS = 15_000;
export const STARVATION_INTERVAL_MS = 5_000;
export const STARVATION_DAMAGE = 3;
export const PICKUP_RESPAWN_MS = 45_000;
export const ENVIRONMENT_DAMAGE = 5;
