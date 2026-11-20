import type { ItemId } from '../types';
import type { PropKind, Theme } from '../levels';
import { darken, lighten, mix, OUTLINE, Pix, rng } from './pixel';

// ═════════════════════════════════════════════════════════════
// Tiles (16×16 art → 32×32)
// ═════════════════════════════════════════════════════════════

export const TILE_INDEX = {
  grassTop: 0,
  dirt: 1,
  sandTop: 2,
  sandFill: 3,
  caveTop: 4,
  caveFill: 5,
  marbleTop: 6,
  marbleFill: 7,
  rockTop: 8,
  rockFill: 9,
  wood: 10,
  cloud: 11,
  dock: 12,
  ceiling: 13,
} as const;

function speckle(p: Pix, ox: number, base: string, dots: string[], seed: number, density = 0.18, y0 = 0) {
  const r = rng(seed);
  p.rect(ox, y0, 16, 16 - y0, base);
  for (let y = y0; y < 16; y++) for (let x = 0; x < 16; x++) if (r() < density) p.px(ox + x, y, dots[Math.floor(r() * dots.length)]);
}

function topLayer(p: Pix, ox: number, color: string, highlight: string, depth: number, seed: number) {
  const r = rng(seed);
  for (let x = 0; x < 16; x++) {
    const d = depth + (r() < 0.35 ? 1 : 0) + (r() < 0.15 ? 1 : 0);
    p.rect(ox + x, 0, 1, d, color);
    if (r() < 0.5) p.px(ox + x, 0, highlight);
  }
}

export function tileset(): HTMLCanvasElement {
  const N = 14;
  const p = new Pix(16 * N, 16);
  const at = (i: number) => i * 16;

  // Grass + dirt.
  speckle(p, at(0), '#7a4f2c', ['#5e3b1f', '#93633a', '#6b4426'], 1);
  topLayer(p, at(0), '#4f9a3a', '#86c95a', 4, 2);
  speckle(p, at(1), '#7a4f2c', ['#5e3b1f', '#93633a', '#6b4426'], 3);
  // Sand.
  speckle(p, at(2), '#e3c98f', ['#cfae6d', '#f2dfae'], 4);
  topLayer(p, at(2), '#f0dca4', '#fff2cc', 2, 5);
  speckle(p, at(3), '#d8bb7c', ['#c4a263', '#e8cf98'], 6);
  // Cave stone with moss.
  speckle(p, at(4), '#4a4440', ['#3a3532', '#5c5550', '#2e2a28'], 7, 0.3);
  topLayer(p, at(4), '#5f6b3a', '#7d8c4a', 3, 8);
  speckle(p, at(5), '#3b3633', ['#2d2926', '#4a4440', '#252220'], 9, 0.3);
  // Marble (Aeolus).
  speckle(p, at(6), '#d9d2c3', ['#c4bcaa', '#ebe5d8', '#b8b0a0'], 10, 0.15);
  topLayer(p, at(6), '#6fb35a', '#a6e07a', 3, 11);
  p.rect(at(6), 6, 16, 1, '#c9a25a');
  speckle(p, at(7), '#c8c1b2', ['#b3ab9b', '#dcd6ca', '#a9b6c4'], 12, 0.18);
  // Wet rock (final passage).
  speckle(p, at(8), '#3d4b52', ['#2d383e', '#4f5f66', '#26323a'], 13, 0.3);
  topLayer(p, at(8), '#3f6b4f', '#5c8f6a', 2, 14);
  speckle(p, at(9), '#2f3b41', ['#243036', '#3d4b52'], 15, 0.3);
  // Wooden platform (top 6 rows only).
  p.rect(at(10), 0, 16, 5, '#9a6b3a');
  p.rect(at(10), 0, 16, 1, '#c99a5e');
  p.rect(at(10), 4, 16, 1, '#6b4426');
  p.px(at(10) + 3, 2, '#5e3b1f');
  p.px(at(10) + 12, 2, '#5e3b1f');
  p.rect(at(10) + 2, 5, 2, 3, '#6b4426');
  p.rect(at(10) + 12, 5, 2, 3, '#6b4426');
  // Cloud platform.
  p.ellipse(at(11) + 4, 4, 4, 3, '#ffffff');
  p.ellipse(at(11) + 11, 4, 5, 3, '#ffffff');
  p.ellipse(at(11) + 8, 3, 4, 3, '#ffffff');
  p.rect(at(11), 5, 16, 2, '#dfe9f2');
  // Dock planks with posts.
  p.rect(at(12), 0, 16, 4, '#8a5a2f');
  p.rect(at(12), 0, 16, 1, '#b88550');
  for (const x of [5, 11]) p.rect(at(12) + x, 0, 1, 4, '#5e3c1e');
  p.rect(at(12) + 1, 4, 3, 12, '#5e3c1e');
  p.rect(at(12) + 12, 4, 3, 12, '#5e3c1e');
  // Cave ceiling with drips.
  speckle(p, at(13), '#2d2926', ['#221f1d', '#3b3633'], 16, 0.3);
  for (const x of [3, 9, 13]) {
    p.px(at(13) + x, 15, '#3b3633');
  }
  return p.scaled(2);
}

// ═════════════════════════════════════════════════════════════
// Items (12×12 art → 24×24)
// ═════════════════════════════════════════════════════════════

export function itemIcon(id: ItemId): Pix {
  const p = new Pix(12, 12);
  switch (id) {
    case 'apple':
      p.disc(6, 7, 4, '#c8352b');
      p.disc(5, 6, 1, '#f07a6a');
      p.rect(6, 1, 1, 3, '#6b4426');
      p.rect(7, 1, 3, 2, '#5fa84a');
      break;
    case 'fish':
      p.ellipse(5, 6, 4, 2, '#7fb6c9');
      p.rect(2, 5, 6, 1, '#b9dde8');
      p.rows(8, 3, ['.ff', 'ff.', 'f..', 'ff.', '.ff'].map((r) => r.padEnd(3, '.')), { f: '#5a93a8' });
      p.px(3, 5, '#101b2d');
      break;
    case 'bread':
      p.ellipse(6, 7, 5, 3, '#c98b3e');
      p.ellipse(6, 6, 4, 2, '#e3a957');
      [3, 6, 9].forEach((x) => p.px(x, 5, '#f6d08a'));
      break;
    case 'ambrosia':
      p.rect(4, 3, 4, 1, '#c9953f');
      p.rect(5, 1, 2, 2, '#f1d49a');
      p.ellipse(6, 7, 4, 4, '#e0b354');
      p.rect(3, 6, 6, 1, '#fff1b8');
      p.px(4, 5, '#fffbe6');
      p.rect(5, 10, 2, 1, '#9a6b2a');
      break;
  }
  p.outline(OUTLINE);
  return p;
}

export function itemTexture(id: ItemId): HTMLCanvasElement {
  return itemIcon(id).scaled(2);
}

export function itemDataUrl(id: ItemId, scale = 4): string {
  return itemIcon(id).scaled(scale).toDataURL();
}

export function heartIcon(scale = 3): string {
  const p = new Pix(9, 8);
  p.rows(0, 0, ['.rr...rr.', 'rrrr.rrrr', 'rWrrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....'], { r: '#d8443a', W: '#ffb3a8' });
  p.outline(OUTLINE);
  return p.scaled(scale).toDataURL();
}

export function hungerIcon(scale = 3): string {
  const p = new Pix(9, 9);
  p.rows(0, 0, ['...mmm...', '..mmmmm..', '.mmMmmmm.', '.mmmmmmm.', '..mmmmm..', '...mmw...', '....ww...', '...w.ww..', '........'], {
    m: '#c87a3a',
    M: '#f0b070',
    w: '#f2ead8',
  });
  p.outline(OUTLINE);
  return p.scaled(scale).toDataURL();
}

// ═════════════════════════════════════════════════════════════
// Props
// ═════════════════════════════════════════════════════════════

function prop(kind: PropKind): Pix {
  switch (kind) {
    case 'palm': {
      const p = new Pix(28, 48);
      for (let i = 0; i < 34; i++) {
        const x = 13 + Math.round(Math.sin(i / 12) * 3);
        p.rect(x, 14 + i, 3, 1, i % 4 === 0 ? '#6b4426' : '#8a5a2f');
      }
      const frond = (dx: number, dy: number, c: string) => {
        for (let i = 0; i < 12; i++) p.rect(14 + Math.round((dx * i) / 12), 13 + Math.round((dy * i) / 12 + (i * i) / 30), 2, 2, c);
      };
      frond(-13, -4, '#3f8a3a');
      frond(13, -4, '#3f8a3a');
      frond(-11, 6, '#2f6e2c');
      frond(11, 6, '#2f6e2c');
      frond(-4, -10, '#5aa84a');
      frond(5, -9, '#5aa84a');
      p.disc(15, 15, 2, '#6b4426');
      p.outline(OUTLINE);
      return p;
    }
    case 'olive': {
      const p = new Pix(32, 40);
      p.rect(14, 22, 4, 18, '#6b4426');
      p.rect(12, 30, 2, 2, '#6b4426');
      const r = rng(21);
      for (let i = 0; i < 9; i++) p.disc(8 + r() * 16, 8 + r() * 12, 6, i % 2 ? '#3f7a3a' : '#4f8f45');
      for (let i = 0; i < 12; i++) p.px(6 + r() * 20, 6 + r() * 14, '#7fb860');
      for (let i = 0; i < 5; i++) p.disc(7 + r() * 18, 10 + r() * 10, 1, '#c8352b');
      p.outline(OUTLINE);
      return p;
    }
    case 'bush': {
      const p = new Pix(18, 10);
      p.disc(5, 6, 4, '#3f7a3a');
      p.disc(12, 6, 4, '#4f8f45');
      p.disc(9, 4, 4, '#5aa84a');
      p.rect(1, 8, 16, 2, '#3f7a3a');
      p.outline(OUTLINE);
      return p;
    }
    case 'lotus': {
      const p = new Pix(12, 12);
      p.rect(5, 6, 1, 6, '#3f7a3a');
      p.ellipse(3, 10, 3, 1, '#4f8f45');
      [
        [5, 1],
        [3, 3],
        [7, 3],
        [2, 5],
        [8, 5],
      ].forEach(([x, y]) => p.ellipse(x, y, 1, 2, '#f2a7c3'));
      p.disc(5, 4, 1, '#ffe08a');
      p.outline(OUTLINE);
      return p;
    }
    case 'hut': {
      const p = new Pix(36, 30);
      p.rect(4, 12, 28, 18, '#e3cfa2');
      p.rect(4, 12, 28, 2, '#c9b080');
      for (let y = 0; y < 13; y++) p.rect(2 + y - 2, 12 - y, 36 - 2 * y, 1, y % 3 === 0 ? '#b58a3c' : '#d9aa52');
      p.rect(15, 18, 7, 12, '#4e321b');
      p.rect(7, 17, 5, 4, '#4e321b');
      p.rect(25, 17, 5, 4, '#4e321b');
      p.outline(OUTLINE);
      return p;
    }
    case 'column':
    case 'brokenColumn': {
      const h = kind === 'column' ? 44 : 24;
      const p = new Pix(14, h);
      p.rect(1, h - 3, 12, 3, '#cfc6b2');
      p.rect(3, 4, 8, h - 7, '#e8e1d0');
      for (const x of [4, 6, 8]) p.rect(x, 4, 1, h - 7, '#c9c0ac');
      if (kind === 'column') {
        p.rect(1, 0, 12, 2, '#d8af63');
        p.rect(2, 2, 10, 2, '#cfc6b2');
      } else {
        p.rows(3, 0, ['.e.ee...', 'eeeeeee.', 'eeeeeeee', 'eeeeeeee'], { e: '#e8e1d0' });
      }
      p.outline(OUTLINE);
      return p;
    }
    case 'torch': {
      const p = new Pix(6, 18);
      p.rect(2, 6, 2, 12, '#6b4426');
      p.rect(1, 6, 4, 2, '#4e321b');
      p.outline(OUTLINE);
      return p;
    }
    case 'crate': {
      const p = new Pix(16, 14);
      p.rect(0, 0, 16, 14, '#9a6b3a');
      p.rect(0, 0, 16, 2, '#c99a5e');
      p.line(1, 2, 14, 13, '#6b4426');
      p.line(14, 2, 1, 13, '#6b4426');
      p.rect(0, 6, 16, 1, '#6b4426');
      p.outline(OUTLINE);
      return p;
    }
    case 'basket': {
      const p = new Pix(14, 10);
      p.rect(1, 3, 12, 7, '#b58a4c');
      for (let x = 1; x < 13; x += 2) p.rect(x, 3, 1, 7, '#9a7038');
      p.ellipse(4, 2, 2, 2, '#e3a957');
      p.ellipse(9, 2, 2, 2, '#c98b3e');
      p.outline(OUTLINE);
      return p;
    }
    case 'rock': {
      const p = new Pix(18, 10);
      p.ellipse(9, 7, 8, 4, '#6f6a62');
      p.ellipse(7, 5, 5, 3, '#8a847a');
      p.px(5, 4, '#a39d92');
      p.outline(OUTLINE);
      return p;
    }
    case 'crystal': {
      const p = new Pix(12, 16);
      p.rows(0, 0, ['....c.......', '...ccc......', '...cCc...c..', '...cCc..ccc.', '..ccCcc.cCc.', '..ccCcc.cCc.', '..ccCcc.cCc.', '..ccCccccCc.', '.cccCccccCcc', '.cccCccccCcc'], {
        c: '#4fc3d6',
        C: '#c8f4fb',
      });
      p.rect(0, 10, 12, 6, '#3b3633');
      p.outline(OUTLINE);
      return p;
    }
    case 'stalagmite': {
      const p = new Pix(12, 20);
      for (let y = 0; y < 20; y++) {
        const w = Math.max(1, Math.round((y / 20) * 10));
        p.rect(6 - w / 2, y, w, 1, y % 5 === 0 ? '#5c5550' : '#4a4440');
      }
      p.outline(OUTLINE);
      return p;
    }
    case 'temple': {
      const p = new Pix(60, 46);
      p.rect(2, 40, 56, 6, '#cfc6b2');
      p.rect(4, 37, 52, 3, '#e8e1d0');
      for (let x = 7; x < 54; x += 8) {
        p.rect(x, 16, 5, 21, '#efe8d8');
        p.rect(x + 1, 16, 1, 21, '#d6cdb8');
      }
      p.rect(3, 13, 54, 3, '#e8e1d0');
      for (let y = 0; y < 12; y++) p.rect(6 + y * 2, 12 - y, 48 - y * 4, 1, y === 0 ? '#d8af63' : '#efe8d8');
      p.disc(30, 7, 2, '#d8af63');
      p.outline(OUTLINE);
      return p;
    }
    case 'wreck': {
      const p = new Pix(44, 22);
      for (let y = 0; y < 9; y++) p.rect(2 + y, 13 + y, 40 - y * 2, 1, y % 3 === 0 ? '#4e321b' : '#6b4426');
      p.rect(2, 12, 40, 2, '#8a5a2f');
      p.line(22, 12, 30, 0, '#4e321b');
      p.line(23, 12, 31, 0, '#4e321b');
      p.rows(26, 2, ['ss..', 'sss.', 'ss.s', 's..s'], { s: '#c9b98a' });
      p.outline(OUTLINE);
      return p;
    }
    case 'flag': {
      const p = new Pix(12, 28);
      p.rect(1, 0, 1, 28, '#6b4426');
      p.rows(2, 1, ['bbbbbbbb.', 'bgbbbbbbb', 'bbbbbbbb.', 'bbbbbb...'], { b: '#2f8190', g: '#d8af63' });
      p.outline(OUTLINE);
      return p;
    }
  }
}

export function propTexture(kind: PropKind): HTMLCanvasElement {
  return prop(kind).scaled(2);
}

export const PROP_KINDS: PropKind[] = [
  'palm', 'olive', 'bush', 'lotus', 'hut', 'column', 'brokenColumn', 'torch', 'crate', 'basket', 'rock', 'crystal', 'stalagmite', 'temple', 'wreck', 'flag',
];

export function flameSheet(): HTMLCanvasElement {
  const p = new Pix(16, 8);
  const f = (ox: number, tall: boolean) => {
    p.rows(ox, 0, tall ? ['...y....', '..yoy...', '..yoy...', '.yoory..', '.yorry..', '..yry...', '........', '........'] : ['........', '...y....', '..yoy...', '.yoory..', '.yorry..', '..yry...', '........', '........'], {
      y: '#ffd166',
      o: '#ff9f43',
      r: '#e8573a',
    });
  };
  f(0, true);
  f(8, false);
  return p.scaled(2);
}

// ═════════════════════════════════════════════════════════════
// Ships, exits and set pieces
// ═════════════════════════════════════════════════════════════

export function shipTexture(sail = '#f6ead0', emblem = '#c9953f'): HTMLCanvasElement {
  const p = new Pix(72, 52);
  // Mast & yard.
  p.rect(35, 2, 2, 36, '#4e321b');
  p.rect(17, 5, 38, 2, '#5e3c1e');
  // Sail.
  for (let y = 7; y < 30; y++) {
    const bulge = Math.round(Math.sin(((y - 7) / 23) * Math.PI) * 2);
    p.rect(19 - bulge, y, 34 + bulge * 2, 1, y % 6 === 0 ? darken(sail, 0.08) : sail);
  }
  p.disc(36, 18, 5, emblem);
  p.disc(36, 18, 2, lighten(emblem, 0.4));
  // Rigging.
  p.line(36, 2, 6, 36, '#3b2814');
  p.line(36, 2, 66, 38, '#3b2814');
  // Hull.
  for (let y = 0; y < 12; y++) {
    const inset = Math.round((y * y) / 10);
    p.rect(4 + inset, 38 + y, 62 - inset * 2, 1, y < 2 ? '#8a5a2f' : y % 4 === 0 ? '#4e321b' : '#6b4426');
  }
  p.rect(2, 30, 4, 9, '#6b4426');
  p.rect(0, 28, 4, 3, '#d8af63');
  p.rect(64, 34, 6, 5, '#6b4426');
  p.rect(68, 40, 4, 3, '#b48a48');
  p.rect(6, 41, 58, 1, '#d8af63');
  for (let x = 10; x < 62; x += 7) p.disc(x, 38, 2, x % 2 ? '#d8af63' : '#966e42');
  p.px(60, 43, '#f6edd6');
  p.px(61, 43, '#101b2d');
  p.outline(OUTLINE);
  return p.scaled(2);
}

export function boulderTexture(): HTMLCanvasElement {
  const p = new Pix(34, 34);
  p.disc(17, 17, 16, '#5c5550');
  p.disc(14, 13, 10, '#6f6a62');
  p.disc(11, 10, 4, '#837d73');
  const r = rng(77);
  for (let i = 0; i < 26; i++) p.px(4 + r() * 26, 4 + r() * 26, '#47423d');
  p.outline(OUTLINE);
  return p.scaled(2);
}

export function caveMouthTexture(): HTMLCanvasElement {
  const p = new Pix(40, 60);
  for (let y = 0; y < 60; y++) {
    const w = Math.min(40, Math.round(Math.sqrt(y + 4) * 7));
    p.rect(20 - w / 2, y, w, 1, mix('#fff3c4', '#f2b968', y / 60));
  }
  return p.scaled(2);
}

/** Small particle textures. */
export function particleTextures(): Record<string, HTMLCanvasElement> {
  const make = (w: number, h: number, draw: (p: Pix) => void) => {
    const p = new Pix(w, h);
    draw(p);
    return p.scaled(2);
  };
  return {
    petal: make(3, 2, (p) => p.rect(0, 0, 3, 2, '#f2a7c3')),
    ember: make(2, 2, (p) => p.rect(0, 0, 2, 2, '#ffb347')),
    dust: make(1, 1, (p) => p.rect(0, 0, 1, 1, '#d9c9a8')),
    rain: make(1, 6, (p) => p.rect(0, 0, 1, 6, '#9fc3d9')),
    wind: make(14, 1, (p) => p.rect(0, 0, 14, 1, '#ffffff')),
    spark: make(3, 3, (p) => {
      p.px(1, 0, '#fff6c8');
      p.rect(0, 1, 3, 1, '#ffe08a');
      p.px(1, 2, '#fff6c8');
    }),
    splash: make(2, 2, (p) => p.rect(0, 0, 2, 2, '#cfeaf2')),
  };
}

export function waterTexture(theme: Theme): HTMLCanvasElement {
  const p = new Pix(32, 32);
  const [top, mid, deep] =
    theme === 'cyclops' ? ['#3a5a6a', '#1f3440', '#101c24'] : theme === 'passage' ? ['#4a7f95', '#1f4a62', '#0f2a3d'] : ['#7cc4d4', '#2f8190', '#1d5868'];
  p.rect(0, 0, 32, 32, mid);
  p.rect(0, 20, 32, 12, deep);
  for (let x = 0; x < 32; x++) {
    const y = Math.round(Math.sin((x / 32) * Math.PI * 2) * 1.5) + 2;
    p.ctx.clearRect(x, 0, 1, y);
    p.px(x, y, top);
    p.px(x, y + 1, lighten(mid, 0.15));
  }
  p.ctx.clearRect(0, 0, 32, 1);
  for (const [x, y] of [
    [5, 9],
    [19, 13],
    [27, 7],
  ])
    p.rect(x, y, 3, 1, lighten(mid, 0.25));
  return p.scaled(2);
}

// ═════════════════════════════════════════════════════════════
// Parallax backgrounds (drawn at half resolution, 2× upscale)
// ═════════════════════════════════════════════════════════════

function bands(p: Pix, stops: [number, string][]) {
  // Dithered vertical gradient: a retro look.
  for (let y = 0; y < p.h; y++) {
    const t = y / p.h;
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    const local = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    const q = Math.floor(local * 6) / 6;
    const qn = Math.min(1, q + 1 / 6);
    const a = mix(c0, c1, q);
    const b = mix(c0, c1, qn);
    for (let x = 0; x < p.w; x++) p.px(x, y, (local * 6) % 1 > 0.5 && (x + y) % 2 === 0 ? b : a);
  }
}

function ridge(p: Pix, base: number, amp: number, freq: number, color: string, seed: number, jag = 0) {
  const r = rng(seed);
  const phase = r() * 100;
  for (let x = 0; x < p.w; x++) {
    const n = Math.sin((x + phase) * freq) * amp + Math.sin((x + phase) * freq * 2.7) * amp * 0.35 + (jag ? (r() - 0.5) * jag : 0);
    const top = Math.round(base - n);
    p.rect(x, top, 1, p.h - top, color);
  }
}

function stars(p: Pix, count: number, maxY: number, seed: number) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) p.px(r() * p.w, r() * maxY, r() < 0.3 ? '#ffffff' : '#c9d6ff');
}

export interface Backdrop {
  sky: HTMLCanvasElement;
  far: HTMLCanvasElement;
  mid: HTMLCanvasElement;
}

const BG_W = 820;
const BG_H = 270;

export function backdrop(theme: Theme): Backdrop {
  const sky = new Pix(480, BG_H);
  const far = new Pix(BG_W, BG_H);
  const mid = new Pix(BG_W, BG_H);

  switch (theme) {
    case 'lotus': {
      bands(sky, [
        [0, '#3d6fb0'],
        [0.45, '#7fb6e0'],
        [0.68, '#f3c99a'],
        [0.72, '#7cc4d4'],
        [1, '#2f8190'],
      ]);
      sky.disc(360, 70, 18, '#fff1c4');
      sky.disc(360, 70, 13, '#fffbe6');
      // Distant islands on the horizon.
      ridge(far, 196, 10, 0.02, '#5b8fa3', 3);
      far.ctx.clearRect(0, 0, BG_W, 150);
      for (const [x, w, h] of [
        [90, 80, 26],
        [330, 120, 34],
        [610, 90, 22],
      ])
        for (let i = 0; i < w; i++) {
          const top = Math.round(194 - Math.sin((i / w) * Math.PI) * h);
          far.rect(x + i, top, 1, 196 - top, '#4f7f94');
        }
      ridge(mid, 232, 14, 0.015, '#3f7a3a', 9);
      for (let x = 30; x < BG_W; x += 95) {
        mid.rect(x + 6, 170, 3, 50, '#2f5a2c');
        mid.ellipse(x + 7, 168, 14, 5, '#356a32');
      }
      break;
    }
    case 'cyclops': {
      bands(sky, [
        [0, '#120c09'],
        [0.5, '#2a1a10'],
        [1, '#3a2213'],
      ]);
      ridge(far, 120, 40, 0.012, '#2a2220', 21, 6);
      far.ctx.clearRect(0, 0, BG_W, 40);
      for (let x = 0; x < BG_W; x += 7) far.rect(x, 0, 7, 22 + ((x * 13) % 17), '#1d1715');
      const r = rng(5);
      for (let i = 0; i < 18; i++) far.disc(r() * BG_W, 70 + r() * 150, 1, '#4fc3d6');
      // The sleeping Cyclops (giant silhouette) on the mid layer.
      const cx = 420;
      mid.ellipse(cx, 175, 90, 70, '#1a1210');
      mid.disc(cx + 10, 92, 34, '#1a1210');
      mid.ellipse(cx - 70, 225, 40, 25, '#1a1210');
      mid.ellipse(cx + 85, 230, 45, 22, '#1a1210');
      mid.ellipse(cx + 22, 88, 9, 6, '#3a2a1a');
      mid.ellipse(cx + 22, 88, 4, 4, '#7a2a14');
      // Sheep.
      for (const x of [120, 170, 640, 700]) {
        mid.ellipse(x, 238, 14, 9, '#d9d2c3');
        mid.disc(x + 13, 232, 4, '#3a3532');
      }
      ridge(mid, 262, 4, 0.05, '#221a16', 6);
      break;
    }
    case 'aeolus': {
      bands(sky, [
        [0, '#2c6f98'],
        [0.5, '#7fc0d8'],
        [0.8, '#f3e2b0'],
        [1, '#f6d58a'],
      ]);
      sky.disc(80, 60, 20, '#fff6d0');
      for (const [x, y, w] of [
        [120, 200, 120],
        [430, 150, 160],
        [690, 210, 100],
      ]) {
        far.ellipse(x, y, w / 2, 12, '#c9b8a6');
        for (let i = 0; i < w * 0.7; i++) {
          const d = Math.round(Math.sin((i / (w * 0.7)) * Math.PI) * 26);
          far.rect(x - w * 0.35 + i, y, 1, d, '#a8968a');
        }
        for (let c = 0; c < 4; c++) far.rect(x - 24 + c * 14, y - 24, 4, 22, '#efe6d4');
        far.rect(x - 28, y - 28, 58, 4, '#d8af63');
      }
      const r = rng(14);
      for (let i = 0; i < 9; i++) {
        const x = r() * BG_W;
        const y = 40 + r() * 170;
        mid.ellipse(x, y, 30 + r() * 30, 8 + r() * 6, '#ffffff');
        mid.ellipse(x + 20, y - 6, 18, 8, '#ffffff');
        mid.rect(x - 40, y + 4, 80, 3, '#e6eef5');
      }
      break;
    }
    case 'passage': {
      bands(sky, [
        [0, '#0b1420'],
        [0.4, '#1c2c3c'],
        [0.7, '#3a4a5a'],
        [1, '#1f3a4f'],
      ]);
      stars(sky, 30, 90, 31);
      // Distant glowing temple of Ithaca.
      far.disc(740, 168, 26, 'rgba(255,214,140,0.25)');
      far.rect(715, 160, 50, 4, '#f1d49a');
      for (let c = 0; c < 5; c++) far.rect(718 + c * 10, 164, 3, 16, '#f6e7c0');
      far.rect(712, 180, 56, 3, '#f1d49a');
      for (let y = 0; y < 8; y++) far.rect(718 + y * 3, 159 - y, 44 - y * 6, 1, '#f6e7c0');
      ridge(far, 200, 12, 0.02, '#1b2a36', 41);
      far.ctx.clearRect(600, 0, 220, 182);
      // Scylla's cliff and heads.
      for (let x = 0; x < 160; x++) far.rect(x, Math.round(60 + (x * x) / 160), 1, BG_H, '#141f28');
      for (const [x, y, ex] of [
        [60, 100, 120],
        [80, 130, 150],
        [40, 150, 110],
      ]) {
        mid.line(x, y + 20, ex, y - 10, '#0f171e');
        mid.line(x + 1, y + 20, ex + 1, y - 10, '#0f171e');
        mid.line(x + 2, y + 20, ex + 2, y - 10, '#0f171e');
        mid.ellipse(ex + 4, y - 12, 7, 4, '#0f171e');
        mid.px(ex + 8, y - 13, '#c64f4f');
      }
      // Charybdis whirlpool.
      for (let ring = 0; ring < 5; ring++) mid.ellipse(560, 236, 60 - ring * 11, 12 - ring * 2, ring % 2 ? '#1f4a62' : '#2f6a85');
      mid.ellipse(560, 236, 6, 2, '#05080c');
      ridge(mid, 250, 4, 0.05, '#122634', 8);
      break;
    }
  }
  return { sky: sky.scaled(2), far: far.scaled(2), mid: mid.scaled(2) };
}

/** Title-screen sky. */
export function menuBackdrop(): Backdrop {
  const sky = new Pix(480, BG_H);
  bands(sky, [
    [0, '#0b1426'],
    [0.4, '#2a3f6b'],
    [0.62, '#d8875a'],
    [0.7, '#f6c27a'],
    [0.71, '#2f6a85'],
    [1, '#163b5c'],
  ]);
  stars(sky, 60, 90, 2);
  sky.disc(240, 186, 26, '#ffd98a');
  sky.disc(240, 186, 20, '#fff1c4');
  sky.rect(0, 191, 480, 79, '#2f6a85');
  for (let y = 192; y < 270; y += 5) for (let x = (y * 7) % 13; x < 480; x += 13) sky.rect(x, y, 6, 1, '#4f8fa8');
  for (let y = 192; y < 230; y += 3) sky.rect(230 - (y - 192) / 3, y, 20 + (y - 192) / 1.5, 1, '#f6c27a');
  const far = new Pix(BG_W, BG_H);
  for (const [x, w, h] of [
    [40, 140, 30],
    [500, 200, 40],
  ])
    for (let i = 0; i < w; i++) {
      const top = Math.round(190 - Math.sin((i / w) * Math.PI) * h);
      far.rect(x + i, top, 1, 191 - top, '#1d3047');
    }
  const mid = new Pix(BG_W, BG_H);
  const r = rng(3);
  for (let i = 0; i < 7; i++) {
    const x = r() * BG_W;
    const y = 30 + r() * 70;
    mid.ellipse(x, y, 40, 6, 'rgba(40,30,60,0.55)');
  }
  return { sky: sky.scaled(2), far: far.scaled(2), mid: mid.scaled(2) };
}

/** Victory sunrise (with Ithaca's palace) and death backdrop. */
export function endingBackdrop(kind: 'victory' | 'death'): HTMLCanvasElement {
  const p = new Pix(480, 270);
  if (kind === 'victory') {
    bands(p, [
      [0, '#24365e'],
      [0.35, '#7a6a9a'],
      [0.55, '#f0a070'],
      [0.66, '#ffd98a'],
      [0.67, '#2f8190'],
      [1, '#163b5c'],
    ]);
    p.disc(150, 180, 28, '#ffe7a6');
    p.disc(150, 180, 22, '#fff6d6');
    p.rect(0, 181, 480, 89, '#2f8190');
    for (let y = 182; y < 270; y += 4) for (let x = (y * 5) % 11; x < 480; x += 11) p.rect(x, y, 5, 1, '#5fb8c4');
    for (let y = 182; y < 240; y += 3) p.rect(140 - (y - 182) / 4, y, 20 + (y - 182) / 2, 1, '#ffd98a');
    // Ithaca headland and palace.
    for (let x = 250; x < 480; x++) {
      const top = Math.round(150 - Math.sin(((x - 250) / 230) * Math.PI) * 40 + (x > 420 ? (x - 420) * 0.3 : 0));
      p.rect(x, top, 1, 200 - top, '#4a3f55');
    }
    p.rect(250, 190, 230, 80, '#3a3245');
    p.rect(330, 96, 70, 4, '#f6e7c0');
    for (let c = 0; c < 6; c++) p.rect(334 + c * 12, 100, 4, 18, '#fff6dc');
    p.rect(328, 118, 74, 4, '#f6e7c0');
    for (let y = 0; y < 12; y++) p.rect(334 + y * 3, 96 - y, 62 - y * 6, 1, '#f6e7c0');
    // Pier.
    p.rect(200, 206, 120, 4, '#5e3c1e');
    for (let x = 206; x < 320; x += 18) p.rect(x, 210, 3, 14, '#4e321b');
  } else {
    bands(p, [
      [0, '#0a0606'],
      [0.5, '#3a0f12'],
      [0.75, '#5a1a1a'],
      [0.76, '#1a1214'],
      [1, '#0a0808'],
    ]);
    const r = rng(9);
    for (let i = 0; i < 140; i++) p.rect(r() * 480, r() * 270, 1, 5, 'rgba(180,190,210,0.35)');
    for (let x = 0; x < 480; x++) {
      const top = Math.round(205 - Math.sin(x / 30) * 4 - Math.sin(x / 11) * 2);
      p.rect(x, top, 1, 270 - top, '#140c0e');
    }
  }
  return p.scaled(2);
}
