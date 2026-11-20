import type { NpcLook } from '../npcs';
import { darken, lighten, OUTLINE, Pix } from './pixel';

export const CHAR_W = 16;
export const CHAR_H = 24;

// ═════════════════════════════════════════════════════════════
// Odysseus
// ═════════════════════════════════════════════════════════════

const HERO: Record<string, string> = {
  h: '#3b2416',
  H: '#24150c',
  s: '#e8b48a',
  S: '#c58b62',
  e: '#1d1410',
  b: '#4a2c18',
  r: '#b5402f',
  R: '#85281d',
  g: '#e0b354',
  c: '#2e4f6e',
  C: '#1f3650',
  d: '#7a5230',
  D: '#4e321b',
  w: '#d9dee4',
};

const HEAD = [
  '................',
  '......hhhhh.....',
  '.....hhhhhhh....',
  '.....hhsssssS...',
  '.....hsssseSS...',
  '.....hssssssS...',
  '......bsssssS...',
  '......bbbbbb....',
  '.......bbbS.....',
];

const BODY = [
  '....ccrrrrrrr...',
  '...cccrrrrrrr...',
  '...ccCrrrrrrR...',
  '...ccCrrrrrrR...',
  '...ccCgggggggD..',
  '...ccCrrrrrrRD..',
  '...ccCRrrrrrRD..',
  '....cCRRRRRRR...',
  '.....ggggggg....',
];

const LEGS: Record<string, string[]> = {
  stand: ['......ss.ss.....', '......ss.ss.....', '......ss.ss.....', '......Ss.Ss.....', '......dd.dd.....', '.....ddd.ddd....'],
  stride: ['......ss..ss....', '.....ss....ss...', '.....ss....ss...', '....Ss......Ss..', '....dd......dd..', '...ddd......ddd.'],
  pass: ['......ssss......', '.......sss......', '.......ss.s.....', '.......Ss.s.....', '.......dd.dd....', '......ddd.......'],
  stride2: ['.......s.ss.....', '......ss..ss....', '.....ss....s....', '.....Ss....Ss...', '.....dd....dd...', '....ddd....ddd..'],
  tuck: ['.....ssss.ss....', '.....ss...ss....', '....Ss.....ss...', '....dd.....Ss...', '...ddd.....dd...', '..........ddd...'],
  dangle: ['......ss.ss.....', '.....ss...ss....', '.....ss...ss....', '....Ss.....Ss...', '....dd.....dd...', '...ddd.....ddd..'],
};

type ArmPose = 'down' | 'forward' | 'back' | 'up';

function drawHero(p: Pix, ox: number, legs: keyof typeof LEGS, arm: ArmPose, bob: number) {
  p.rows(ox, bob, HEAD, HERO);
  p.rows(ox, 9 + bob, BODY, HERO);
  p.rows(ox, 18, LEGS[legs], HERO);
  // Front arm (skin) with a short sword when lowered.
  const a = (pts: [number, number][]) => pts.forEach(([x, y]) => p.px(ox + x, y + bob, HERO.s));
  if (arm === 'down') {
    a([[13, 10], [13, 11], [13, 12]]);
    p.px(ox + 13, 13 + bob, HERO.S);
  } else if (arm === 'forward') {
    a([[13, 10], [14, 11], [14, 12]]);
  } else if (arm === 'back') {
    a([[12, 10], [12, 11], [11, 12]]);
  } else {
    a([[13, 9], [14, 8], [14, 7]]);
  }
}

/** Frames: 0-1 idle, 2-5 walk, 6 jump, 7 fall, 8 hurt. */
export const HERO_FRAMES = { idle: [0, 1], walk: [2, 3, 4, 5], jump: 6, fall: 7, hurt: 8 };

export function heroSheet(): HTMLCanvasElement {
  const frames: [keyof typeof LEGS, ArmPose, number][] = [
    ['stand', 'down', 0],
    ['stand', 'down', 1],
    ['stride', 'back', 0],
    ['pass', 'down', 1],
    ['stride2', 'forward', 0],
    ['pass', 'down', 1],
    ['tuck', 'up', 0],
    ['dangle', 'forward', 0],
    ['dangle', 'up', 0],
  ];
  const p = new Pix(CHAR_W * frames.length, CHAR_H);
  frames.forEach(([legs, arm, bob], i) => drawHero(p, i * CHAR_W, legs, arm, bob));
  for (let i = 0; i < frames.length; i++) p.outline(OUTLINE, i * CHAR_W, 0, CHAR_W, CHAR_H);
  return p.scaled(2);
}

// ═════════════════════════════════════════════════════════════
// NPCs (procedural robed figures)
// ═════════════════════════════════════════════════════════════

function drawNpc(p: Pix, ox: number, look: NpcLook, bob: number) {
  const { skin, hair, robe, robeDark, trim } = look;
  const skinD = darken(skin, 0.18);
  const y = (v: number) => v + bob;

  // Accessory behind the body (staff / spear shaft).
  if (look.accessory === 'staff' || look.accessory === 'spear') {
    const x = ox + 13;
    p.rect(x, y(2), 1, 22 - bob, '#6b4c2c');
    if (look.accessory === 'spear') {
      p.rows(x - 1, y(0), ['.w.', 'www', '.w.'], { w: '#c9d1d9' });
    } else {
      p.disc(x, y(2), 1, '#7fd3e0');
    }
  }

  // Robe (long, flaring at the bottom).
  for (let r = 9; r <= 21; r++) {
    const flare = r > 16 ? 1 : 0;
    p.rect(ox + 4 - flare, y(r), 8 + flare * 2, 1, robe);
    p.rect(ox + 4 - flare, y(r), 2, 1, robeDark);
  }
  p.rect(ox + 3, y(21), 10, 1, trim);
  p.rect(ox + 4, y(14), 8, 1, trim);
  p.rect(ox + 7, y(9), 2, 1, skinD);
  // Feet.
  p.rect(ox + 5, 22, 2, 2, '#6b4c2c');
  p.rect(ox + 9, 22, 2, 2, '#6b4c2c');

  // Arm (sleeve + hand) in front.
  p.rect(ox + 11, y(10), 2, 4, robeDark);
  p.rect(ox + 12, y(14), 1, 1, skin);

  // Head.
  p.rect(ox + 6, y(3), 6, 5, skin);
  p.rect(ox + 11, y(3), 1, 5, skinD);
  p.px(ox + 10, y(5), '#1d1410');
  p.px(ox + 11, y(6), skinD);

  // Hair styles.
  switch (look.hairStyle) {
    case 'short':
      p.rect(ox + 6, y(1), 5, 2, hair);
      p.rect(ox + 5, y(2), 2, 4, hair);
      break;
    case 'curly':
      p.rect(ox + 6, y(1), 6, 2, hair);
      [5, 7, 9, 11].forEach((x) => p.px(ox + x, y(0), hair));
      p.rect(ox + 5, y(2), 2, 5, hair);
      break;
    case 'long':
      p.rect(ox + 6, y(1), 6, 2, hair);
      p.rect(ox + 4, y(2), 3, 11, hair);
      p.rect(ox + 7, y(2), 1, 1, hair);
      break;
    case 'bald':
      p.rect(ox + 6, y(2), 6, 1, lighten(skin, 0.15));
      p.rect(ox + 5, y(4), 1, 3, hair);
      break;
    case 'hood':
      p.rect(ox + 5, y(1), 8, 2, robeDark);
      p.rect(ox + 4, y(2), 2, 8, robeDark);
      p.rect(ox + 12, y(3), 1, 3, robeDark);
      break;
    case 'helmet': {
      const bronze = '#c9953f';
      p.rect(ox + 5, y(1), 7, 3, bronze);
      p.rect(ox + 5, y(4), 2, 4, bronze);
      p.rect(ox + 10, y(4), 1, 2, bronze);
      p.rect(ox + 6, y(3), 5, 1, darken(bronze, 0.25));
      const crest = look.crest ?? '#c64f4f';
      p.rect(ox + 4, y(0), 7, 1, crest);
      p.rect(ox + 3, y(1), 2, 2, crest);
      if (look.hair) p.rect(ox + 4, y(5), 1, 6, look.hair);
      break;
    }
  }

  // Beards.
  if (look.beard !== 'none') {
    const bc = look.beard === 'white' ? '#ece6da' : darken(look.hair === '#e8eef2' ? '#888888' : look.hair, 0.05);
    p.rect(ox + 6, y(6), 6, 2, bc);
    p.rect(ox + 7, y(8), 4, 1, bc);
    if (look.beard === 'white') p.rect(ox + 8, y(9), 2, 2, bc);
  }

  // Held accessories.
  const hx = ox + 13;
  switch (look.accessory) {
    case 'scroll':
    case 'map':
      p.rect(hx - 1, y(12), 4, 3, '#f0e2bf');
      p.rect(hx - 1, y(12), 1, 3, '#c9a86a');
      p.rect(hx + 2, y(12), 1, 3, '#c9a86a');
      if (look.accessory === 'map') p.px(hx + 1, y(13), '#c64f4f');
      break;
    case 'basket':
      p.rect(hx - 2, y(15), 5, 3, '#b58a4c');
      p.rect(hx - 2, y(15), 5, 1, '#d9b06a');
      p.px(hx - 1, y(14), '#c64f4f');
      p.px(hx + 1, y(14), '#6f9a4a');
      break;
    case 'net':
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) p.px(hx - 1 + i, y(13 + j), '#c9b98a');
      break;
    case 'torch':
      p.rect(hx, y(9), 1, 6, '#6b4c2c');
      p.rect(hx - 1, y(6), 3, 3, '#ffb347');
      p.px(hx, y(5), '#fff1a8');
      break;
    case 'lantern':
      p.rect(hx - 1, y(13), 3, 4, '#c9953f');
      p.px(hx, y(14), '#fff1a8');
      p.px(hx, y(15), '#ffd166');
      break;
  }
}

export function npcSheet(look: NpcLook): HTMLCanvasElement {
  const p = new Pix(CHAR_W * 2, CHAR_H);
  drawNpc(p, 0, look, 0);
  drawNpc(p, CHAR_W, look, 1);
  p.outline(OUTLINE, 0, 0, CHAR_W, CHAR_H);
  p.outline(OUTLINE, CHAR_W, 0, CHAR_W, CHAR_H);
  return p.scaled(2);
}

/** Large head-and-shoulders portrait for dialogue panels. */
export function npcPortrait(look: NpcLook, scale = 6): string {
  const p = new Pix(CHAR_W, 15);
  drawNpc(p, 0, look, 0);
  p.outline(OUTLINE);
  return p.scaled(scale).toDataURL();
}

export function heroPortrait(scale = 6): string {
  const p = new Pix(CHAR_W, 15);
  drawHero(p, 0, 'stand', 'down', 0);
  p.outline(OUTLINE);
  return p.scaled(scale).toDataURL();
}
