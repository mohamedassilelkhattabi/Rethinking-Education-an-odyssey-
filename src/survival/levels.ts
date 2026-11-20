import type { ItemId } from './types';

export const TILE = 32;
export const ROWS = 17;
export const WORLD_HEIGHT = ROWS * TILE;

export type Theme = 'lotus' | 'cyclops' | 'aeolus' | 'sirens' | 'passage' | 'ithaca';

export interface GroundSegment {
  from: number;
  to: number;
  /** Height of the ground in tiles; the surface tile sits on row ROWS - h. */
  h: number;
  alt?: boolean;
}

export interface PlatformSpec {
  col: number;
  row: number;
  len: number;
}

export interface PickupSpec {
  id: string;
  item: ItemId;
  col: number;
  row?: number;
  renewable: boolean;
}

export type PropKind =
  | 'palm'
  | 'olive'
  | 'bush'
  | 'lotus'
  | 'hut'
  | 'column'
  | 'brokenColumn'
  | 'torch'
  | 'crate'
  | 'basket'
  | 'rock'
  | 'crystal'
  | 'stalagmite'
  | 'temple'
  | 'wreck'
  | 'flag';

export interface PropSpec {
  kind: PropKind;
  col: number;
  row?: number;
  flip?: boolean;
}

export interface LevelSpec {
  chapterId: number;
  name: string;
  theme: Theme;
  width: number;
  hazard: 'water' | 'void';
  ground: GroundSegment[];
  ceiling?: { from: number; to: number; h: number }[];
  platforms: PlatformSpec[];
  spawnCol: number;
  npcs: { questionId: number; col: number }[];
  pickups: PickupSpec[];
  props: PropSpec[];
  exit: { col: number; kind: 'ship' | 'cave' | 'windship' | 'temple' };
  story: string[];
  completion: string[];
}

export const LEVELS: LevelSpec[] = [
  // ── Chapter 1: Unit 1 Pre-Calculus & Review ──
  {
    chapterId: 1,
    name: 'The Shores of the Lotus-Eaters',
    theme: 'lotus',
    width: 72,
    hazard: 'water',
    ground: [
      { from: 0, to: 13, h: 4, alt: true },
      { from: 14, to: 18, h: 5 },
      { from: 19, to: 21, h: 6 },
      { from: 22, to: 30, h: 5 },
      { from: 34, to: 52, h: 5 },
      { from: 53, to: 58, h: 6 },
      { from: 59, to: 63, h: 4, alt: true },
    ],
    platforms: [
      { col: 37, row: 10, len: 3 },
      { col: 41, row: 8, len: 3 },
      { col: 63, row: 13, len: 8 },
    ],
    spawnCol: 2,
    npcs: [
      { questionId: 1, col: 11 },
      { questionId: 2, col: 26 },
      { questionId: 3, col: 46 },
    ],
    pickups: [
      { id: 'c1-fish-beach', item: 'fish', col: 6, renewable: true },
      { id: 'c1-apple-a', item: 'apple', col: 23, renewable: true },
      { id: 'c1-apple-b', item: 'apple', col: 29, renewable: true },
      { id: 'c1-bread', item: 'bread', col: 39, renewable: true },
      { id: 'c1-ambrosia', item: 'ambrosia', col: 42, row: 8, renewable: false },
      { id: 'c1-fish-dock', item: 'fish', col: 60, renewable: true },
    ],
    props: [
      { kind: 'palm', col: 3 },
      { kind: 'column', col: 8 },
      { kind: 'palm', col: 9, flip: true },
      { kind: 'lotus', col: 7 },
      { kind: 'rock', col: 13 },
      { kind: 'lotus', col: 16 },
      { kind: 'bush', col: 18 },
      { kind: 'lotus', col: 20 },
      { kind: 'olive', col: 23 },
      { kind: 'brokenColumn', col: 25 },
      { kind: 'olive', col: 29 },
      { kind: 'hut', col: 36 },
      { kind: 'basket', col: 39 },
      { kind: 'lotus', col: 43 },
      { kind: 'hut', col: 49 },
      { kind: 'bush', col: 52 },
      { kind: 'column', col: 55 },
      { kind: 'palm', col: 57, flip: true },
      { kind: 'flag', col: 63 },
    ],
    exit: { col: 68, kind: 'ship' },
    story: [
      'Unit 1: Pre-Calculus & Review — Golden cliffs and lotus groves frame the Aegean coast.',
      'Invert functions, read unit-circle bearings, and solve exponential equations to free your crew.',
    ],
    completion: [
      'Unit 1 conquered! Your ship waits at the sunlit timber dock.',
      'Board the trireme to sail toward the Cavern of Polyphemus.',
    ],
  },

  // ── Chapter 2: Unit 2 Limits & Continuity ──
  {
    chapterId: 2,
    name: 'The Cavern of Polyphemus',
    theme: 'cyclops',
    width: 72,
    hazard: 'water',
    ceiling: [{ from: 5, to: 71, h: 2 }],
    ground: [
      { from: 0, to: 12, h: 3 },
      { from: 15, to: 24, h: 4 },
      { from: 25, to: 33, h: 5 },
      { from: 34, to: 37, h: 4 },
      { from: 41, to: 55, h: 3 },
      { from: 56, to: 71, h: 4 },
    ],
    platforms: [
      { col: 39, row: 13, len: 1 },
      { col: 27, row: 10, len: 3 },
      { col: 31, row: 8, len: 2 },
      { col: 46, row: 12, len: 3 },
      { col: 49, row: 10, len: 2 },
    ],
    spawnCol: 2,
    npcs: [
      { questionId: 4, col: 9 },
      { questionId: 5, col: 30 },
      { questionId: 6, col: 53 },
    ],
    pickups: [
      { id: 'c2-bread-entry', item: 'bread', col: 5, renewable: true },
      { id: 'c2-apple', item: 'apple', col: 20, renewable: true },
      { id: 'c2-ambrosia', item: 'ambrosia', col: 31, row: 8, renewable: false },
      { id: 'c2-fish-pool', item: 'fish', col: 36, renewable: true },
      { id: 'c2-bread-high', item: 'bread', col: 49, row: 10, renewable: true },
      { id: 'c2-fish-exit', item: 'fish', col: 62, renewable: true },
    ],
    props: [
      { kind: 'crate', col: 5 },
      { kind: 'torch', col: 6 },
      { kind: 'stalagmite', col: 11 },
      { kind: 'torch', col: 17 },
      { kind: 'crate', col: 20 },
      { kind: 'brokenColumn', col: 22 },
      { kind: 'crystal', col: 25 },
      { kind: 'torch', col: 33 },
      { kind: 'rock', col: 35 },
      { kind: 'torch', col: 43 },
      { kind: 'brokenColumn', col: 45 },
      { kind: 'crystal', col: 55 },
      { kind: 'torch', col: 58 },
      { kind: 'stalagmite', col: 60 },
      { kind: 'column', col: 64 },
      { kind: 'torch', col: 66 },
    ],
    exit: { col: 69, kind: 'cave' },
    story: [
      'Unit 2: Limits & Continuity — Torchlight dances across damp limestone walls inside Polyphemus’s cavern.',
      'Master one-sided limits, horizontal asymptotes, and continuity to roll away the colossal boulder.',
    ],
    completion: [
      'The great boulder rolls aside as daylight floods the sea grotto!',
      'Walk through the sunlit cavern mouth to set sail for Aeolus’s citadel.',
    ],
  },

  // ── Chapter 3: Unit 3 Derivatives ──
  {
    chapterId: 3,
    name: 'The Floating Isle of Aeolus',
    theme: 'aeolus',
    width: 72,
    hazard: 'void',
    ground: [
      { from: 0, to: 13, h: 5 },
      { from: 17, to: 28, h: 6 },
      { from: 31, to: 44, h: 5 },
      { from: 48, to: 58, h: 6 },
      { from: 61, to: 71, h: 5 },
    ],
    platforms: [
      { col: 15, row: 12, len: 1 },
      { col: 21, row: 9, len: 3 },
      { col: 35, row: 10, len: 3 },
      { col: 45, row: 11, len: 3 },
      { col: 59, row: 11, len: 2 },
    ],
    spawnCol: 2,
    npcs: [
      { questionId: 7, col: 10 },
      { questionId: 8, col: 40 },
      { questionId: 9, col: 55 },
    ],
    pickups: [
      { id: 'c3-bread-start', item: 'bread', col: 5, renewable: true },
      { id: 'c3-ambrosia', item: 'ambrosia', col: 22, row: 9, renewable: false },
      { id: 'c3-apple', item: 'apple', col: 26, renewable: true },
      { id: 'c3-bread-mid', item: 'bread', col: 36, row: 10, renewable: true },
      { id: 'c3-fish', item: 'fish', col: 50, renewable: true },
      { id: 'c3-apple-dock', item: 'apple', col: 64, renewable: true },
    ],
    props: [
      { kind: 'column', col: 3 },
      { kind: 'crate', col: 5 },
      { kind: 'column', col: 8 },
      { kind: 'column', col: 19 },
      { kind: 'olive', col: 26 },
      { kind: 'brokenColumn', col: 28 },
      { kind: 'column', col: 33 },
      { kind: 'crate', col: 43 },
      { kind: 'column', col: 50 },
      { kind: 'temple', col: 55 },
      { kind: 'flag', col: 62 },
      { kind: 'crate', col: 64 },
    ],
    exit: { col: 68, kind: 'windship' },
    story: [
      'Unit 3: Derivatives — Sunbeams stream through marble colonnades high above the Aegean clouds.',
      'Command Quotient Rule, Chain Rule, and Related Rates to harness Aeolus’s winds.',
    ],
    completion: [
      'Aeolus grants favorable west winds! Board the wind-ship hovering at the marble pier.',
    ],
  },

  // ── Chapter 4: Unit 4 Applications of Derivatives ──
  {
    chapterId: 4,
    name: 'The Sirens’ Strait',
    theme: 'sirens',
    width: 72,
    hazard: 'water',
    ground: [
      { from: 0, to: 14, h: 4, alt: true },
      { from: 17, to: 29, h: 5 },
      { from: 32, to: 44, h: 6 },
      { from: 47, to: 57, h: 5 },
      { from: 60, to: 65, h: 4, alt: true },
    ],
    platforms: [
      { col: 15, row: 12, len: 2 },
      { col: 23, row: 9, len: 3 },
      { col: 30, row: 11, len: 2 },
      { col: 45, row: 11, len: 2 },
      { col: 65, row: 13, len: 6 },
    ],
    spawnCol: 2,
    npcs: [
      { questionId: 10, col: 11 },
      { questionId: 11, col: 38 },
      { questionId: 12, col: 54 },
    ],
    pickups: [
      { id: 'c4s-fish', item: 'fish', col: 6, renewable: true },
      { id: 'c4s-apple', item: 'apple', col: 20, renewable: true },
      { id: 'c4s-ambrosia', item: 'ambrosia', col: 24, row: 9, renewable: false },
      { id: 'c4s-bread', item: 'bread', col: 35, renewable: true },
      { id: 'c4s-fish-b', item: 'fish', col: 50, renewable: true },
      { id: 'c4s-apple-b', item: 'apple', col: 62, renewable: true },
    ],
    props: [
      { kind: 'brokenColumn', col: 4 },
      { kind: 'lotus', col: 8 },
      { kind: 'column', col: 13 },
      { kind: 'olive', col: 19 },
      { kind: 'crystal', col: 27 },
      { kind: 'temple', col: 38 },
      { kind: 'column', col: 43 },
      { kind: 'palm', col: 49 },
      { kind: 'brokenColumn', col: 56 },
      { kind: 'flag', col: 64 },
    ],
    exit: { col: 68, kind: 'ship' },
    story: [
      'Unit 4: Applications of Derivatives — Turquoise sea mist drifts around sunken marble amphitheaters.',
      'Locate extrema, build linear approximations, and wield L’Hôpital’s Rule to outwit the Sirens.',
    ],
    completion: [
      'The Sirens’ melody fades behind you! Board your ship to face Scylla and Charybdis.',
    ],
  },

  // ── Chapter 5: Unit 5 Integrals ──
  {
    chapterId: 5,
    name: 'The Straits of Scylla & Charybdis',
    theme: 'passage',
    width: 72,
    hazard: 'water',
    ground: [
      { from: 0, to: 11, h: 4, alt: true },
      { from: 15, to: 26, h: 5 },
      { from: 30, to: 41, h: 4 },
      { from: 45, to: 56, h: 5 },
      { from: 59, to: 65, h: 4, alt: true },
    ],
    platforms: [
      { col: 11, row: 13, len: 5 },
      { col: 21, row: 10, len: 3 },
      { col: 28, row: 12, len: 1 },
      { col: 43, row: 12, len: 1 },
      { col: 51, row: 10, len: 3 },
      { col: 57, row: 12, len: 2 },
      { col: 65, row: 13, len: 6 },
    ],
    spawnCol: 2,
    npcs: [
      { questionId: 13, col: 8 },
      { questionId: 14, col: 36 },
      { questionId: 15, col: 54 },
    ],
    pickups: [
      { id: 'c5-fish-start', item: 'fish', col: 4, renewable: true },
      { id: 'c5-bread', item: 'bread', col: 18, renewable: true },
      { id: 'c5-ambrosia-a', item: 'ambrosia', col: 22, row: 10, renewable: false },
      { id: 'c5-fish-mid', item: 'fish', col: 33, renewable: true },
      { id: 'c5-ambrosia-b', item: 'ambrosia', col: 52, row: 10, renewable: false },
      { id: 'c5-apple', item: 'apple', col: 48, renewable: true },
      { id: 'c5-bread-end', item: 'bread', col: 61, renewable: true },
    ],
    props: [
      { kind: 'rock', col: 2 },
      { kind: 'wreck', col: 6 },
      { kind: 'rock', col: 17 },
      { kind: 'brokenColumn', col: 24 },
      { kind: 'rock', col: 32 },
      { kind: 'wreck', col: 39 },
      { kind: 'bush', col: 47 },
      { kind: 'torch', col: 52 },
      { kind: 'column', col: 60 },
      { kind: 'flag', col: 64 },
    ],
    exit: { col: 68, kind: 'ship' },
    story: [
      'Unit 5: Integrals — Thunder rolls across the dark basalt cliffs of Scylla and Charybdis.',
      'Master antiderivatives, u-substitution, and the Fundamental Theorem of Calculus to survive.',
    ],
    completion: [
      'The storm subsides! Sail out of the straits toward the golden cliffs of Ithaca.',
    ],
  },

  // ── Chapter 6: Unit 6 Applications of Integrals ──
  {
    chapterId: 6,
    name: 'The Golden Harbor of Ithaca',
    theme: 'ithaca',
    width: 72,
    hazard: 'water',
    ground: [
      { from: 0, to: 15, h: 4, alt: true },
      { from: 17, to: 30, h: 5 },
      { from: 32, to: 47, h: 6 },
      { from: 49, to: 71, h: 5 },
    ],
    platforms: [
      { col: 15, row: 13, len: 2 },
      { col: 25, row: 9, len: 3 },
      { col: 30, row: 11, len: 2 },
      { col: 47, row: 11, len: 2 },
    ],
    spawnCol: 2,
    npcs: [
      { questionId: 16, col: 11 },
      { questionId: 17, col: 39 },
      { questionId: 18, col: 63 },
    ],
    pickups: [
      { id: 'c6-bread', item: 'bread', col: 5, renewable: true },
      { id: 'c6-apple', item: 'apple', col: 21, renewable: true },
      { id: 'c6-ambrosia', item: 'ambrosia', col: 26, row: 9, renewable: false },
      { id: 'c6-fish', item: 'fish', col: 35, renewable: true },
      { id: 'c6-bread-b', item: 'bread', col: 54, renewable: true },
    ],
    props: [
      { kind: 'flag', col: 3 },
      { kind: 'olive', col: 7 },
      { kind: 'column', col: 14 },
      { kind: 'hut', col: 20 },
      { kind: 'olive', col: 28 },
      { kind: 'column', col: 34 },
      { kind: 'basket', col: 37 },
      { kind: 'olive', col: 44 },
      { kind: 'column', col: 52 },
      { kind: 'torch', col: 57 },
      { kind: 'column', col: 60 },
      { kind: 'temple', col: 66 },
      { kind: 'column', col: 70 },
    ],
    exit: { col: 68, kind: 'temple' },
    story: [
      'Unit 6: Applications of Integrals — Warm golden sunlight illuminates Ithaca’s olive terraces and Acropolis.',
      'Calculate areas between curves, volumes of revolution, and spring work to claim your homecoming!',
    ],
    completion: [
      'Home at last! Every unit of Calculus I has been conquered on the Path to Ithaca.',
    ],
  },
];

export function getLevel(chapterId: number): LevelSpec {
  const l = LEVELS.find((lv) => lv.chapterId === chapterId);
  if (!l) throw new Error(`Unknown level ${chapterId}`);
  return l;
}

/** Ground height (in tiles) at a column, or 0 over water/void. */
export function groundHeightAt(level: LevelSpec, col: number): number {
  const seg = level.ground.find((g) => col >= g.from && col <= g.to);
  return seg ? seg.h : 0;
}

/** World y of the walkable surface an entity stands on (row given = top of that platform row). */
export function standY(level: LevelSpec, col: number, row?: number): number {
  if (row !== undefined) return row * TILE;
  const h = groundHeightAt(level, col);
  return h > 0 ? (ROWS - h) * TILE : (ROWS - 1) * TILE;
}
