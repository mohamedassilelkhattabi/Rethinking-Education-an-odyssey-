import { motion } from 'motion/react';
import { Check, Compass } from 'lucide-react';
import { useState } from 'react';
import { GameIcon } from '../components/icons';
import { Medallion } from '../components/Ornaments';
import { formatNumber } from '../game/optimization';
import { sfx } from '../game/sound';
import type { Answer, ChoiceOption, MultipleChoiceQuestion } from '../game/types';

interface Props {
  question: MultipleChoiceQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
}

function TrailsMap({ question, selected, onSelect, disabled }: { question: MultipleChoiceQuestion; selected: string | null; onSelect: (id: string) => void; disabled: boolean }) {
  const routes: Record<string, { d: string; label: { x: number; y: number } }> = {
    A: { d: 'M95 150 C150 60 230 40 300 70 S 440 40 505 140', label: { x: 300, y: 58 } },
    C: { d: 'M95 165 L190 160 L240 132 L285 104 L318 96 L352 118 L400 150 L505 158', label: { x: 318, y: 138 } },
    B: { d: 'M95 180 C160 250 300 262 400 236 S 490 200 505 175', label: { x: 300, y: 252 } },
  };
  return (
    <div className="parchment overflow-hidden p-2">
      <svg viewBox="0 0 600 300" className="h-auto w-full" role="group" aria-label="Three trails back to the ship">
        {/* sea */}
        <path d="M0 250 Q150 230 300 268 T600 240 L600 300 L0 300 Z" fill="#7fb6bd" opacity="0.55" />
        <path d="M0 268 Q150 250 300 282 T600 262" fill="none" stroke="#2f8190" strokeWidth="1.5" opacity="0.5" />
        {/* forest */}
        {[150, 190, 230, 370, 410, 440].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i % 2 ? 40 : 58})`}>
            <path d="M0 0 L12 26 L-12 26 Z" fill="#5d7f4c" stroke="#3d5730" strokeWidth="1" />
            <rect x="-2" y="26" width="4" height="7" fill="#6b4c2c" />
          </g>
        ))}
        {/* mountain */}
        <path d="M200 190 L318 70 L440 190 Z" fill="#a8916a" opacity="0.6" />
        <path d="M296 92 L318 70 L340 92 L326 88 L318 96 L308 88 Z" fill="#f6efe0" opacity="0.9" />
        {/* lotus grove */}
        <g transform="translate(62 165)">
          <circle r="34" fill="#f2c2d3" opacity="0.45" />
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d="M0 -4 C6 -14 6 -22 0 -28 C-6 -22 -6 -14 0 -4Z" fill="#e58bb0" transform={`rotate(${a})`} />
          ))}
          <circle r="5" fill="#d8af63" />
          <text y="52" textAnchor="middle" className="fill-[#6b4c2c] font-display text-[12px] font-bold">LOTUS GROVE</text>
        </g>
        {/* ship */}
        <g transform="translate(500 140) scale(0.42)">
          <path d="M40 100 C30 96 19 80 23 64 C25 55 37 55 36 64 C34 73 39 86 53 96 L200 98 C206 94 210 88 212 80 L218 82 C216 95 214 104 214 110 L236 116 L212 123 C180 131 82 133 50 122 C44 118 40 110 40 100 Z" fill="#5e3a1e" stroke="#1f1208" strokeWidth="4" />
          <rect x="116" y="12" width="8" height="90" fill="#4a2f17" />
          <path d="M66 26 Q120 34 174 26 L168 92 Q120 102 72 92 Z" fill="#fbf1d8" stroke="#8a6a3f" strokeWidth="4" />
        </g>
        <text x="550" y="215" textAnchor="middle" className="fill-[#6b4c2c] font-display text-[12px] font-bold">THE SHIP</text>

        {question.options.map((o) => {
          const r = routes[o.id];
          if (!r) return null;
          const isSel = selected === o.id;
          const minutes = o.attributes.minutes;
          return (
            <g
              key={o.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={isSel}
              aria-label={`${o.label}, ${minutes} minutes`}
              className={disabled ? '' : 'group cursor-pointer outline-none'}
              onClick={() => !disabled && onSelect(o.id)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(o.id);
                }
              }}
            >
              <path d={r.d} fill="none" stroke="transparent" strokeWidth="26" />
              {isSel && <path d={r.d} fill="none" stroke="#f1d49a" strokeWidth="12" opacity="0.6" strokeLinecap="round" />}
              <path
                d={r.d}
                fill="none"
                stroke={isSel ? '#b48a48' : '#6b4c2c'}
                strokeWidth={isSel ? 5 : 3}
                strokeDasharray="10 7"
                strokeLinecap="round"
                className={`${isSel ? 'anim-dash' : ''} transition-[stroke] group-hover:stroke-[#2f8190] group-focus-visible:stroke-[#2f8190]`}
              />
              <g transform={`translate(${r.label.x} ${r.label.y})`}>
                <rect x="-62" y="-14" width="124" height="28" rx="14" fill={isSel ? '#d8af63' : '#f6ebcf'} stroke="#6b4c2c" strokeWidth="1.5" />
                <text textAnchor="middle" dy="5" className="fill-[#3a2a17] font-sans text-[13px] font-bold">
                  {o.id}. {o.label.replace(' Trail', '')} · {minutes} min
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function OptionCard({ option, question, selected, onSelect, disabled, index }: { option: ChoiceOption; question: MultipleChoiceQuestion; selected: boolean; onSelect: () => void; disabled: boolean; index: number }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index }}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className="choice-card group relative flex h-full flex-col items-center gap-3 rounded-2xl border border-gold/25 bg-gradient-to-b from-[#1b3352]/90 to-[#0e1a2c]/95 p-4 text-center disabled:cursor-not-allowed md:p-5"
    >
      <span className="absolute left-3 top-3 font-display text-xs font-black text-gold/70">{option.id}</span>
      {selected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-midnight">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
        </motion.span>
      )}
      <Medallion className="h-16 w-16 transition-transform group-hover:scale-110 md:h-20 md:w-20" tone={selected ? 'gold' : 'teal'}>
        <GameIcon name={option.icon} className="h-8 w-8 md:h-10 md:w-10" />
      </Medallion>
      <div>
        <h4 className="font-display text-lg font-bold text-parchment">{option.label}</h4>
        <p className="mt-1 text-sm leading-snug text-parchment/65">{option.description}</p>
      </div>
      <div className="mt-auto flex w-full flex-wrap justify-center gap-1.5">
        {question.attributes.map((a) => (
          <span key={a.key} className="flex items-center gap-1.5 rounded-lg border border-gold/20 bg-black/30 px-2.5 py-1.5 text-sm">
            <GameIcon name={a.icon} className="h-4 w-4 text-gold" />
            <span className="font-bold tabular-nums text-parchment">{formatNumber(option.attributes[a.key])}</span>
            <span className="text-parchment/60">{a.unit}</span>
          </span>
        ))}
      </div>
    </motion.button>
  );
}

export function MultipleChoiceChallenge({ question, disabled, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const locked = disabled || submitted;

  const choose = (id: string) => {
    if (locked) return;
    setSelected(id);
    sfx.select();
  };

  return (
    <div className="flex flex-col gap-4">
      {question.visual === 'trails' && <TrailsMap question={question} selected={selected} onSelect={choose} disabled={locked} />}
      <div className={`grid gap-3 md:gap-4 ${question.visual === 'trails' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`} role="radiogroup" aria-label="Options">
        {question.options.map((o, i) => (
          <OptionCard key={o.id} index={i} option={o} question={question} selected={selected === o.id} onSelect={() => choose(o.id)} disabled={locked} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className="btn btn-gold px-8 py-3 text-sm"
          disabled={!selected || locked}
          onClick={() => {
            if (!selected || locked) return;
            setSubmitted(true);
            onSubmit({ kind: 'choice', optionId: selected });
          }}
        >
          <Compass className="h-4 w-4" aria-hidden />
          Commit to this decision
        </button>
        <p className="text-xs text-parchment/50">{selected ? 'One wrong decision restarts the chapter. Choose wisely.' : 'Select an option to continue.'}</p>
      </div>
    </div>
  );
}
