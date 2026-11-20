/** Tiny pixel-art canvas: draw at logical resolution, then upscale with nearest-neighbour. */
export class Pix {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.ctx.imageSmoothingEnabled = false;
  }

  px(x: number, y: number, c: string | null | undefined) {
    if (!c) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  rect(x: number, y: number, w: number, h: number, c: string) {
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /** Draw a string matrix; '.' or ' ' are transparent. */
  rows(x: number, y: number, rows: string[], pal: Record<string, string>) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch !== '.' && ch !== ' ') this.px(x + i, y + j, pal[ch]);
      }
    });
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  disc(cx: number, cy: number, r: number, c: string) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.px(cx + x, cy + y, c);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) this.px(cx + x, cy + y, c);
  }

  /** Add a 1px outline around every opaque pixel (within an optional region). */
  outline(color: string, rx = 0, ry = 0, rw = this.w, rh = this.h) {
    const img = this.ctx.getImageData(0, 0, this.w, this.h);
    const d = img.data;
    const opaque = (x: number, y: number) => x >= rx && y >= ry && x < rx + rw && y < ry + rh && d[(y * this.w + x) * 4 + 3] > 0;
    const marks: [number, number][] = [];
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++) {
        if (opaque(x, y)) continue;
        if (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1)) marks.push([x, y]);
      }
    for (const [x, y] of marks) this.px(x, y, color);
  }

  /** Nearest-neighbour upscale into a new canvas. */
  scaled(s = 2): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w * s;
    c.height = this.h * s;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.canvas, 0, 0, c.width, c.height);
    return c;
  }
}

export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mix two hex colours. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

export const darken = (c: string, t = 0.3) => mix(c, '#000000', t);
export const lighten = (c: string, t = 0.3) => mix(c, '#ffffff', t);

export const OUTLINE = '#1a1208';
