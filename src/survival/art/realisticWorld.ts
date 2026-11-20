import type { Theme } from '../levels';
import { rng } from './pixel';

const W = 960;
const H = 540;

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  return [c, ctx];
}

interface PaletteSpec {
  skyStops: [number, string][];
  sun: { x: number; y: number; r: number; inner: string; outer: string; glow: string };
  rayColor: string;
  cloudLight: string;
  cloudShadow: string;
  farCliff: [string, string];
  farRim: string;
  midCliff: [string, string];
  midRim: string;
  ruinLight: string;
  ruinShade: string;
  foliage: [string, string];
  waterTop: string;
  waterMid: string;
  waterDeep: string;
  shimmer: string;
  cave?: boolean;
  stars?: boolean;
  palace?: boolean;
}

const PALETTES: Record<Theme | 'menu', PaletteSpec> = {
  menu: {
    skyStops: [
      [0, '#0e2444'],
      [0.34, '#24527a'],
      [0.62, '#6d7f91'],
      [0.82, '#e39e67'],
      [1, '#f7cf92'],
    ],
    sun: { x: 740, y: 240, r: 44, inner: '#fffbe6', outer: '#ffd285', glow: 'rgba(255, 198, 118, 0.45)' },
    rayColor: 'rgba(255, 224, 160, 0.14)',
    cloudLight: 'rgba(255, 232, 198, 0.62)',
    cloudShadow: 'rgba(72, 86, 118, 0.42)',
    farCliff: ['#4e657c', '#2b3e54'],
    farRim: 'rgba(255, 214, 150, 0.35)',
    midCliff: ['#38485a', '#1d2838'],
    midRim: 'rgba(255, 200, 130, 0.4)',
    ruinLight: '#e5d4b3',
    ruinShade: '#756652',
    foliage: ['#284839', '#193026'],
    waterTop: '#3e7f94',
    waterMid: '#1f4f6b',
    waterDeep: '#0d263b',
    shimmer: '#ffe2a6',
    stars: true,
    palace: true,
  },
  lotus: {
    skyStops: [
      [0, '#1e5b94'],
      [0.36, '#4c94c2'],
      [0.7, '#99cfe0'],
      [0.88, '#e8d7b7'],
      [1, '#f4dfb6'],
    ],
    sun: { x: 760, y: 118, r: 38, inner: '#ffffff', outer: '#ffebad', glow: 'rgba(255, 232, 165, 0.5)' },
    rayColor: 'rgba(255, 245, 205, 0.16)',
    cloudLight: 'rgba(255, 252, 242, 0.78)',
    cloudShadow: 'rgba(130, 168, 196, 0.38)',
    farCliff: ['#88a9b8', '#56788e'],
    farRim: 'rgba(255, 245, 214, 0.45)',
    midCliff: ['#a5906e', '#63533d'],
    midRim: 'rgba(255, 236, 188, 0.5)',
    ruinLight: '#efe3ca',
    ruinShade: '#9e8e74',
    foliage: ['#3e7845', '#244d2d'],
    waterTop: '#35a0b3',
    waterMid: '#1c6d85',
    waterDeep: '#10445a',
    shimmer: '#fff4cf',
  },
  cyclops: {
    skyStops: [
      [0, '#090707'],
      [0.45, '#1b1411'],
      [0.8, '#382115'],
      [1, '#5a2e16'],
    ],
    sun: { x: 480, y: 90, r: 28, inner: '#ffdcb0', outer: '#d98a4a', glow: 'rgba(240, 140, 65, 0.25)' },
    rayColor: 'rgba(255, 215, 165, 0.11)',
    cloudLight: 'rgba(165, 118, 86, 0.22)',
    cloudShadow: 'rgba(32, 20, 16, 0.45)',
    farCliff: ['#2d2521', '#181311'],
    farRim: 'rgba(255, 146, 74, 0.28)',
    midCliff: ['#3e342e', '#201a16'],
    midRim: 'rgba(255, 164, 88, 0.35)',
    ruinLight: '#6b5e54',
    ruinShade: '#342c28',
    foliage: ['#384828', '#222c18'],
    waterTop: '#243a42',
    waterMid: '#15252b',
    waterDeep: '#0a1317',
    shimmer: '#ffb266',
    cave: true,
  },
  aeolus: {
    skyStops: [
      [0, '#1c62a6'],
      [0.35, '#4c99cf'],
      [0.7, '#99d3e8'],
      [1, '#e6f5fa'],
    ],
    sun: { x: 720, y: 105, r: 42, inner: '#ffffff', outer: '#fff0be', glow: 'rgba(255, 245, 205, 0.55)' },
    rayColor: 'rgba(255, 250, 224, 0.18)',
    cloudLight: 'rgba(255, 255, 255, 0.88)',
    cloudShadow: 'rgba(148, 184, 212, 0.42)',
    farCliff: ['#b9ccd9', '#7d9db5'],
    farRim: 'rgba(255, 255, 240, 0.6)',
    midCliff: ['#d9d2c1', '#9c927f'],
    midRim: 'rgba(255, 246, 214, 0.65)',
    ruinLight: '#f6f0e1',
    ruinShade: '#b5ab98',
    foliage: ['#4d8c52', '#2d5c35'],
    waterTop: '#56b5c7',
    waterMid: '#2f8190',
    waterDeep: '#1a5566',
    shimmer: '#ffffff',
  },
  sirens: {
    skyStops: [
      [0, '#0a1428'],
      [0.38, '#1e2c52'],
      [0.72, '#4a436e'],
      [0.9, '#8b6884'],
      [1, '#c9948f'],
    ],
    sun: { x: 750, y: 130, r: 34, inner: '#fffdf2', outer: '#dce8ff', glow: 'rgba(190, 218, 255, 0.42)' },
    rayColor: 'rgba(180, 225, 255, 0.12)',
    cloudLight: 'rgba(218, 198, 224, 0.48)',
    cloudShadow: 'rgba(34, 34, 66, 0.55)',
    farCliff: ['#434669', '#232642'],
    farRim: 'rgba(210, 226, 255, 0.35)',
    midCliff: ['#333954', '#1a1e33'],
    midRim: 'rgba(155, 222, 232, 0.42)',
    ruinLight: '#cfc9d4',
    ruinShade: '#625d73',
    foliage: ['#224542', '#122929'],
    waterTop: '#2b6a82',
    waterMid: '#183f58',
    waterDeep: '#0b2033',
    shimmer: '#d6f2ff',
    stars: true,
  },
  passage: {
    skyStops: [
      [0, '#0c1622'],
      [0.38, '#1d3042'],
      [0.72, '#354e60'],
      [1, '#586d78'],
    ],
    sun: { x: 710, y: 120, r: 28, inner: '#e0edf5', outer: '#9cb5c4', glow: 'rgba(165, 200, 220, 0.25)' },
    rayColor: 'rgba(195, 222, 240, 0.11)',
    cloudLight: 'rgba(148, 172, 186, 0.52)',
    cloudShadow: 'rgba(18, 28, 38, 0.68)',
    farCliff: ['#2d3e4a', '#18242c'],
    farRim: 'rgba(175, 208, 224, 0.26)',
    midCliff: ['#26333c', '#131b21'],
    midRim: 'rgba(150, 192, 208, 0.3)',
    ruinLight: '#8e989e',
    ruinShade: '#424d54',
    foliage: ['#264236', '#162921'],
    waterTop: '#225263',
    waterMid: '#143644',
    waterDeep: '#091b24',
    shimmer: '#b2d8e5',
  },
  ithaca: {
    skyStops: [
      [0, '#1c3b6b'],
      [0.3, '#4f6d99'],
      [0.6, '#c48573'],
      [0.82, '#f0ba7d'],
      [1, '#fce4ae'],
    ],
    sun: { x: 520, y: 215, r: 48, inner: '#fffef2', outer: '#ffd584', glow: 'rgba(255, 210, 130, 0.55)' },
    rayColor: 'rgba(255, 232, 175, 0.18)',
    cloudLight: 'rgba(255, 238, 212, 0.72)',
    cloudShadow: 'rgba(128, 108, 136, 0.36)',
    farCliff: ['#8a7c88', '#4d465a'],
    farRim: 'rgba(255, 224, 168, 0.5)',
    midCliff: ['#7a6e60', '#413a34'],
    midRim: 'rgba(255, 216, 152, 0.55)',
    ruinLight: '#f6ebd4',
    ruinShade: '#9c8b70',
    foliage: ['#3e6e40', '#234527'],
    waterTop: '#3e8fa3',
    waterMid: '#215c75',
    waterDeep: '#10354a',
    shimmer: '#ffebb5',
    palace: true,
  },
};

function drawDoricRuins(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  light: string,
  shade: string,
  columns: number,
  pediment: boolean,
) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);

  const spacing = 22;
  const totalW = columns * spacing + 14;
  const colH = 62;

  // Natural stone foundation plinth extending below the stylobate so the hillside crest wraps seamlessly across it
  const plinthGrad = ctx.createLinearGradient(0, -4, 0, 44);
  plinthGrad.addColorStop(0, shade);
  plinthGrad.addColorStop(1, shade);
  ctx.fillStyle = plinthGrad;
  ctx.fillRect(-11, -4, totalW + 22, 48);

  // Stepped marble stylobate
  ctx.fillStyle = shade;
  ctx.fillRect(-10, -8, totalW + 20, 10);
  ctx.fillStyle = light;
  ctx.fillRect(-6, -13, totalW + 12, 6);

  // Fluted columns with sunlit left edge
  for (let i = 0; i < columns; i++) {
    const cx = 6 + i * spacing;
    const broken = !pediment && i === columns - 2;
    const h = broken ? colH * 0.62 : colH;
    const grad = ctx.createLinearGradient(cx, 0, cx + 10, 0);
    grad.addColorStop(0, light);
    grad.addColorStop(0.55, light);
    grad.addColorStop(1, shade);
    ctx.fillStyle = grad;
    ctx.fillRect(cx, -13 - h, 10, h);
    // Fluting lines
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 3.5, -13 - h);
    ctx.lineTo(cx + 3.5, -13);
    ctx.moveTo(cx + 7, -13 - h);
    ctx.lineTo(cx + 7, -13);
    ctx.stroke();
    // Capital
    if (!broken) {
      ctx.fillStyle = light;
      ctx.fillRect(cx - 2, -13 - h - 4, 14, 4);
    }
  }

  // Architrave & triangular pediment
  if (pediment) {
    ctx.fillStyle = shade;
    ctx.fillRect(0, -13 - colH - 12, totalW, 9);
    ctx.fillStyle = light;
    ctx.fillRect(0, -13 - colH - 12, totalW, 4);

    ctx.beginPath();
    ctx.moveTo(-6, -13 - colH - 12);
    ctx.lineTo(totalW / 2, -13 - colH - 36);
    ctx.lineTo(totalW + 6, -13 - colH - 12);
    ctx.closePath();
    ctx.fillStyle = light;
    ctx.fill();
    ctx.strokeStyle = shade;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Partial broken lintel
    ctx.fillStyle = shade;
    ctx.fillRect(2, -13 - colH - 10, Math.min(totalW * 0.65, spacing * 2.6), 7);
    ctx.fillStyle = light;
    ctx.fillRect(2, -13 - colH - 10, Math.min(totalW * 0.65, spacing * 2.6), 3);
  }
  ctx.restore();
}

function drawCypress(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number, light: string, dark: string) {
  ctx.save();
  ctx.fillStyle = '#3d2a1c';
  ctx.fillRect(x - 2, baseY - h * 0.2, 4, h * 0.22);

  const grad = ctx.createLinearGradient(x - h * 0.16, baseY - h, x + h * 0.16, baseY);
  grad.addColorStop(0, light);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  ctx.bezierCurveTo(x + h * 0.18, baseY - h * 0.65, x + h * 0.18, baseY - h * 0.22, x, baseY - h * 0.12);
  ctx.bezierCurveTo(x - h * 0.18, baseY - h * 0.22, x - h * 0.18, baseY - h * 0.65, x, baseY - h);
  ctx.fill();
  ctx.restore();
}

function drawOliveTree(ctx: CanvasRenderingContext2D, x: number, baseY: number, scale: number, light: string, dark: string) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#4e3927';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-4, -22, 2, -40);
  ctx.moveTo(-1, -26);
  ctx.lineTo(-16, -42);
  ctx.moveTo(1, -28);
  ctx.lineTo(18, -42);
  ctx.stroke();

  const blobs = [
    [-16, -48, 22, 14],
    [16, -46, 20, 13],
    [0, -56, 26, 16],
    [4, -44, 18, 12],
  ];
  for (const [bx, by, rx, ry] of blobs) {
    const g = ctx.createRadialGradient(bx - rx * 0.3, by - ry * 0.35, 2, bx, by, rx);
    g.addColorStop(0, light);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export interface RealisticBackdrop {
  sky: HTMLCanvasElement;
  clouds: HTMLCanvasElement;
  rays: HTMLCanvasElement;
  far: HTMLCanvasElement;
  mid: HTMLCanvasElement;
}

export function realisticBackdrop(theme: Theme | 'menu'): RealisticBackdrop {
  const pal = PALETTES[theme];
  const r = rng(theme.split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 13));

  // 1. Sky dome + sun/moon + stars
  const [sky, sctx] = makeCanvas(W, H);
  const skyGrad = sctx.createLinearGradient(0, 0, 0, H);
  for (const [stop, color] of pal.skyStops) skyGrad.addColorStop(stop, color);
  sctx.fillStyle = skyGrad;
  sctx.fillRect(0, 0, W, H);

  if (pal.stars) {
    for (let i = 0; i < 85; i++) {
      const sx = r() * W;
      const sy = r() * (H * 0.48);
      const sr = 0.6 + r() * 1.4;
      sctx.fillStyle = `rgba(255, 246, 222, ${0.25 + r() * 0.65})`;
      sctx.beginPath();
      sctx.arc(sx, sy, sr, 0, Math.PI * 2);
      sctx.fill();
    }
  }

  // Atmospheric sun/moon halo
  const halo = sctx.createRadialGradient(pal.sun.x, pal.sun.y, pal.sun.r * 0.2, pal.sun.x, pal.sun.y, pal.sun.r * 5.2);
  halo.addColorStop(0, pal.sun.glow);
  halo.addColorStop(0.55, pal.sun.glow.replace(/[\d.]+\)$/, '0.12)'));
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = halo;
  sctx.fillRect(0, 0, W, H);

  const orb = sctx.createRadialGradient(pal.sun.x, pal.sun.y, 2, pal.sun.x, pal.sun.y, pal.sun.r);
  orb.addColorStop(0, pal.sun.inner);
  orb.addColorStop(0.7, pal.sun.outer);
  orb.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = orb;
  sctx.beginPath();
  sctx.arc(pal.sun.x, pal.sun.y, pal.sun.r, 0, Math.PI * 2);
  sctx.fill();

  // Subtle horizon reflection mist
  const mist = sctx.createLinearGradient(0, H * 0.62, 0, H);
  mist.addColorStop(0, 'rgba(255,255,255,0)');
  mist.addColorStop(1, pal.cave ? 'rgba(90, 42, 18, 0.25)' : 'rgba(255, 232, 195, 0.18)');
  sctx.fillStyle = mist;
  sctx.fillRect(0, H * 0.62, W, H * 0.38);

  // 2. Tileable painterly Mediterranean cumulus clouds (960×280, seamless wrap, zero interior rings, instant render)
  const [clouds, cctx] = makeCanvas(W, 280);
  const [cloudBuf, bctx] = makeCanvas(340, 130);
  const cloudCount = pal.cave ? 3 : 7;

  for (let i = 0; i < cloudCount; i++) {
    const cx = (i / cloudCount) * W + (r() - 0.5) * 70;
    const cy = 54 + r() * 114;
    const span = 120 + r() * 110;
    const height = 28 + r() * 22;
    const domeCount = 5 + Math.floor(r() * 3);

    // Step 1: Build unified soft-edged cloud alpha silhouette on small scratch buffer
    bctx.clearRect(0, 0, cloudBuf.width, cloudBuf.height);
    bctx.globalCompositeOperation = 'source-over';
    const midX = cloudBuf.width / 2;
    const baseY = cloudBuf.height - 26;

    const stampSoftPuff = (px: number, py: number, rx: number, ry: number, peakAlpha: number) => {
      bctx.save();
      bctx.translate(px, py);
      bctx.scale(1, ry / rx);
      const g = bctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
      g.addColorStop(0, `rgba(255,255,255,${peakAlpha})`);
      g.addColorStop(0.58, `rgba(255,255,255,${peakAlpha * 0.65})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      bctx.fillStyle = g;
      bctx.beginPath();
      bctx.arc(0, 0, rx, 0, Math.PI * 2);
      bctx.fill();
      bctx.restore();
    };

    // Soft flat-bottomed cloud base + arched cumulus domes
    stampSoftPuff(midX, baseY, span * 0.52, height * 0.34, 0.85);
    for (let k = 0; k < domeCount; k++) {
      const t = (k + 0.5) / domeCount;
      const arch = Math.sin(t * Math.PI);
      const dx = (t - 0.5) * span * 0.84;
      const dy = -arch * height * 0.58 + (r() - 0.5) * 4;
      const rx = span * (0.2 + arch * 0.15);
      const ry = height * (0.4 + arch * 0.36);
      stampSoftPuff(midX + dx, baseY + dy, rx, ry, 0.88);
    }

    // Step 2: Apply ONE unified vertical sunlit-to-underside shading pass across the whole silhouette
    bctx.globalCompositeOperation = 'source-in';
    const shadeGrad = bctx.createLinearGradient(0, baseY - height * 1.1, 0, baseY + height * 0.45);
    shadeGrad.addColorStop(0, pal.cloudLight);
    shadeGrad.addColorStop(0.58, pal.cloudLight);
    shadeGrad.addColorStop(1, pal.cloudShadow);
    bctx.fillStyle = shadeGrad;
    bctx.fillRect(0, 0, cloudBuf.width, cloudBuf.height);
    bctx.globalCompositeOperation = 'source-over';

    // Draw seamlessly wrapped across tile edges
    for (const offset of [-W, 0, W]) {
      cctx.drawImage(cloudBuf, Math.round(cx + offset - midX), Math.round(cy - baseY));
    }
  }

  // 3. Soft feathered atmospheric volumetric sun shafts (multi-pass concentric feathering, zero hard edges)
  const [rays, rctx] = makeCanvas(W, H);
  rctx.save();
  const rayCount = pal.cave ? 4 : 5;
  const featherLayers = [
    { scale: 2.1, alpha: 0.16 },
    { scale: 1.55, alpha: 0.24 },
    { scale: 1.1, alpha: 0.32 },
    { scale: 0.68, alpha: 0.36 },
  ];
  for (let i = 0; i < rayCount; i++) {
    const originX = pal.sun.x + (i - (rayCount - 1) / 2) * 62;
    const originY = pal.cave ? -35 : pal.sun.y - 40;
    const spread = 46 + r() * 44;
    const dx = pal.cave ? -70 + i * 48 : -250 - i * 48;
    const grad = rctx.createLinearGradient(originX, originY, originX + dx, H * 0.92);
    grad.addColorStop(0, pal.rayColor.replace(/[\d.]+\)$/, '0.02)'));
    grad.addColorStop(0.22, pal.rayColor);
    grad.addColorStop(0.68, pal.rayColor.replace(/[\d.]+\)$/, '0.045)'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    rctx.fillStyle = grad;

    for (const layer of featherLayers) {
      rctx.globalAlpha = layer.alpha;
      const topHalf = spread * 0.16 * layer.scale;
      const botHalf = spread * 0.92 * layer.scale;
      rctx.beginPath();
      rctx.moveTo(originX - topHalf, originY);
      rctx.lineTo(originX + topHalf, originY);
      rctx.lineTo(originX + dx + botHalf * 1.15, H);
      rctx.lineTo(originX + dx - botHalf * 0.85, H);
      rctx.closePath();
      rctx.fill();
    }
  }
  rctx.restore();

  // 4. Far parallax layer (seamless 960×540 Mediterranean coastal mountain ridge & distant acropolis)
  const [far, fctx] = makeCanvas(W, H);
  if (pal.cave) {
    // Deep vaulted cavern arches and stalactites
    const archGrad = fctx.createLinearGradient(0, 0, 0, H);
    archGrad.addColorStop(0, '#0d0908');
    archGrad.addColorStop(1, '#261b16');
    fctx.fillStyle = archGrad;
    fctx.beginPath();
    fctx.moveTo(0, 0);
    fctx.lineTo(W, 0);
    fctx.lineTo(W, 130);
    for (let x = W; x >= 0; x -= 48) {
      const y = 78 + Math.sin(x * 0.025) * 32 + (x % 96 === 0 ? 42 : 0);
      fctx.lineTo(x, y);
    }
    fctx.closePath();
    fctx.fill();

    // Distant cavernous stone pillars
    for (let i = 0; i < 6; i++) {
      const px = 70 + i * 165;
      const g = fctx.createLinearGradient(px - 36, 0, px + 36, 0);
      g.addColorStop(0, '#140f0d');
      g.addColorStop(0.5, '#2b221d');
      g.addColorStop(1, '#120d0b');
      fctx.fillStyle = g;
      fctx.beginPath();
      fctx.moveTo(px - 28, 0);
      fctx.quadraticCurveTo(px - 16, H * 0.5, px - 42, H);
      fctx.lineTo(px + 42, H);
      fctx.quadraticCurveTo(px + 18, H * 0.5, px + 26, 0);
      fctx.closePath();
      fctx.fill();
    }
  } else {
    // Layered Mediterranean coastal mountains (periodic for seamless TileSprite)
    const ridgeY = (x: number) =>
      340 -
      Math.sin((x / W) * Math.PI * 2) * 44 -
      Math.sin((x / W) * Math.PI * 4 + 1.1) * 28 -
      Math.cos((x / W) * Math.PI * 6 + 0.4) * 14;

    // Distant marble temple rising cleanly from behind the hilltop ridge crest
    const templeX = pal.palace ? 560 : 250;
    const templeY = ridgeY(templeX) + 8;
    drawDoricRuins(fctx, templeX - 45, templeY, pal.palace ? 0.62 : 0.48, pal.ruinLight, pal.ruinShade, pal.palace ? 6 : 5, true);

    const grad = fctx.createLinearGradient(0, 210, 0, H);
    grad.addColorStop(0, pal.farCliff[0]);
    grad.addColorStop(1, pal.farCliff[1]);
    fctx.fillStyle = grad;
    fctx.beginPath();
    fctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) fctx.lineTo(x, ridgeY(x));
    fctx.lineTo(W, H);
    fctx.closePath();
    fctx.fill();

    // Rim lighting on ridge crest
    fctx.strokeStyle = pal.farRim;
    fctx.lineWidth = 2.5;
    fctx.beginPath();
    for (let x = 0; x <= W; x += 12) {
      if (x === 0) fctx.moveTo(x, ridgeY(x));
      else fctx.lineTo(x, ridgeY(x));
    }
    fctx.stroke();
  }

  // 5. Midground parallax layer (coastal limestone cliffs, ruined marble colonnades & cypress groves)
  const [mid, mctx] = makeCanvas(W, H);
  if (pal.cave) {
    // Midground cave boulders & glowing hearth crevices
    const grad = mctx.createLinearGradient(0, 320, 0, H);
    grad.addColorStop(0, pal.midCliff[0]);
    grad.addColorStop(1, pal.midCliff[1]);
    mctx.fillStyle = grad;
    mctx.beginPath();
    mctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 24) {
      const y = 395 - Math.abs(Math.sin((x / W) * Math.PI * 3)) * 55;
      mctx.lineTo(x, y);
    }
    mctx.lineTo(W, H);
    mctx.closePath();
    mctx.fill();
  } else {
    const midY = (x: number) =>
      405 -
      Math.sin((x / W) * Math.PI * 2 + 1.4) * 32 -
      Math.cos((x / W) * Math.PI * 4 + 0.5) * 18;

    // Ancient marble colonnade ruins nestled behind the coastal headland ridge so the terrain wraps across their foundations
    drawDoricRuins(mctx, 115, midY(145) + 10, 0.72, pal.ruinLight, pal.ruinShade, 4, false);
    drawDoricRuins(mctx, 690, midY(730) + 10, 0.76, pal.ruinLight, pal.ruinShade, 5, pal.palace ? true : false);

    const grad = mctx.createLinearGradient(0, 320, 0, H);
    grad.addColorStop(0, pal.midCliff[0]);
    grad.addColorStop(0.55, pal.midCliff[1]);
    grad.addColorStop(1, '#121822');
    mctx.fillStyle = grad;
    mctx.beginPath();
    mctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) mctx.lineTo(x, midY(x));
    mctx.lineTo(W, H);
    mctx.closePath();
    mctx.fill();

    // Stratified limestone cliff striations
    mctx.strokeStyle = 'rgba(255,255,255,0.06)';
    mctx.lineWidth = 1.5;
    for (let band = 1; band <= 4; band++) {
      mctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        const y = midY(x) + band * 22 + Math.sin(x * 0.04 + band) * 4;
        if (x === 0) mctx.moveTo(x, y);
        else mctx.lineTo(x, y);
      }
      mctx.stroke();
    }

    // Sunlit cliff rim
    mctx.strokeStyle = pal.midRim;
    mctx.lineWidth = 2;
    mctx.beginPath();
    for (let x = 0; x <= W; x += 12) {
      if (x === 0) mctx.moveTo(x, midY(x));
      else mctx.lineTo(x, midY(x));
    }
    mctx.stroke();

    const cypressSpots = [62, 84, 245, 266, 480, 512, 648, 862, 888];
    for (let i = 0; i < cypressSpots.length; i++) {
      const cx = cypressSpots[i];
      drawCypress(mctx, cx, midY(cx) + 6, 42 + (i % 3) * 14, pal.foliage[0], pal.foliage[1]);
    }
    drawOliveTree(mctx, 355, midY(355) + 6, 0.8, pal.foliage[0], pal.foliage[1]);
    drawOliveTree(mctx, 815, midY(815) + 6, 0.72, pal.foliage[0], pal.foliage[1]);
  }

  return { sky, clouds, rays, far, mid };
}

/** Smooth shimmering Mediterranean water texture (256×96 tileable horizontally). */
export function realisticWaterTexture(theme: Theme | 'menu'): HTMLCanvasElement {
  const pal = PALETTES[theme];
  const [c, ctx] = makeCanvas(256, 96);

  const grad = ctx.createLinearGradient(0, 0, 0, 96);
  grad.addColorStop(0, pal.waterTop);
  grad.addColorStop(0.42, pal.waterMid);
  grad.addColorStop(1, pal.waterDeep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 96);

  // Subtle translucent wave crests & specular sunlight shimmer streaks
  for (let row = 0; row < 10; row++) {
    const y = 5 + row * 9;
    const alpha = Math.max(0.08, 0.42 - row * 0.035);
    ctx.strokeStyle = pal.shimmer;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = row < 2 ? 2.2 : 1.3;
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 8) {
      const wy = y + Math.sin((x / 256) * Math.PI * 4 + row * 1.3) * 2.2;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();

    // Dashed caustic glint highlights
    ctx.fillStyle = pal.shimmer;
    ctx.globalAlpha = alpha * 0.9;
    for (let k = 0; k < 4; k++) {
      const gx = ((k * 64 + row * 29) % 240);
      const gw = 12 + ((row + k) % 3) * 8;
      ctx.fillRect(gx, y - 1, gw, 1.5);
    }
  }
  ctx.globalAlpha = 1;

  // Bright shoreline crest foam at y=0..4
  const foam = ctx.createLinearGradient(0, 0, 0, 6);
  foam.addColorStop(0, 'rgba(255, 252, 240, 0.72)');
  foam.addColorStop(1, 'rgba(255, 252, 240, 0)');
  ctx.fillStyle = foam;
  ctx.fillRect(0, 0, 256, 6);

  return c;
}

/**
 * High-detail painterly 32×32 procedural terrain tileset (14 tiles × 32px = 448×32).
 * Keeps exact TILE_INDEX alignment with existing levels.ts and ChapterScene.ts.
 */
export function realisticTileset(): HTMLCanvasElement {
  const N = 14;
  const T = 32;
  const [c, ctx] = makeCanvas(T * N, T);
  const r = rng(404);

  const stoneBase = (idx: number, topCol: string, botCol: string, veinCol: string, highlightCol: string) => {
    const ox = idx * T;
    const g = ctx.createLinearGradient(ox, 0, ox, T);
    g.addColorStop(0, topCol);
    g.addColorStop(1, botCol);
    ctx.fillStyle = g;
    ctx.fillRect(ox, 0, T, T);

    // Subtle stone blocks / strata + grain
    ctx.strokeStyle = veinCol;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, 11);
    ctx.lineTo(ox + T, 11);
    ctx.moveTo(ox, 23);
    ctx.lineTo(ox + T, 23);
    ctx.moveTo(ox + 15, 0);
    ctx.lineTo(ox + 15, 11);
    ctx.moveTo(ox + 7, 11);
    ctx.lineTo(ox + 7, 23);
    ctx.moveTo(ox + 22, 11);
    ctx.lineTo(ox + 22, 23);
    ctx.moveTo(ox + 13, 23);
    ctx.lineTo(ox + 13, T);
    ctx.stroke();

    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = i % 2 === 0 ? highlightCol : veinCol;
      ctx.fillRect(ox + r() * (T - 2), r() * (T - 2), 1.8, 1.8);
    }
    // Subtle underside ambient occlusion shadow
    const ao = ctx.createLinearGradient(ox, T - 5, ox, T);
    ao.addColorStop(0, 'rgba(0,0,0,0)');
    ao.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = ao;
    ctx.fillRect(ox, T - 5, T, 5);
  };

  const capLayer = (idx: number, topLight: string, midCol: string, shadowCol: string, height = 9) => {
    const ox = idx * T;
    // Contact shadow below turf/lip
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.fillRect(ox, height, T, 3);

    const g = ctx.createLinearGradient(ox, 0, ox, height);
    g.addColorStop(0, topLight);
    g.addColorStop(0.55, midCol);
    g.addColorStop(1, shadowCol);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox + T, 0);
    ctx.lineTo(ox + T, height);
    for (let x = T; x >= 0; x -= 4) {
      ctx.lineTo(ox + x, height + Math.sin(x * 0.7 + idx) * 2);
    }
    ctx.closePath();
    ctx.fill();

    // Top specular rim highlight
    ctx.fillStyle = 'rgba(255,255,240,0.32)';
    ctx.fillRect(ox, 0, T, 2);
  };

  // 0: Grass + Mediterranean terracotta earth
  stoneBase(0, '#8d623b', '#5e3f25', 'rgba(42,24,10,0.28)', 'rgba(232,190,136,0.18)');
  capLayer(0, '#78be52', '#4c8e3a', '#2e5d24', 9);
  // 1: Earth fill
  stoneBase(1, '#7f5634', '#52361f', 'rgba(38,20,8,0.3)', 'rgba(218,176,124,0.14)');

  // 2: Sunlit golden Aegean sandstone + beach crest
  stoneBase(2, '#e2c78e', '#be9b5e', 'rgba(110,80,38,0.22)', 'rgba(255,248,220,0.32)');
  capLayer(2, '#fff2cc', '#edd498', '#c7a462', 6);
  // 3: Sandstone fill
  stoneBase(3, '#d6b77a', '#aa874c', 'rgba(98,68,30,0.26)', 'rgba(255,242,202,0.2)');

  // 4: Volcanic cavern basalt + damp moss
  stoneBase(4, '#4e4742', '#2c2725', 'rgba(12,10,9,0.45)', 'rgba(165,152,138,0.14)');
  capLayer(4, '#7d924d', '#546633', '#313d1e', 7);
  // 5: Basalt fill
  stoneBase(5, '#3b3532', '#221e1c', 'rgba(10,8,8,0.48)', 'rgba(140,128,118,0.12)');

  // 6: Sculpted Pentelic marble + gold meander trim + lush garden turf (Aeolus / Ithaca)
  stoneBase(6, '#ece5d6', '#c8beaa', 'rgba(112,102,88,0.25)', 'rgba(255,255,255,0.45)');
  capLayer(6, '#90d168', '#5fa649', '#3d7031', 7);
  ctx.fillStyle = '#d4a957';
  ctx.fillRect(6 * T, 10, T, 3);
  ctx.fillStyle = '#997030';
  ctx.fillRect(6 * T, 13, T, 1);
  // 7: Marble masonry fill
  stoneBase(7, '#dcd4c4', '#b8ae9a', 'rgba(104,96,82,0.28)', 'rgba(255,252,244,0.35)');

  // 8: Wet coastal slate cliff rock (Sirens & Passage)
  stoneBase(8, '#465863', '#27353d', 'rgba(10,18,24,0.42)', 'rgba(182,216,232,0.18)');
  capLayer(8, '#66997a', '#3d6b54', '#244536', 7);
  // 9: Deep wet slate fill
  stoneBase(9, '#33434c', '#1c272e', 'rgba(8,14,18,0.45)', 'rgba(160,196,214,0.14)');

  // 10: Detailed carved cedar wood platform (one-way)
  {
    const ox = 10 * T;
    const wg = ctx.createLinearGradient(ox, 0, ox, 11);
    wg.addColorStop(0, '#cc9a5d');
    wg.addColorStop(0.35, '#9d6a38');
    wg.addColorStop(1, '#5e3c1d');
    ctx.fillStyle = wg;
    ctx.fillRect(ox, 0, T, 11);
    ctx.fillStyle = '#f2cc8f';
    ctx.fillRect(ox, 0, T, 2);
    ctx.fillStyle = '#3d2410';
    ctx.fillRect(ox, 10, T, 2);
    // Support brackets + brass rivets
    ctx.fillStyle = '#6c4622';
    ctx.fillRect(ox + 4, 11, 5, 6);
    ctx.fillRect(ox + 23, 11, 5, 6);
    ctx.fillStyle = '#e5be70';
    ctx.fillRect(ox + 6, 4, 2, 2);
    ctx.fillRect(ox + 24, 4, 2, 2);
  }

  // 11: Sculpted sunlit marble-cloud platform (Aeolus)
  {
    const ox = 11 * T;
    const cg = ctx.createLinearGradient(ox, 0, ox, 15);
    cg.addColorStop(0, '#ffffff');
    cg.addColorStop(0.65, '#e8f3fa');
    cg.addColorStop(1, '#b8d2e6');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(ox + 8, 8, 9, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(ox + 17, 7, 10, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(ox + 25, 8, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(ox + 3, 2, T - 6, 2);
  }

  // 12: Weathered harbor pier timber planks & pilings
  {
    const ox = 12 * T;
    const dg = ctx.createLinearGradient(ox, 0, ox, 10);
    dg.addColorStop(0, '#c29058');
    dg.addColorStop(0.45, '#8c5c30');
    dg.addColorStop(1, '#543519');
    ctx.fillStyle = dg;
    ctx.fillRect(ox, 0, T, 10);
    ctx.fillStyle = '#e8c18b';
    ctx.fillRect(ox, 0, T, 2);
    ctx.fillStyle = '#3b2410';
    ctx.fillRect(ox + 10, 0, 1.5, 10);
    ctx.fillRect(ox + 21, 0, 1.5, 10);
    // Pilings
    ctx.fillStyle = '#5c3b1e';
    ctx.fillRect(ox + 3, 10, 6, 22);
    ctx.fillRect(ox + 23, 10, 6, 22);
    ctx.fillStyle = 'rgba(255,230,190,0.18)';
    ctx.fillRect(ox + 4, 10, 2, 22);
    ctx.fillRect(ox + 24, 10, 2, 22);
  }

  // 13: Cave ceiling rock with hanging wet stalactite tips
  stoneBase(13, '#241f1c', '#3b332e', 'rgba(8,6,6,0.55)', 'rgba(128,118,110,0.12)');
  ctx.fillStyle = '#2d2724';
  ctx.beginPath();
  ctx.moveTo(13 * T + 5, T);
  ctx.lineTo(13 * T + 9, T - 5);
  ctx.lineTo(13 * T + 13, T);
  ctx.moveTo(13 * T + 20, T);
  ctx.lineTo(13 * T + 24, T - 6);
  ctx.lineTo(13 * T + 28, T);
  ctx.fill();

  return c;
}

/** Realistic classical Greek trireme galley for exits and title screen. */
export function realisticShipTexture(sailColor = '#fbf0d4', trimColor = '#b48a48'): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(210, 155);

  // Subtle water reflection under hull
  const ref = ctx.createRadialGradient(105, 146, 8, 105, 146, 84);
  ref.addColorStop(0, 'rgba(12, 24, 38, 0.45)');
  ref.addColorStop(1, 'rgba(12, 24, 38, 0)');
  ctx.fillStyle = ref;
  ctx.fillRect(15, 134, 180, 20);

  // Mast & rigging ropes
  ctx.strokeStyle = 'rgba(240, 222, 185, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(106, 22);
  ctx.lineTo(36, 114);
  ctx.moveTo(106, 22);
  ctx.lineTo(176, 114);
  ctx.stroke();

  ctx.fillStyle = '#52341a';
  ctx.fillRect(102, 18, 8, 100);
  ctx.fillStyle = '#7c532e';
  ctx.fillRect(102, 18, 3, 100);

  // Billowing square sail with soft cloth shading
  const sailGrad = ctx.createLinearGradient(52, 28, 162, 104);
  sailGrad.addColorStop(0, '#fffdf5');
  sailGrad.addColorStop(0.55, sailColor);
  sailGrad.addColorStop(1, '#cfb98e');
  ctx.fillStyle = sailGrad;
  ctx.beginPath();
  ctx.moveTo(56, 30);
  ctx.quadraticCurveTo(108, 38, 160, 30);
  ctx.quadraticCurveTo(174, 66, 156, 102);
  ctx.quadraticCurveTo(108, 112, 60, 102);
  ctx.quadraticCurveTo(46, 66, 56, 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#73532d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Golden sun emblem on sail
  ctx.fillStyle = trimColor;
  ctx.beginPath();
  ctx.arc(108, 67, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6c4920';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Yardarm
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(48, 26, 118, 5);

  // Curved cedar hull with bronze ram
  const hullGrad = ctx.createLinearGradient(0, 108, 0, 146);
  hullGrad.addColorStop(0, '#8d5a2e');
  hullGrad.addColorStop(0.5, '#5e3a1c');
  hullGrad.addColorStop(1, '#311d0d');
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(34, 112);
  ctx.quadraticCurveTo(22, 92, 32, 82);
  ctx.quadraticCurveTo(38, 88, 44, 106);
  ctx.lineTo(166, 108);
  ctx.quadraticCurveTo(176, 98, 180, 92);
  ctx.lineTo(186, 118);
  ctx.lineTo(202, 126); // Bronze ram
  ctx.lineTo(182, 134);
  ctx.quadraticCurveTo(110, 146, 44, 134);
  ctx.quadraticCurveTo(34, 126, 34, 112);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#241408';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Decorative shields & oars along the gunwale
  for (let i = 0; i < 6; i++) {
    const sx = 64 + i * 17;
    ctx.fillStyle = i % 2 === 0 ? '#d8af63' : '#9c4338';
    ctx.beginPath();
    ctx.arc(sx, 115, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a180c';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  return c;
}

/** Soft elliptical ground contact shadow for hero, NPCs, and props. */
export function contactShadowTexture(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(44, 14);
  const g = ctx.createRadialGradient(22, 7, 2, 22, 7, 20);
  g.addColorStop(0, 'rgba(8, 10, 16, 0.55)');
  g.addColorStop(0.65, 'rgba(8, 10, 16, 0.22)');
  g.addColorStop(1, 'rgba(8, 10, 16, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 44, 14);
  return c;
}

/** Painterly victory & game-over ending backdrops. */
export function realisticEndingBackdrop(kind: 'victory' | 'death'): HTMLCanvasElement {
  const b = realisticBackdrop(kind === 'victory' ? 'ithaca' : 'passage');
  const [c, ctx] = makeCanvas(W, H);
  ctx.drawImage(b.sky, 0, 0);
  ctx.drawImage(b.clouds, 0, 10);
  ctx.drawImage(b.rays, 0, 0);
  ctx.drawImage(b.far, 0, 0);
  ctx.drawImage(b.mid, 0, 0);

  // Shimmering water band across bottom
  const water = realisticWaterTexture(kind === 'victory' ? 'ithaca' : 'passage');
  for (let x = 0; x < W; x += water.width) {
    ctx.drawImage(water, x, 430, water.width, 110);
  }

  if (kind === 'victory') {
    // Stone harbor pier at right
    const pier = ctx.createLinearGradient(520, 412, 520, 460);
    pier.addColorStop(0, '#d8ccb4');
    pier.addColorStop(1, '#7c6e58');
    ctx.fillStyle = pier;
    ctx.fillRect(520, 412, 440, 26);
    ctx.fillStyle = '#5c4e3d';
    for (let x = 540; x < W; x += 64) ctx.fillRect(x, 438, 14, 102);
  } else {
    // Dark storm vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 560);
    v.addColorStop(0, 'rgba(20, 8, 12, 0.25)');
    v.addColorStop(1, 'rgba(10, 4, 6, 0.78)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  return c;
}
