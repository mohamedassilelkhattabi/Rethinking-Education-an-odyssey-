import { describe, expect, it } from 'vitest';
import { PICKUP_RESPAWN_MS } from '../survival/items';
import { createRun, isPickupAvailable, survivalReducer as reduce } from '../survival/reducer';
import type { SurvivalAction, SurvivalState } from '../survival/types';

const run = (s: SurvivalState, ...actions: SurvivalAction[]) => actions.reduce(reduce, s);
const tick = (s: SurvivalState, totalMs: number, step = 1000) => {
  for (let t = 0; t < totalMs; t += step) s = reduce(s, { type: 'TICK', ms: Math.min(step, totalMs - t) });
  return s;
};

describe('initial run', () => {
  it('starts at full health and hunger in Chapter I with a basic pack', () => {
    const s = createRun('t');
    expect(s.health).toBe(100);
    expect(s.hunger).toBe(100);
    expect(s.currentChapter).toBe(1);
    expect(s.xp).toBe(0);
    expect(s.inventory).toEqual({ apple: 2, fish: 0, bread: 1, ambrosia: 0 });
  });
});

describe('hunger depletion', () => {
  it('loses 1 hunger every 15 seconds of active play', () => {
    let s = tick(createRun(), 14_000);
    expect(s.hunger).toBe(100);
    s = tick(s, 1_000);
    expect(s.hunger).toBe(99);
    s = tick(s, 45_000);
    expect(s.hunger).toBe(96);
    expect(s.timeSurvivedMs).toBe(60_000);
  });

  it('accumulates partial ticks precisely', () => {
    let s = createRun();
    for (let i = 0; i < 300; i++) s = reduce(s, { type: 'TICK', ms: 50 });
    expect(s.hunger).toBe(99);
  });

  it('caps a single tick so a long tab switch cannot drain everything at once', () => {
    const s = reduce(createRun(), { type: 'TICK', ms: 10 * 60_000 });
    expect(s.hunger).toBe(100);
    expect(s.timeSurvivedMs).toBe(5_000);
  });
});

describe('starvation', () => {
  it('deals 3 health every 5 seconds while hunger is zero', () => {
    let s: SurvivalState = { ...createRun(), hunger: 0 };
    s = tick(s, 4_999, 4_999);
    expect(s.health).toBe(100);
    s = tick(s, 1);
    expect(s.health).toBe(97);
    s = tick(s, 10_000);
    expect(s.health).toBe(91);
  });

  it('eating stops starvation damage', () => {
    let s: SurvivalState = { ...createRun(), hunger: 0 };
    s = tick(s, 5_000);
    expect(s.health).toBe(97);
    s = reduce(s, { type: 'CONSUME', item: 'apple' });
    expect(s.hunger).toBe(15);
    s = tick(s, 10_000);
    expect(s.health).toBe(97);
  });

  it('starving to death ends the run', () => {
    let s: SurvivalState = { ...createRun(), hunger: 0, health: 6 };
    s = tick(s, 10_000);
    expect(s.status).toBe('dead');
    expect(s.health).toBe(0);
    expect(s.summary?.cause).toBe('starvation');
  });
});

describe('food and inventory', () => {
  it('restores the documented amounts, capped at 100', () => {
    const hungry: SurvivalState = { ...createRun(), hunger: 50, inventory: { apple: 1, fish: 1, bread: 1, ambrosia: 1 } };
    expect(reduce(hungry, { type: 'CONSUME', item: 'apple' }).hunger).toBe(65);
    expect(reduce(hungry, { type: 'CONSUME', item: 'fish' }).hunger).toBe(75);
    expect(reduce(hungry, { type: 'CONSUME', item: 'bread' }).hunger).toBe(80);
    expect(reduce({ ...hungry, hunger: 90 }, { type: 'CONSUME', item: 'bread' }).hunger).toBe(100);
  });

  it('ambrosia restores 25 health, capped at 100, and food does not heal', () => {
    const hurt: SurvivalState = { ...createRun(), health: 60, hunger: 50, inventory: { apple: 1, fish: 0, bread: 0, ambrosia: 2 } };
    expect(reduce(hurt, { type: 'CONSUME', item: 'ambrosia' }).health).toBe(85);
    expect(reduce({ ...hurt, health: 90 }, { type: 'CONSUME', item: 'ambrosia' }).health).toBe(100);
    expect(reduce(hurt, { type: 'CONSUME', item: 'apple' }).health).toBe(60);
  });

  it('decrements quantity and never goes negative', () => {
    let s: SurvivalState = { ...createRun(), hunger: 10, inventory: { apple: 1, fish: 0, bread: 0, ambrosia: 0 } };
    s = reduce(s, { type: 'CONSUME', item: 'apple' });
    expect(s.inventory.apple).toBe(0);
    const again = reduce(s, { type: 'CONSUME', item: 'apple' });
    expect(again.inventory.apple).toBe(0);
    expect(again.hunger).toBe(s.hunger);
    expect(again.notice?.tone).toBe('bad');
  });

  it('does not waste food when already full', () => {
    const s = reduce(createRun(), { type: 'CONSUME', item: 'apple' });
    expect(s.inventory.apple).toBe(2);
    expect(s.foodConsumed).toBe(0);
  });

  it('consumes the selected item with F and cycles selection', () => {
    let s: SurvivalState = { ...createRun(), hunger: 10 };
    s = run(s, { type: 'SELECT_ITEM', item: 'bread' }, { type: 'CONSUME' });
    expect(s.hunger).toBe(40);
    expect(s.inventory.bread).toBe(0);
    s = reduce(s, { type: 'CYCLE_ITEM', dir: 1 });
    expect(s.selectedItem).toBe('ambrosia');
  });

  it('picks up an item once; renewable food respawns only after the cooldown', () => {
    let s = reduce(createRun(), { type: 'PICKUP', pickupId: 'p1', item: 'fish', renewable: true });
    expect(s.inventory.fish).toBe(1);
    s = reduce(s, { type: 'PICKUP', pickupId: 'p1', item: 'fish', renewable: true });
    expect(s.inventory.fish).toBe(1);
    expect(isPickupAvailable(s, 'p1', true)).toBe(false);
    s = tick(s, PICKUP_RESPAWN_MS);
    expect(isPickupAvailable(s, 'p1', true)).toBe(true);
    s = reduce(s, { type: 'PICKUP', pickupId: 'p1', item: 'fish', renewable: true });
    expect(s.inventory.fish).toBe(2);
  });

  it('rare items never respawn', () => {
    let s = reduce(createRun(), { type: 'PICKUP', pickupId: 'amb', item: 'ambrosia', renewable: false });
    s = tick(s, PICKUP_RESPAWN_MS * 3);
    expect(isPickupAvailable(s, 'amb', false)).toBe(false);
    expect(reduce(s, { type: 'PICKUP', pickupId: 'amb', item: 'ambrosia', renewable: false }).inventory.ambrosia).toBe(1);
  });
});

describe('environmental damage', () => {
  it('reduces health and can kill', () => {
    let s = reduce(createRun(), { type: 'ENVIRONMENT_DAMAGE', amount: 5, reason: 'You fell into the sea' });
    expect(s.health).toBe(95);
    s = reduce({ ...s, health: 4 }, { type: 'ENVIRONMENT_DAMAGE', amount: 5, reason: 'Fell' });
    expect(s.status).toBe('dead');
  });

  it('a dead run ignores all further gameplay actions', () => {
    const dead = reduce({ ...createRun(), health: 3 }, { type: 'ENVIRONMENT_DAMAGE', amount: 5, reason: 'x' });
    expect(reduce(dead, { type: 'TICK', ms: 1000 })).toBe(dead);
    expect(reduce(dead, { type: 'CONSUME', item: 'apple' })).toBe(dead);
    expect(reduce(dead, { type: 'OPEN_CHALLENGE', questionId: 1 })).toBe(dead);
  });
});
