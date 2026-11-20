import { useId } from 'react';

interface ShipProps {
  className?: string;
  /** 'rock' = gentle swell, 'toss' = storm, 'still' = no animation */
  motion?: 'rock' | 'toss' | 'still';
  flip?: boolean;
  sailColor?: 'linen' | 'crimson';
  title?: string;
}

/** A Greek war galley (pentekonter) drawn in SVG: painted eye, bronze ram, shields and oars. */
export function AnimatedShip({ className = '', motion = 'rock', flip = false, sailColor = 'linen', title }: ShipProps) {
  const id = useId().replace(/:/g, '');
  const anim = motion === 'rock' ? 'anim-rock' : motion === 'toss' ? 'anim-toss' : '';
  const sailA = sailColor === 'crimson' ? '#e9b9a4' : '#fbf1d8';
  const sailB = sailColor === 'crimson' ? '#b9574b' : '#e2cfa3';
  const oars = Array.from({ length: 9 }, (_, i) => 72 + i * 15);
  const shields = Array.from({ length: 7 }, (_, i) => 74 + i * 19);

  return (
    <svg
      viewBox="0 0 240 160"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <linearGradient id={`hull-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a33" />
          <stop offset="0.45" stopColor="#5e3a1e" />
          <stop offset="1" stopColor="#2b190c" />
        </linearGradient>
        <linearGradient id={`sail-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={sailA} />
          <stop offset="1" stopColor={sailB} />
        </linearGradient>
        <radialGradient id={`sun-${id}`}>
          <stop offset="0" stopColor="#ffe9b0" />
          <stop offset="1" stopColor="#c99640" />
        </radialGradient>
      </defs>
      <g className={anim}>
        {/* rigging */}
        <path d="M120 14 L36 62 M120 14 L212 84 M120 14 L66 26 M120 14 L174 26" stroke="#3b2814" strokeWidth="0.9" fill="none" opacity="0.8" />
        {/* mast + yard */}
        <rect x="118" y="12" width="4" height="100" rx="1.5" fill="#4a2f17" />
        <rect x="60" y="22" width="120" height="4" rx="2" fill="#5a3a1c" />
        {/* pennant */}
        <path d="M122 12 L146 6 L140 13 L146 19 Z" fill="#c64f4f">
          <animate attributeName="d" dur="1.6s" repeatCount="indefinite" values="M122 12 L146 6 L140 13 L146 19 Z;M122 12 L144 9 L139 14 L147 17 Z;M122 12 L146 6 L140 13 L146 19 Z" />
        </path>
        {/* sail */}
        <path d={`M66 26 Q120 34 174 26 L168 92 Q120 102 72 92 Z`} fill={`url(#sail-${id})`} stroke="#8a6a3f" strokeWidth="1.2" />
        <path d="M95 29 L97 96 M145 29 L143 96" stroke="#b4884e" strokeWidth="5" opacity="0.35" />
        <g transform="translate(120 60)">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M0 -21 L2.4 -14 L-2.4 -14 Z" fill="#c99640" transform={`rotate(${i * 30})`} />
          ))}
          <circle r="12" fill={`url(#sun-${id})`} stroke="#8a6a3f" strokeWidth="1" />
          <circle r="5" fill="none" stroke="#8a6a3f" strokeWidth="1" opacity="0.7" />
        </g>
        {/* oars */}
        {oars.map((x) => (
          <line key={x} x1={x} y1="110" x2={x - 16} y2="146" stroke="#6b4c2c" strokeWidth="2.2" strokeLinecap="round" />
        ))}
        {/* hull */}
        <path
          d="M40 100 C30 96 19 80 23 64 C25 55 37 55 36 64 C34 73 39 86 53 96 L200 98 C206 94 210 88 212 80 L218 82 C216 95 214 104 214 110 L236 116 L212 123 C180 131 82 133 50 122 C44 118 40 110 40 100 Z"
          fill={`url(#hull-${id})`}
          stroke="#1f1208"
          strokeWidth="1.4"
        />
        {/* decorative bands */}
        <path d="M46 106 L214 104" stroke="#101b2d" strokeWidth="5" />
        <path d="M46 106 L214 104" stroke="#d8af63" strokeWidth="1.2" strokeDasharray="6 4" />
        <path d="M54 115 Q130 120 210 113" stroke="#d8af63" strokeWidth="0.9" fill="none" opacity="0.6" />
        {/* ram */}
        <path d="M212 112 L236 116 L212 121 Z" fill="#b48a48" stroke="#6b4c2c" strokeWidth="0.8" />
        {/* shields */}
        {shields.map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="97" r="6.2" fill={i % 2 ? '#966e42' : '#d8af63'} stroke="#3b2814" strokeWidth="1" />
            <circle cx={x} cy="97" r="2" fill="#3b2814" opacity="0.6" />
          </g>
        ))}
        {/* painted eye */}
        <ellipse cx="201" cy="108" rx="6" ry="3.6" fill="#f6edd6" stroke="#1f1208" strokeWidth="0.8" />
        <circle cx="202" cy="108" r="2" fill="#101b2d" />
        {/* stern ornament */}
        <circle cx="30" cy="61" r="2.4" fill="#d8af63" />
      </g>
    </svg>
  );
}
