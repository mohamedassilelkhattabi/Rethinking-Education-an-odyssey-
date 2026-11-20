import { motion, useReducedMotion } from 'motion/react';
import { useMemo, type KeyboardEvent } from 'react';
import { LOCATIONS } from '../data/chapters';

/** Map coordinates for Troy → Lotus-Eaters → Cyclops → Aeolus → Sirens → Scylla & Charybdis → Ithaca Harbor → Palace of Ithaca */
const POINTS = [
  { x: 885, y: 175 },
  { x: 640, y: 515 },
  { x: 350, y: 440 },
  { x: 255, y: 270 },
  { x: 360, y: 185 },
  { x: 455, y: 335 },
  { x: 560, y: 295 },
  { x: 655, y: 215 },
];
/** Control points for each curved leg (i → i+1). */
const CONTROLS = [
  { x: 820, y: 420 },
  { x: 495, y: 525 },
  { x: 230, y: 375 },
  { x: 270, y: 195 },
  { x: 425, y: 235 },
  { x: 505, y: 355 },
  { x: 625, y: 280 },
];

function legPath(i: number) {
  const a = POINTS[i];
  const b = POINTS[i + 1];
  const c = CONTROLS[i];
  return `M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}`;
}

function legSamples(i: number, n = 24) {
  const a = POINTS[i];
  const b = POINTS[i + 1];
  const c = CONTROLS[i];
  const xs: number[] = [];
  const ys: number[] = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    xs.push((1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x);
    ys.push((1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y);
  }
  return { xs, ys };
}

export type LocationStatus = 'completed' | 'current' | 'locked';

interface WorldMapProps {
  statuses: LocationStatus[];
  shipAt: number;
  shipMove: { from: number; to: number } | null;
  onShipArrived: () => void;
  onSelect: (locationIndex: number) => void;
  selected: number | null;
}

const SHIP_W = 86;
const SHIP_H = 58;
/** Label placement per location, chosen so labels don't cover neighbouring markers. */
const LABEL_OFFSETS: [number, number][] = [
  [0, 50],
  [0, 50],
  [0, 50],
  [-92, 0],
  [0, -48],
  [60, 50],
  [0, 50],
  [64, -42],
];

export function WorldMap({ statuses, shipAt, shipMove, onShipArrived, onSelect, selected }: WorldMapProps) {
  const reduce = useReducedMotion();
  const moving = shipMove && shipMove.to === shipMove.from + 1 && shipMove.from >= 0 && shipMove.to < POINTS.length;
  const anim = useMemo(() => (moving ? legSamples(shipMove!.from) : null), [moving, shipMove]);
  const rest = POINTS[Math.min(shipAt, POINTS.length - 1)];
  const facingLeft = (() => {
    const leg = moving ? shipMove!.from : Math.max(0, Math.min(shipAt, POINTS.length - 1) - 1);
    return POINTS[leg + 1] ? POINTS[leg + 1].x < POINTS[leg].x : false;
  })();

  const key = (i: number) => (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onSelect(i);
    }
  };

  return (
    <svg viewBox="0 0 1000 600" className="h-auto w-full" role="group" aria-label="Map of Odysseus's voyage">
      <defs>
        <radialGradient id="map-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#5a3e1e" stopOpacity="0.45" />
        </radialGradient>
        <pattern id="map-sea" width="80" height="30" patternUnits="userSpaceOnUse">
          <path d="M0 15 Q20 6 40 15 T80 15" fill="none" stroke="#2f8190" strokeWidth="1" opacity="0.18" />
        </pattern>
        <filter id="ink-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
      </defs>
      <rect width="1000" height="600" fill="url(#map-sea)" />

      {/* Lands — stylized Mediterranean */}
      <g fill="#d9c28e" stroke="#7a5a33" strokeWidth="2" filter="url(#ink-rough)" opacity="0.95">
        {/* Italy */}
        <path d="M0 40 Q110 70 190 140 Q250 200 320 245 Q372 278 392 318 L378 330 Q352 315 336 330 Q330 300 300 280 Q240 240 190 210 Q110 160 40 150 Q15 148 0 150 Z" />
        <path d="M330 250 Q380 240 430 268 L420 282 Q380 268 348 268 Z" />
        {/* Sicily */}
        <path d="M238 392 Q300 372 372 372 Q360 400 336 438 Q290 428 238 392 Z" />
        {/* Aeolian isles */}
        <circle cx="262" cy="276" r="7" />
        <circle cx="284" cy="268" r="5" />
        <circle cx="248" cy="262" r="4" />
        {/* Greece */}
        <path d="M600 0 L800 0 Q790 60 760 100 Q730 140 745 190 Q760 240 720 270 Q690 300 705 350 Q720 400 680 430 Q645 420 630 380 Q610 340 622 300 Q630 250 606 210 Q585 160 600 110 Q610 60 600 0 Z" />
        {/* Ithaca + Kefalonia */}
        <path d="M556 262 Q572 250 586 266 Q580 290 562 300 Q548 286 556 262 Z" />
        <path d="M528 290 Q548 284 552 310 Q540 332 522 322 Q516 302 528 290 Z" />
        {/* Asia Minor */}
        <path d="M860 0 L1000 0 L1000 420 Q960 400 930 360 Q900 320 905 280 Q880 240 872 200 Q862 150 880 110 Q868 60 860 0 Z" />
        {/* Crete */}
        <path d="M700 480 Q760 462 840 470 Q830 492 760 498 Q720 500 700 480 Z" />
        {/* Africa */}
        <path d="M0 560 Q160 530 330 548 Q450 560 520 540 Q600 530 680 548 Q820 570 1000 545 L1000 600 L0 600 Z" />
      </g>

      {/* Ornaments */}
      <g opacity="0.55" aria-hidden>
        <g transform="translate(110 500)">
          <circle r="44" fill="none" stroke="#6b4c2c" strokeWidth="1.2" />
          <circle r="34" fill="none" stroke="#6b4c2c" strokeWidth="0.6" strokeDasharray="2 4" />
          <path d="M0 -50 L8 0 L0 50 L-8 0 Z" fill="#966e42" />
          <path d="M-50 0 L0 -8 L50 0 L0 8 Z" fill="#6b4c2c" />
          <text y="-56" textAnchor="middle" className="fill-[#6b4c2c] font-display text-[13px] font-bold">N</text>
        </g>
        {/* sea serpent */}
        <path d="M700 330 q12 -18 24 0 t24 0 t24 0" fill="none" stroke="#6b4c2c" strokeWidth="3" strokeLinecap="round" />
        <circle cx="772" cy="326" r="2" fill="#6b4c2c" />
        <text x="470" y="160" className="fill-[#7a5a33] font-serif text-[22px] italic" opacity="0.8">Mare Ionium</text>
        <text x="640" y="560" className="fill-[#5a3e1e] font-display text-[14px] tracking-[0.3em]">LIBYA</text>
        <text x="880" y="470" className="fill-[#5a3e1e] font-display text-[12px] tracking-[0.3em]">AEGEAN</text>
      </g>

      {/* Route legs */}
      {CONTROLS.map((_, i) => {
        const sailed = statuses[i + 1] === 'completed' || (statuses[i + 1] === 'current' && (!moving || shipMove!.to !== i + 1));
        return (
          <path
            key={i}
            d={legPath(i)}
            fill="none"
            stroke={sailed ? '#b48a48' : '#6b4c2c'}
            strokeWidth={sailed ? 4 : 2.2}
            strokeDasharray={sailed ? '0' : '8 8'}
            opacity={sailed ? 0.95 : 0.45}
            strokeLinecap="round"
          />
        );
      })}
      {moving && (
        <motion.path
          d={legPath(shipMove!.from)}
          fill="none"
          stroke="#d8af63"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 2.6, ease: 'easeInOut' }}
        />
      )}

      {/* Locations */}
      {LOCATIONS.map((loc, i) => {
        const p = POINTS[i];
        const status = statuses[i];
        const playable = status !== 'locked';
        const isSel = selected === i;
        const fill = status === 'completed' ? '#d8af63' : status === 'current' ? '#2f8190' : '#7c838b';
        return (
          <g
            key={loc.name}
            transform={`translate(${p.x} ${p.y})`}
            role={playable ? 'button' : 'img'}
            tabIndex={playable ? 0 : undefined}
            aria-label={`${loc.name}: ${status === 'completed' ? 'completed' : status === 'current' ? 'current destination' : 'locked'}`}
            onClick={playable ? () => onSelect(i) : undefined}
            onKeyDown={playable ? key(i) : undefined}
            className={playable ? 'group cursor-pointer outline-none' : ''}
          >
            {status === 'current' && <circle r="36" fill="rgba(95,184,196,.25)" stroke="#5fb8c4" strokeWidth="2.5" className="anim-glow" style={{ transformOrigin: 'center', transformBox: 'fill-box' }} />}
            {isSel && <circle r="31" fill="none" stroke="#f1d49a" strokeWidth="3.5" strokeDasharray="5 5" className="anim-spin-slow" style={{ transformOrigin: 'center', transformBox: 'fill-box' }} />}
            <g className="transition-transform duration-200 group-hover:scale-125 group-focus-visible:scale-125" style={{ transformOrigin: 'center', transformBox: 'fill-box' }}>
              <circle r="22" fill={fill} stroke="#3b2814" strokeWidth="3" />
              {status === 'completed' && <path d="M-9 0 L-3 7 L10 -7" fill="none" stroke="#3b2814" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
              {status === 'locked' && (
                <g>
                  <rect x="-7.5" y="-2" width="15" height="11" rx="2" fill="#eef0f2" />
                  <path d="M-4.5 -2 V-6 A4.5 4.5 0 0 1 4.5 -6 V-2" fill="none" stroke="#eef0f2" strokeWidth="2.6" strokeLinecap="round" />
                </g>
              )}
              {status === 'current' && <circle r="6" fill="#fff" />}
            </g>
            <g transform={`translate(${LABEL_OFFSETS[i][0]} ${LABEL_OFFSETS[i][1]})`}>
              <rect
                x={-(loc.name.length * 12.5 + 28) / 2}
                y="-17"
                width={loc.name.length * 12.5 + 28}
                height="34"
                rx="17"
                fill={status === 'locked' ? 'rgba(52,56,62,.82)' : 'rgba(16,27,45,.9)'}
                stroke={status === 'completed' ? '#d8af63' : status === 'current' ? '#5fb8c4' : '#9aa1a9'}
                strokeWidth="1.8"
              />
              <text textAnchor="middle" dy="7" className={`font-display text-[19px] font-bold tracking-wider ${status === 'locked' ? 'fill-[#d5d9de]' : 'fill-[#f0e2bf]'}`}>
                {loc.name}
              </text>
            </g>
          </g>
        );
      })}

      {/* Ship */}
      <motion.g
        key={moving ? `move-${shipMove!.from}` : `rest-${shipAt}`}
        initial={moving && anim ? { x: anim.xs[0] - SHIP_W / 2, y: anim.ys[0] - SHIP_H - 12 } : false}
        animate={
          moving && anim
            ? { x: anim.xs.map((v) => v - SHIP_W / 2), y: anim.ys.map((v) => v - SHIP_H - 12) }
            : { x: rest.x - SHIP_W / 2, y: rest.y - SHIP_H - 12 }
        }
        transition={moving ? { duration: reduce ? 0 : 2.6, ease: 'easeInOut' } : { duration: 0 }}
        onAnimationComplete={() => {
          if (moving) onShipArrived();
        }}
        style={{ pointerEvents: 'none' }}
      >
        <svg width={SHIP_W} height={SHIP_H} viewBox="0 0 240 160" aria-hidden style={{ overflow: 'visible' }}>
          <g transform={facingLeft ? 'translate(240 0) scale(-1 1)' : undefined}>
            <g className="anim-rock">
              <path d="M40 100 C30 96 19 80 23 64 C25 55 37 55 36 64 C34 73 39 86 53 96 L200 98 C206 94 210 88 212 80 L218 82 C216 95 214 104 214 110 L236 116 L212 123 C180 131 82 133 50 122 C44 118 40 110 40 100 Z" fill="#5e3a1e" stroke="#1f1208" strokeWidth="5" />
              <rect x="116" y="12" width="8" height="90" fill="#4a2f17" />
              <path d="M66 26 Q120 34 174 26 L168 92 Q120 102 72 92 Z" fill="#fbf1d8" stroke="#6b4c2c" strokeWidth="5" />
              <circle cx="120" cy="60" r="15" fill="#d8af63" stroke="#6b4c2c" strokeWidth="3" />
            </g>
          </g>
        </svg>
      </motion.g>

      <rect width="1000" height="600" fill="url(#map-vignette)" pointerEvents="none" />
    </svg>
  );
}
