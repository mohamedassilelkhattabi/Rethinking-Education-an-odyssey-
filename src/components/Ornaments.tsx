import type { ReactNode } from 'react';

export function Meander({ className = '', ink = false }: { className?: string; ink?: boolean }) {
  return <div className={`meander ${ink ? 'meander-ink' : ''} ${className}`} aria-hidden />;
}

export function Divider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/60 to-gold/80" />
      <svg viewBox="0 0 40 16" className="h-4 w-10">
        <path d="M2 8 L14 8 M26 8 L38 8" stroke="#D8AF63" strokeWidth="1.2" />
        <path d="M20 2 L26 8 L20 14 L14 8 Z" fill="none" stroke="#D8AF63" strokeWidth="1.2" />
        <circle cx="20" cy="8" r="1.8" fill="#D8AF63" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/60 to-gold/80" />
    </div>
  );
}

export function Laurel({ className = '' }: { className?: string }) {
  const leaves = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden>
      {[1, -1].map((side) => (
        <g key={side} transform={side === -1 ? 'translate(200 0) scale(-1 1)' : undefined}>
          <path d="M96 112 C50 104 26 70 30 20" stroke="#D8AF63" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {leaves.map((i) => {
            const t = i / 7;
            const x = 96 - 66 * t + Math.sin(t * 3) * 4 - 0;
            const y = 112 - 92 * t;
            return (
              <ellipse key={i} cx={x - 8} cy={y} rx="11" ry="4.5" fill="#D8AF63" opacity={0.85} transform={`rotate(${-40 - t * 50} ${x - 8} ${y})`} />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/** Ornate framed panel with optional title plate. */
export function Frame({ children, className = '', title }: { children: ReactNode; className?: string; title?: ReactNode }) {
  return (
    <section className={`panel p-5 md:p-7 ${className}`}>
      {title && (
        <div className="mb-4">
          <h2 className="font-display text-center text-lg font-bold uppercase text-gold md:text-xl">{title}</h2>
          <Divider className="mt-2" />
        </div>
      )}
      {children}
    </section>
  );
}

export function Medallion({ children, className = '', tone = 'gold' }: { children: ReactNode; className?: string; tone?: 'gold' | 'teal' | 'red' | 'gray' }) {
  const tones = {
    gold: 'from-[#f7e1ab] via-[#d8af63] to-[#8a6236] text-[#2b1c08] ring-[#6b4c2c]',
    teal: 'from-[#9fdde6] via-[#2f8190] to-[#163b5c] text-white ring-[#0d3440]',
    red: 'from-[#f3b3a6] via-[#c64f4f] to-[#6e2222] text-white ring-[#4a1515]',
    gray: 'from-[#9aa3ad] via-[#5a6470] to-[#2d343c] text-[#e6e9ec] ring-[#20252b]',
  };
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br shadow-[0_4px_14px_rgba(0,0,0,.5),inset_0_2px_3px_rgba(255,255,255,.45)] ring-2 ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
