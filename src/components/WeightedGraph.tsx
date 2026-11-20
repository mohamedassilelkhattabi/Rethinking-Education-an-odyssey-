import { motion } from 'motion/react';
import type { KeyboardEvent } from 'react';
import type { GraphEdge, GraphHazard, GraphNode, ShortestPathQuestion } from '../game/types';

const VIEW_W = 820;
const VIEW_H = 480;

const radius = (n: GraphNode) => (n.role === 'island' ? 29 : 34);

interface Geometry {
  d: string;
  label: { x: number; y: number };
}

function edgeGeometry(a: GraphNode, b: GraphNode, e: GraphEdge): Geometry {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const curve = e.curve ?? 0;
  const cx = (a.x + b.x) / 2 + nx * curve;
  const cy = (a.y + b.y) / 2 + ny * curve;
  const toward = (px: number, py: number, qx: number, qy: number, dist: number) => {
    const l = Math.hypot(qx - px, qy - py) || 1;
    return { x: px + ((qx - px) / l) * dist, y: py + ((qy - py) / l) * dist };
  };
  const s = toward(a.x, a.y, cx, cy, radius(a) + 2);
  const t = toward(b.x, b.y, cx, cy, radius(b) + 9);
  const lt = e.labelT ?? 0.5;
  const bez = (p0: number, p1: number, p2: number) => (1 - lt) ** 2 * p0 + 2 * (1 - lt) * lt * p1 + lt ** 2 * p2;
  return { d: `M${s.x} ${s.y} Q${cx} ${cy} ${t.x} ${t.y}`, label: { x: bez(a.x, cx, b.x), y: bez(a.y, cy, b.y) } };
}

function Hazard({ h }: { h: GraphHazard }) {
  if (h.kind === 'charybdis') {
    return (
      <g transform={`translate(${h.x} ${h.y})`} opacity="0.75">
        <g className="anim-spin-slow" style={{ transformOrigin: '0 0', transformBox: 'view-box' }}>
          {[30, 22, 14, 7].map((r) => (
            <ellipse key={r} rx={r} ry={r * 0.5} fill="none" stroke="#2f8190" strokeWidth="1.6" strokeDasharray={`${r} ${r / 2}`} />
          ))}
        </g>
        <text y="44" textAnchor="middle" className="fill-[#6b4c2c] font-serif text-[13px] italic">Charybdis</text>
      </g>
    );
  }
  if (h.kind === 'scylla') {
    return (
      <g transform={`translate(${h.x} ${h.y})`} opacity="0.8">
        <path d="M-30 18 Q-24 -4 -14 -10 Q-8 -14 -4 -8 M-6 18 Q0 -10 10 -18 Q16 -22 20 -14 M14 18 Q22 0 32 -6 Q38 -8 40 -2" stroke="#6b4c2c" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M-40 22 L48 22" stroke="#6b4c2c" strokeWidth="1.4" />
        <text y="38" textAnchor="middle" className="fill-[#6b4c2c] font-serif text-[13px] italic">Scylla</text>
      </g>
    );
  }
  return (
    <g transform={`translate(${h.x} ${h.y})`} opacity="0.6">
      <path d="M-18 8 L-10 -6 L-2 8 Z M0 8 L8 -10 L16 8 Z" fill="#8a7458" stroke="#6b4c2c" />
      <text y="26" textAnchor="middle" className="fill-[#6b4c2c] font-serif text-[12px] italic">Reefs</text>
    </g>
  );
}

function Compass() {
  return (
    <g transform="translate(60 420)" opacity="0.5" aria-hidden>
      <circle r="30" fill="none" stroke="#6b4c2c" strokeWidth="1" />
      <circle r="22" fill="none" stroke="#6b4c2c" strokeWidth="0.6" strokeDasharray="2 3" />
      <path d="M0 -34 L6 0 L0 34 L-6 0 Z" fill="#966e42" />
      <path d="M-34 0 L0 -6 L34 0 L0 6 Z" fill="#6b4c2c" opacity="0.7" />
      <text y="-38" textAnchor="middle" className="fill-[#6b4c2c] font-display text-[10px] font-bold">N</text>
    </g>
  );
}

function IslandShape({ n, r }: { n: GraphNode; r: number }) {
  if (n.role === 'start') {
    return (
      <g>
        <circle r={r} fill="#163b5c" stroke="#d8af63" strokeWidth="2.5" />
        <path d="M0 -15 V14 M-10 -6 H10 M-14 6 Q-12 16 0 16 Q12 16 14 6" stroke="#f0e2bf" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <circle cy="-17" r="3" fill="none" stroke="#f0e2bf" strokeWidth="2.2" />
      </g>
    );
  }
  if (n.role === 'goal') {
    return (
      <g>
        <circle r={r} fill="#d8af63" stroke="#6b4c2c" strokeWidth="2.5" />
        <path d="M-15 -2 L0 -14 L15 -2 Z" fill="#fff6dc" stroke="#6b4c2c" strokeWidth="1" />
        {[-11, -4, 3, 10].map((x) => (
          <rect key={x} x={x - 1.6} y="-1" width="3.2" height="12" fill="#fff6dc" stroke="#6b4c2c" strokeWidth="0.6" />
        ))}
        <rect x="-16" y="11" width="32" height="3.5" fill="#fff6dc" stroke="#6b4c2c" strokeWidth="0.6" />
      </g>
    );
  }
  return (
    <g>
      <path
        d={`M${-r} 2 C${-r} ${-r * 0.8} ${-r * 0.3} ${-r} ${r * 0.2} ${-r * 0.95} C${r * 0.9} ${-r * 0.9} ${r} ${-r * 0.1} ${r * 0.95} ${r * 0.3} C${r * 0.9} ${r * 0.9} ${r * 0.2} ${r} ${-r * 0.3} ${r * 0.92} C${-r * 0.85} ${r * 0.85} ${-r} ${r * 0.5} ${-r} 2 Z`}
        fill="#e0c88f"
        stroke="#6b4c2c"
        strokeWidth="2"
      />
      <path d={`M${-r * 0.55} ${-r * 0.1} Q0 ${-r * 0.7} ${r * 0.55} ${-r * 0.15} Q${r * 0.3} ${r * 0.45} ${-r * 0.2} ${r * 0.4} Z`} fill="#8aa36b" opacity="0.65" />
    </g>
  );
}

interface WeightedGraphProps {
  question: ShortestPathQuestion;
  path: string[];
  onNodeClick?: (id: string) => void;
  disabled?: boolean;
  /** Highlight a route (e.g., the optimal one) independent of the player's path. */
  highlight?: string[];
  invalidNode?: string | null;
}

export function WeightedGraph({ question, path, onNodeClick, disabled, highlight, invalidNode }: WeightedGraphProps) {
  const nodes = Object.fromEntries(question.nodes.map((n) => [n.id, n]));
  const current = path[path.length - 1] ?? question.start;
  const activePath = highlight ?? path;
  const onPath = (from: string, to: string) => {
    for (let i = 0; i < activePath.length - 1; i++) if (activePath[i] === from && activePath[i + 1] === to) return true;
    return false;
  };
  const reachable = new Set(
    disabled || current === question.goal || highlight ? [] : question.edges.filter((e) => e.from === current && !path.includes(e.to)).map((e) => e.to),
  );
  const ship = nodes[current];

  const handleKey = (id: string) => (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onNodeClick?.(id);
    }
  };

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-auto w-full select-none" role="group" aria-label="Nautical chart of sea routes">
      <defs>
        {(['ink', 'gold', 'teal'] as const).map((k) => (
          <marker key={k} id={`arrow-${k}-${question.id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill={k === 'ink' ? '#6b4c2c' : k === 'gold' ? '#b48a48' : '#2f8190'} />
          </marker>
        ))}
        <pattern id={`sea-${question.id}`} width="60" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 12 Q15 4 30 12 T60 12" fill="none" stroke="#2f8190" strokeWidth="0.8" opacity="0.18" />
        </pattern>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#sea-${question.id})`} />
      <Compass />
      {question.hazards?.map((h, i) => <Hazard key={i} h={h} />)}

      {/* edges */}
      {question.edges.map((e) => {
        const a = nodes[e.from];
        const b = nodes[e.to];
        const g = edgeGeometry(a, b, e);
        const inPath = onPath(e.from, e.to);
        const next = !inPath && e.from === current && reachable.has(e.to);
        const color = inPath ? '#b48a48' : next ? '#2f8190' : '#6b4c2c';
        return (
          <g key={`${e.from}-${e.to}`}>
            {inPath && <path d={g.d} fill="none" stroke="#f1d49a" strokeWidth="10" opacity="0.55" strokeLinecap="round" />}
            <path
              d={g.d}
              fill="none"
              stroke={color}
              strokeWidth={inPath ? 4.5 : next ? 3.2 : 2}
              strokeDasharray={inPath ? '14 6' : next ? '8 6' : '6 6'}
              className={inPath || next ? 'anim-dash' : ''}
              opacity={inPath || next ? 1 : 0.6}
              markerEnd={`url(#arrow-${inPath ? 'gold' : next ? 'teal' : 'ink'}-${question.id})`}
            />
            <g transform={`translate(${g.label.x} ${g.label.y})`}>
              <circle r="18" fill={inPath ? '#d8af63' : '#f6ebcf'} stroke={inPath ? '#6b4c2c' : next ? '#2f8190' : '#966e42'} strokeWidth={next ? 2.5 : 1.8} />
              <text textAnchor="middle" dy="6" className="fill-[#3a2a17] font-sans text-[18px] font-extrabold">
                {e.weight}
              </text>
            </g>
          </g>
        );
      })}

      {/* nodes */}
      {question.nodes.map((n) => {
        const r = radius(n);
        const inPath = path.includes(n.id);
        const isCurrent = n.id === current && !highlight;
        const canGo = reachable.has(n.id);
        const interactive = !!onNodeClick && !disabled;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x} ${n.y})`}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`${n.role === 'island' ? `Island ${n.label}, ${n.subtitle}` : n.label}${canGo ? ' — reachable from your position' : ''}${isCurrent ? ' — your ship is here' : ''}`}
            aria-disabled={interactive && !canGo ? true : undefined}
            onClick={interactive ? () => onNodeClick?.(n.id) : undefined}
            onKeyDown={interactive ? handleKey(n.id) : undefined}
            className={`${interactive ? 'cursor-pointer outline-none' : ''} ${invalidNode === n.id ? 'anim-shake' : ''}`}
            style={{ transformBox: 'fill-box' }}
          >
            {canGo && <circle r={r + 10} fill="none" stroke="#2f8190" strokeWidth="2.5" className="anim-glow" style={{ transformOrigin: 'center', transformBox: 'fill-box' }} />}
            {isCurrent && <circle r={r + 8} fill="rgba(95,184,196,.25)" stroke="#5fb8c4" strokeWidth="2.5" />}
            {inPath && !isCurrent && <circle r={r + 6} fill="none" stroke="#d8af63" strokeWidth="3" />}
            {invalidNode === n.id && <circle r={r + 8} fill="rgba(198,79,79,.25)" stroke="#c64f4f" strokeWidth="2.5" />}
            <ellipse cy={r * 0.75} rx={r * 1.05} ry={r * 0.35} fill="#000" opacity="0.12" />
            <IslandShape n={n} r={r} />
            {n.role === 'island' && (
              <text textAnchor="middle" dy="7" className="fill-[#3a2a17] font-display text-[24px] font-black">
                {n.label}
              </text>
            )}
            <text y={r + 20} textAnchor="middle" className="fill-[#3a2a17] font-display text-[16px] font-bold tracking-wider">
              {n.role === 'island' ? '' : n.label}
            </text>
            {n.subtitle && (
              <text y={r + (n.role === 'island' ? 21 : 38)} textAnchor="middle" className="fill-[#6b4c2c] font-serif text-[16px] italic">
                {n.subtitle}
              </text>
            )}
            {/* larger invisible hit area for touch */}
            {interactive && <circle r={r + 12} fill="transparent" />}
          </g>
        );
      })}

      {/* the ship */}
      {!highlight && ship && (
        <motion.g initial={false} animate={{ x: ship.x - 26, y: ship.y - (radius(ship) + 44) }} transition={{ type: 'spring', stiffness: 90, damping: 16 }} style={{ pointerEvents: 'none' }}>
          <svg width="52" height="36" viewBox="0 0 240 160" aria-hidden>
            <path d="M40 100 C30 96 19 80 23 64 C25 55 37 55 36 64 C34 73 39 86 53 96 L200 98 C206 94 210 88 212 80 L218 82 C216 95 214 104 214 110 L236 116 L212 123 C180 131 82 133 50 122 C44 118 40 110 40 100 Z" fill="#5e3a1e" stroke="#1f1208" strokeWidth="4" />
            <rect x="116" y="12" width="8" height="90" fill="#4a2f17" />
            <path d="M66 26 Q120 34 174 26 L168 92 Q120 102 72 92 Z" fill="#fbf1d8" stroke="#8a6a3f" strokeWidth="4" />
            <circle cx="120" cy="60" r="14" fill="#d8af63" />
          </svg>
        </motion.g>
      )}
    </svg>
  );
}
