import { AnimatePresence, motion } from 'motion/react';
import { Check, Plus, Ship, Star, Weight } from 'lucide-react';
import { useState } from 'react';
import { CargoMeter } from '../components/CargoMeter';
import { Expandable } from '../components/FeedbackPanel';
import { GameIcon } from '../components/icons';
import { Medallion } from '../components/Ornaments';
import { knapsackTotals } from '../game/optimization';
import { sfx } from '../game/sound';
import type { Answer, KnapsackQuestion } from '../game/types';

interface Props {
  question: KnapsackQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
}

export function KnapsackEducation() {
  return (
    <div className="space-y-3 text-sm text-parchment/85">
      <p>
        The <strong className="text-gold-light">0/1 knapsack problem</strong> asks for the best <em>subset</em> of items under a capacity limit. Each item
        is either taken whole (1) or left behind (0) — no fractions.
      </p>
      <div className="rounded-lg bg-black/30 p-3 font-mono text-[13px] leading-relaxed text-parchment">
        <p>
          <span className="text-aegean-light">maximize</span> Σ valueᵢ · xᵢ
        </p>
        <p>
          <span className="text-aegean-light">subject to</span> Σ weightᵢ · xᵢ ≤ capacity
        </p>
        <p className="pl-[5.5rem]">xᵢ ∈ {'{0, 1}'}</p>
      </div>
      <p>
        With n items there are 2ⁿ possible subsets. For a small hold like this, the game checks every one of them (brute force) to find the true optimum —
        and accepts any combination that ties it.
      </p>
      <p className="text-parchment/60">Tip: the heaviest load, the most items, or the single most valuable item are all tempting — but only total value matters.</p>
    </div>
  );
}

export function KnapsackChallenge({ question, disabled, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const locked = disabled || submitted;
  const { weight, value } = knapsackTotals(question.items, selected);
  const over = weight > question.capacity;

  const toggle = (id: string) => {
    if (locked) return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    sfx.select();
  };

  const loaded = question.items.filter((it) => selected.includes(it.id));

  return (
    <div className="flex flex-col gap-4">
      <div className={`grid grid-cols-2 gap-3 ${question.items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`} role="group" aria-label="Supplies offered by Aeolus">
        {question.items.map((it, i) => {
          const isSel = selected.includes(it.id);
          const wouldOverflow = !isSel && weight + it.weight > question.capacity;
          return (
            <motion.button
              key={it.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => toggle(it.id)}
              disabled={locked}
              aria-pressed={isSel}
              aria-label={`${it.name}: weight ${it.weight}, value ${it.value}${isSel ? ', loaded' : ''}`}
              className={`choice-card group relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center md:p-4 ${
                isSel ? 'border-gold bg-gradient-to-b from-[#3b3220] to-[#1b1a14]' : 'border-gold/25 bg-gradient-to-b from-[#1b3352]/90 to-[#0e1a2c]/95'
              }`}
            >
              <span className={`absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border ${isSel ? 'border-gold bg-gold text-midnight' : 'border-gold/40 text-gold/70'}`}>
                {isSel ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" />}
              </span>
              <Medallion className="h-14 w-14 md:h-16 md:w-16" tone={isSel ? 'gold' : 'teal'}>
                <GameIcon name={it.icon} className="h-7 w-7 md:h-8 md:w-8" />
              </Medallion>
              <h4 className="font-display text-base font-bold text-parchment">{it.name}</h4>
              <p className="text-xs leading-snug text-parchment/60">{it.flavor}</p>
              <div className="mt-auto grid w-full grid-cols-2 gap-1.5 text-sm">
                <span className="flex items-center justify-center gap-1 rounded-lg bg-black/30 px-2 py-1">
                  <Weight className="h-3.5 w-3.5 text-parchment/60" aria-hidden />
                  <span className="font-bold tabular-nums text-parchment">{it.weight}</span>
                  <span className="text-[10px] uppercase text-parchment/50">wt</span>
                </span>
                <span className="flex items-center justify-center gap-1 rounded-lg bg-black/30 px-2 py-1">
                  <Star className="h-3.5 w-3.5 text-gold" aria-hidden />
                  <span className="font-bold tabular-nums text-gold-light">{it.value}</span>
                  <span className="text-[10px] uppercase text-parchment/50">val</span>
                </span>
              </div>
              {wouldOverflow && !locked && <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ffb4a8]/80">Would exceed capacity</span>}
            </motion.button>
          );
        })}
      </div>

      <div className="panel space-y-4 p-4 md:p-5">
        {/* ship's hold */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-parchment/55">
            <Ship className="h-4 w-4 text-gold" aria-hidden /> The ship’s hold
          </p>
          <div className="relative h-16 overflow-hidden rounded-b-[2.5rem] rounded-t-lg border-2 border-bronze bg-gradient-to-b from-[#5e3a1e] to-[#2b190c] p-1.5">
            <div className="flex h-full gap-1">
              <AnimatePresence>
                {loaded.map((it) => (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className={`flex h-full items-center justify-center gap-1 rounded-md border ${over ? 'border-danger bg-danger/40' : 'border-gold/60 bg-gradient-to-b from-[#c9a56a] to-[#8a6236]'} text-[#2b1c08]`}
                    style={{ width: `${(it.weight / Math.max(question.capacity, weight)) * 100}%` }}
                    title={`${it.name} (${it.weight})`}
                  >
                    <GameIcon name={it.icon} className="h-5 w-5 shrink-0" />
                    <span className="hidden truncate text-xs font-bold sm:inline">{it.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loaded.length === 0 && <p className="m-auto text-xs italic text-parchment/40">Empty — select supplies above to load them.</p>}
            </div>
          </div>
        </div>
        <CargoMeter weight={weight} capacity={question.capacity} value={value} />
        <div className="flex flex-col items-center gap-2 pt-1">
          <button
            type="button"
            className={`btn ${over ? 'btn-danger' : 'btn-gold'} px-8 py-3 text-sm`}
            disabled={selected.length === 0 || locked}
            onClick={() => {
              if (selected.length === 0 || locked) return;
              setSubmitted(true);
              onSubmit({ kind: 'knapsack', itemIds: selected });
            }}
          >
            <Ship className="h-4 w-4" aria-hidden /> Load the ship
          </button>
          <p className="text-center text-xs text-parchment/50">
            {selected.length === 0 ? 'Choose at least one supply.' : over ? 'Warning: an overloaded ship is an infeasible solution.' : 'Is this the most valuable cargo that fits?'}
          </p>
        </div>
      </div>

      <Expandable title="Learn: the 0/1 knapsack problem">
        <KnapsackEducation />
      </Expandable>
    </div>
  );
}
