import { useMemo } from 'react';
import type { ChapterTheme } from '../game/types';
import { AnimatedShip } from './AnimatedShip';
import { DAWN_WAVES, DEFAULT_WAVES, Ocean, STORM_WAVES, type WaveLayer } from './Ocean';

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Starfield({ count = 90, seed = 7, maxY = 60 }: { count?: number; seed?: number; maxY?: number }) {
  const stars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({ x: r() * 100, y: r() * maxY, s: r() * 1.8 + 0.4, d: r() * 4 }));
  }, [count, seed, maxY]);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {stars.map((st, i) => (
        <span
          key={i}
          className="anim-twinkle absolute rounded-full bg-[#fff6dc]"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s`, boxShadow: '0 0 6px rgba(255,240,200,.8)' }}
        />
      ))}
    </div>
  );
}

function Clouds({ color = '#0b1626', opacity = 0.8, seed = 3, count = 6, top = 0, speed = 90 }: { color?: string; opacity?: number; seed?: number; count?: number; top?: number; speed?: number }) {
  const clouds = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => ({ y: top + r() * 30, w: 260 + r() * 380, h: 50 + r() * 70, delay: -(r() * speed), dur: speed * (0.7 + r() * 0.6), key: i }));
  }, [seed, count, top, speed]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {clouds.map((c) => (
        <div
          key={c.key}
          className="absolute -left-[40%] rounded-[50%] blur-2xl"
          style={{ top: `${c.y}%`, width: c.w, height: c.h, background: color, opacity, animation: `drift-cloud ${c.dur}s linear ${c.delay}s infinite` }}
        />
      ))}
    </div>
  );
}

function Lightning({ className = '' }: { className?: string }) {
  return (
    <>
      <div className={`anim-lightning pointer-events-none absolute inset-0 bg-[#dfe9ff] mix-blend-screen ${className}`} aria-hidden />
      <svg className="anim-lightning pointer-events-none absolute left-[62%] top-0 h-[45%] w-24" viewBox="0 0 60 200" aria-hidden style={{ animationDelay: '0.05s' }}>
        <path d="M34 0 L18 74 L32 76 L12 140 L26 142 L8 200 L46 112 L30 110 L48 50 L34 48 Z" fill="#f4f8ff" opacity="0.9" />
      </svg>
    </>
  );
}

function Rain() {
  return (
    <div className="pointer-events-none absolute -inset-[20%] opacity-40" aria-hidden>
      <div
        className="anim-rain absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(105deg, transparent 0 14px, rgba(200,220,255,.55) 14px 15px, transparent 15px 34px)', backgroundSize: '120px 120px' }}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Title / introduction scene
// ═════════════════════════════════════════════════════════════

export function TitleScene({ shipSailing = true }: { shipSailing?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#050b16 0%,#0b1a30 32%,#163b5c 58%,#2b6474 72%,#c48a52 80%,#163b5c 81%)' }} />
      <Starfield count={110} maxY={55} />
      {/* moon */}
      <div className="absolute right-[12%] top-[10%] h-24 w-24 rounded-full bg-[#f6ecd0] shadow-[0_0_80px_30px_rgba(246,236,208,.25)] md:h-32 md:w-32">
        <div className="absolute left-[22%] top-[30%] h-4 w-4 rounded-full bg-[#e2d3ae]" />
        <div className="absolute left-[55%] top-[55%] h-6 w-6 rounded-full bg-[#e2d3ae]" />
      </div>
      <Clouds color="#08111f" opacity={0.85} count={7} top={4} speed={120} />
      <Lightning className="opacity-60" />
      {/* distant islands */}
      <svg className="absolute bottom-[19%] left-0 h-[16%] w-full" viewBox="0 0 1440 160" preserveAspectRatio="none">
        <path d="M0 160 L0 120 Q80 90 160 110 Q240 60 330 100 Q380 120 420 125 L520 130 Q600 80 690 115 L760 160 Z" fill="#0f2238" />
        <path d="M900 160 Q980 70 1060 95 Q1120 50 1200 90 Q1290 110 1360 100 L1440 112 L1440 160 Z" fill="#0f2238" />
        <path d="M1040 92 L1048 70 L1056 92 M1090 70 L1098 46 L1106 70" stroke="#d8af63" strokeWidth="2" opacity="0.4" />
      </svg>
      {/* horizon glow */}
      <div className="absolute inset-x-0 bottom-[18%] h-24 bg-gradient-to-t from-transparent via-[#d8af63]/20 to-transparent blur-xl" />
      <Ocean height={260} layers={[{ color: '#1a4a66', amp: 6, wavelength: 240, duration: 32, offset: 30, opacity: 0.9 }, ...DEFAULT_WAVES.slice(1).map((w) => ({ ...w, offset: w.offset + 90 }))]} />
      <div
        className={`absolute bottom-[7%] left-0 w-[260px] md:w-[360px] ${shipSailing ? 'anim-sail' : ''}`}
        style={shipSailing ? { animation: 'sail-across 70s linear -22s infinite' } : { left: '50%', transform: 'translateX(-50%)' }}
      >
        <AnimatedShip className="w-full drop-shadow-[0_10px_20px_rgba(0,0,0,.6)]" />
      </div>
      <Ocean height={90} layers={[{ color: '#0b2036', amp: 9, wavelength: 360, duration: 11, offset: 40 }]} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Chapter environments
// ═════════════════════════════════════════════════════════════

function LotusPetals() {
  const petals = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 16 }, (_, i) => ({ x: r() * 100, d: r() * 20, dur: 16 + r() * 14, s: 10 + r() * 14, key: i }));
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {petals.map((p) => (
        <svg
          key={p.key}
          viewBox="0 0 20 20"
          className="absolute bottom-[-40px]"
          style={{ left: `${p.x}%`, width: p.s, height: p.s, animation: `float-up ${p.dur}s linear ${-p.d}s infinite` }}
        >
          <path d="M10 1 C15 6 15 14 10 19 C5 14 5 6 10 1Z" fill="#f2a7c3" opacity="0.85" />
        </svg>
      ))}
    </div>
  );
}

function Embers() {
  const embers = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 22 }, (_, i) => ({ x: 30 + r() * 40, d: r() * 8, dur: 5 + r() * 6, key: i }));
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {embers.map((e) => (
        <span
          key={e.key}
          className="absolute bottom-[8%] h-1.5 w-1.5 rounded-full bg-[#ffb05a] shadow-[0_0_8px_2px_rgba(255,140,50,.8)]"
          style={{ left: `${e.x}%`, animation: `ember ${e.dur}s ease-out ${-e.d}s infinite` }}
        />
      ))}
    </div>
  );
}

function WindLines() {
  const lines = [
    { y: 18, d: 0, w: 2 },
    { y: 32, d: 1.6, w: 1.5 },
    { y: 46, d: 3.1, w: 2.5 },
    { y: 62, d: 0.8, w: 1.5 },
    { y: 26, d: 4.2, w: 1.8 },
  ];
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden>
      {lines.map((l, i) => (
        <path
          key={i}
          d={`M-50 ${l.y * 6} C200 ${l.y * 6 - 40} 350 ${l.y * 6 + 40} 560 ${l.y * 6} S 860 ${l.y * 6 - 50} 940 ${l.y * 6 - 10} q 30 -20 10 -40 q -20 -10 -30 10`}
          fill="none"
          stroke="#ffffff"
          strokeWidth={l.w}
          strokeLinecap="round"
          strokeDasharray="220 600"
          style={{ animation: `wind-line 6s ease-in-out ${l.d}s infinite` }}
          opacity="0.7"
        />
      ))}
    </svg>
  );
}

function Whirlpool({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <g className="anim-spin-slow" style={{ transformOrigin: '100px 100px' }}>
        {[90, 72, 56, 40, 26, 14].map((r, i) => (
          <ellipse key={r} cx="100" cy="100" rx={r} ry={r * 0.42} fill="none" stroke={i % 2 ? '#2f8190' : '#5fb8c4'} strokeWidth={3 - i * 0.3} strokeDasharray={`${r * 1.6} ${r * 0.6}`} opacity={0.35 + i * 0.1} />
        ))}
      </g>
      <ellipse cx="100" cy="100" rx="10" ry="4" fill="#040a12" />
    </svg>
  );
}

function ScyllaCliffs({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 600" className={className} preserveAspectRatio="xMinYMax meet" aria-hidden>
      <path d="M0 600 L0 80 Q60 40 110 110 Q150 70 190 160 Q230 200 220 300 Q260 380 240 470 Q280 540 300 600 Z" fill="#0a141d" />
      {/* serpent necks */}
      {[
        'M150 150 C190 80 260 90 270 40',
        'M175 200 C230 160 300 180 320 120',
        'M190 260 C250 250 300 270 340 220',
      ].map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#0d1b26" strokeWidth="16" fill="none" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values={`0 160 200;${i % 2 ? 4 : -4} 160 200;0 160 200`} dur={`${4 + i}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}
      <circle cx="270" cy="40" r="3" fill="#c64f4f" className="anim-glow" />
      <circle cx="320" cy="120" r="3" fill="#c64f4f" className="anim-glow" />
      <circle cx="340" cy="220" r="3" fill="#c64f4f" className="anim-glow" />
    </svg>
  );
}

const THEME_SKY: Record<ChapterTheme, string> = {
  lotus: 'linear-gradient(180deg,#152642 0%,#3b3866 40%,#9b6a86 66%,#e3a98d 78%,#2f8190 79%,#163b5c 100%)',
  cyclops: 'radial-gradient(ellipse at 50% 85%,#5a2d14 0%,#2a160b 35%,#120a06 65%,#070403 100%)',
  aeolus: 'linear-gradient(180deg,#2c6f98 0%,#5ea3c4 35%,#a9d6df 62%,#f0e2bf 78%,#5fb8c4 79%,#2f8190 100%)',
  sirens: 'linear-gradient(180deg,#0a1428 0%,#1e2c52 38%,#4a436e 72%,#8b6884 90%,#183f58 100%)',
  passage: 'linear-gradient(180deg,#060c14 0%,#0c1a26 35%,#163b5c 70%,#0c2233 100%)',
  ithaca: 'linear-gradient(180deg,#1c3b6b 0%,#4f6d99 35%,#c48573 66%,#f0ba7d 82%,#3e8fa3 100%)',
};

const THEME_WAVES: Record<ChapterTheme, WaveLayer[] | null> = {
  lotus: [
    { color: '#3b8f99', amp: 5, wavelength: 240, duration: 30, offset: 20, opacity: 0.8 },
    { color: '#25677a', amp: 7, wavelength: 288, duration: 22, offset: 40 },
    { color: '#163b5c', amp: 9, wavelength: 360, duration: 16, offset: 62 },
  ],
  cyclops: null,
  aeolus: [
    { color: '#7cc4cf', amp: 6, wavelength: 240, duration: 24, offset: 18, opacity: 0.85 },
    { color: '#3f97a6', amp: 8, wavelength: 288, duration: 18, offset: 40 },
    { color: '#2f8190', amp: 10, wavelength: 360, duration: 13, offset: 62 },
  ],
  sirens: DEFAULT_WAVES,
  passage: STORM_WAVES,
  ithaca: DAWN_WAVES,
};

/** Full-screen environmental art for each chapter, sitting behind the UI. */
export function ChapterBackdrop({ theme, dim = 0.5 }: { theme: ChapterTheme; dim?: number }) {
  const waves = THEME_WAVES[theme];
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: THEME_SKY[theme] }} />
      {theme === 'lotus' && (
        <>
          <Starfield count={40} maxY={30} seed={21} />
          <div className="absolute left-[8%] top-[12%] h-20 w-20 rounded-full bg-[#ffd9b0] opacity-80 shadow-[0_0_90px_40px_rgba(255,190,150,.35)]" />
          <svg className="absolute bottom-[20%] right-0 h-[38%] w-[60%]" viewBox="0 0 600 300" preserveAspectRatio="xMaxYMax meet">
            <path d="M40 300 Q120 200 260 210 Q380 150 520 190 Q580 200 600 220 L600 300 Z" fill="#23304d" />
            {[180, 260, 330, 430, 500].map((x, i) => (
              <g key={x} transform={`translate(${x} ${200 - (i % 2) * 12})`}>
                <path d="M0 10 Q4 -50 10 -90" stroke="#1a2440" strokeWidth="6" fill="none" />
                <path d="M10 -90 Q-30 -100 -50 -70 M10 -90 Q40 -110 60 -80 M10 -90 Q-10 -120 -30 -125 M10 -90 Q30 -125 55 -120" stroke="#1a2440" strokeWidth="7" fill="none" strokeLinecap="round" />
              </g>
            ))}
          </svg>
          <LotusPetals />
        </>
      )}
      {theme === 'cyclops' && (
        <>
          <div className="anim-glow absolute bottom-[-10%] left-1/2 h-[60%] w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(255,140,60,.45),transparent_65%)]" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <path d="M0 0 L1000 0 L1000 600 L900 600 Q940 380 860 260 Q760 90 500 70 Q240 90 140 260 Q60 380 100 600 L0 600 Z" fill="#0b0705" />
            <path d="M0 0 L1000 0 L1000 120 Q760 40 500 40 Q240 40 0 120 Z" fill="#050302" opacity="0.8" />
            {[180, 260, 340, 610, 700, 790].map((x, i) => (
              <path key={x} d={`M${x - 14} ${60 + (i % 3) * 8} L${x} ${120 + (i % 3) * 22} L${x + 14} ${60 + (i % 3) * 8} Z`} fill="#0b0705" />
            ))}
            <ellipse cx="820" cy="560" rx="150" ry="90" fill="#1d130c" />
          </svg>
          <div className="absolute right-[10%] top-[18%] h-16 w-28 md:h-20 md:w-36">
            <svg viewBox="0 0 140 80" className="anim-blink h-full w-full opacity-80">
              <ellipse cx="70" cy="40" rx="64" ry="30" fill="#e8d7a8" opacity="0.18" />
              <ellipse cx="70" cy="40" rx="50" ry="24" fill="#d9c48a" opacity="0.35" />
              <circle cx="70" cy="40" r="17" fill="#8a3d12" />
              <circle cx="70" cy="40" r="7" fill="#0a0503" />
            </svg>
          </div>
          <Embers />
        </>
      )}
      {theme === 'aeolus' && (
        <>
          <Clouds color="#ffffff" opacity={0.55} count={6} top={6} speed={70} seed={9} />
          <svg className="absolute right-[6%] top-[14%] h-[34%] w-[42%]" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet">
            <path d="M40 120 L360 120 Q330 200 200 250 Q70 200 40 120Z" fill="#7a6a58" />
            <path d="M40 120 L360 120 Q330 150 200 170 Q70 150 40 120Z" fill="#9c8a6e" />
            <rect x="80" y="70" width="240" height="52" fill="#b48a48" stroke="#6b4c2c" strokeWidth="3" />
            {[90, 130, 170, 210, 250, 290].map((x) => (
              <rect key={x} x={x} y="58" width="18" height="14" fill="#b48a48" stroke="#6b4c2c" strokeWidth="2" />
            ))}
            <path d="M170 70 L200 30 L230 70 Z" fill="#d8af63" stroke="#6b4c2c" strokeWidth="3" />
          </svg>
          <WindLines />
        </>
      )}
      {theme === 'sirens' && (
        <>
          <Starfield count={75} maxY={45} seed={31} />
          <Clouds color="#1a223b" opacity={0.65} count={5} top={8} speed={80} seed={14} />
        </>
      )}
      {theme === 'passage' && (
        <>
          <Clouds color="#03070c" opacity={0.85} count={7} top={0} speed={45} seed={17} />
          <Lightning className="opacity-50" />
          <ScyllaCliffs className="absolute bottom-0 left-0 h-[85%] w-auto opacity-95" />
          <Whirlpool className="absolute bottom-[4%] right-[4%] h-[34vh] w-[34vh] opacity-90" />
          <Rain />
        </>
      )}
      {theme === 'ithaca' && (
        <>
          <Clouds color="#fff2d6" opacity={0.48} count={5} top={6} speed={90} seed={23} />
          <div className="absolute left-1/2 top-[16%] h-28 w-28 -translate-x-1/2 rounded-full bg-[#fff1c4] opacity-75 shadow-[0_0_120px_50px_rgba(255,212,135,.4)]" />
        </>
      )}
      {waves && <Ocean layers={waves} height={theme === 'passage' ? 170 : 150} />}
      <div className="absolute inset-0" style={{ background: `rgba(8,14,26,${dim})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.55)_100%)]" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Failure storm
// ═════════════════════════════════════════════════════════════

export function StormScene() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#05070b 0%,#141a22 40%,#2a1518 70%,#0d1218 100%)' }} />
      <Clouds color="#020305" opacity={0.95} count={9} top={-5} speed={30} seed={2} />
      <Lightning />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(198,79,79,.22),transparent_60%)]" />
      <Rain />
      <Ocean layers={STORM_WAVES} height={200} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,.7)_100%)]" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Victory sunrise over Ithaca
// ═════════════════════════════════════════════════════════════

export function SunriseScene() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#1b2f55 0%,#5a5a8a 25%,#e39a6d 52%,#f6cf86 64%,#f8e3b0 70%)' }} />
      <div className="absolute inset-0 bg-[#101b2d]" style={{ animation: 'fade-out 4.5s ease-out forwards' }} />
      {/* sun */}
      <div className="absolute left-1/2 top-[44%] -translate-x-1/2" style={{ animation: 'sun-rise 5s cubic-bezier(.2,.7,.2,1) both' }}>
        <div className="h-40 w-40 rounded-full bg-[radial-gradient(circle,#fff7dc_0%,#ffd88a_45%,#f6a95c_100%)] shadow-[0_0_140px_70px_rgba(255,200,120,.55)] md:h-56 md:w-56" />
      </div>
      {/* rays */}
      <div className="anim-spin-slow absolute left-1/2 top-[52%] h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2 opacity-25" style={{ background: 'repeating-conic-gradient(from 0deg,rgba(255,236,190,.6) 0deg 4deg,transparent 4deg 18deg)', animationDuration: '90s' }} />
      {/* birds */}
      <svg className="absolute left-[18%] top-[22%] h-16 w-40 opacity-70" viewBox="0 0 160 60">
        {[0, 34, 70].map((x, i) => (
          <path key={x} d={`M${x} ${20 + i * 8} q 8 -8 16 0 q 8 -8 16 0`} stroke="#2a1a10" strokeWidth="2" fill="none" />
        ))}
      </svg>
      {/* Ithaca island with palace */}
      <svg className="absolute bottom-[24%] right-0 h-[32%] w-[70%] md:w-[55%]" viewBox="0 0 700 260" preserveAspectRatio="xMaxYMax meet">
        <path d="M0 260 Q90 170 210 160 Q300 70 420 90 Q520 40 610 110 Q660 140 700 140 L700 260 Z" fill="#5b4a5e" />
        <path d="M60 260 Q150 200 260 200 Q360 150 470 170 Q600 160 700 200 L700 260 Z" fill="#3e3448" />
        {/* palace */}
        <g transform="translate(400 46)">
          <path d="M0 44 L60 18 L120 44 Z" fill="#f0e2bf" />
          <rect x="4" y="44" width="112" height="6" fill="#f0e2bf" />
          {[10, 28, 46, 64, 82, 100].map((x) => (
            <rect key={x} x={x} y="50" width="8" height="34" fill="#f0e2bf" />
          ))}
          <rect x="0" y="84" width="120" height="8" fill="#e6d3a6" />
        </g>
        {/* harbor */}
        <path d="M120 230 L330 230" stroke="#2a2030" strokeWidth="8" />
        {[150, 200, 250, 300].map((x) => (
          <rect key={x} x={x} y="226" width="6" height="22" fill="#2a2030" />
        ))}
      </svg>
      <Ocean layers={DAWN_WAVES} height={230} />
      <div className="absolute bottom-[12%] left-[6%] w-[200px] md:left-[14%] md:w-[260px]" style={{ animation: 'sail-in 9s cubic-bezier(.3,.6,.3,1) both' }}>
        <AnimatedShip className="w-full drop-shadow-[0_10px_20px_rgba(0,0,0,.4)]" />
      </div>
      <Ocean layers={[{ color: '#0f2c46', amp: 8, wavelength: 360, duration: 12, offset: 34 }]} height={80} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1220]/40 via-transparent to-[#0a1220]/60" />
    </div>
  );
}
