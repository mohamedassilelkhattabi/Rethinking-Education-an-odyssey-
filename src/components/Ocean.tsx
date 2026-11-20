function wavePath(width: number, height: number, amp: number, wavelength: number, baseline: number): string {
  let d = `M0 ${baseline}`;
  const half = wavelength / 2;
  let up = true;
  for (let x = 0; x < width; x += half) {
    d += ` Q${x + half / 2} ${baseline + (up ? -amp : amp)} ${x + half} ${baseline}`;
    up = !up;
  }
  return `${d} L${width} ${height} L0 ${height} Z`;
}

export interface WaveLayer {
  color: string;
  amp: number;
  wavelength: number;
  duration: number;
  offset: number;
  opacity?: number;
}

export const DEFAULT_WAVES: WaveLayer[] = [
  { color: '#1d4d6e', amp: 8, wavelength: 240, duration: 26, offset: 18, opacity: 0.9 },
  { color: '#163b5c', amp: 10, wavelength: 288, duration: 19, offset: 40 },
  { color: '#0f2c46', amp: 12, wavelength: 360, duration: 14, offset: 64 },
];

export const STORM_WAVES: WaveLayer[] = [
  { color: '#2a3a48', amp: 18, wavelength: 180, duration: 9, offset: 22 },
  { color: '#1b2a37', amp: 22, wavelength: 288, duration: 6.5, offset: 48 },
  { color: '#0e1822', amp: 26, wavelength: 360, duration: 4.8, offset: 76 },
];

export const DAWN_WAVES: WaveLayer[] = [
  { color: '#e8a873', amp: 6, wavelength: 240, duration: 30, offset: 14, opacity: 0.55 },
  { color: '#2f8190', amp: 8, wavelength: 288, duration: 22, offset: 34 },
  { color: '#163b5c', amp: 10, wavelength: 360, duration: 16, offset: 58 },
];

/** Layered, endlessly scrolling SVG waves. Each layer is twice as wide as the screen and slides by half. */
export function Ocean({ layers = DEFAULT_WAVES, className = '', height = 140 }: { layers?: WaveLayer[]; className?: string; height?: number }) {
  const W = 2880;
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden ${className}`} style={{ height }} aria-hidden>
      {layers.map((l, i) => (
        <svg
          key={i}
          className="anim-wave absolute bottom-0 left-0"
          style={{ width: '200%', height: '100%', animationDuration: `${l.duration}s`, opacity: l.opacity ?? 1 }}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
        >
          <path d={wavePath(W, height, l.amp, l.wavelength, l.offset)} fill={l.color} />
        </svg>
      ))}
    </div>
  );
}
