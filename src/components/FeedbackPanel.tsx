import { motion } from 'motion/react';
import { ArrowRight, Check, ChevronDown, Clock, Sigma, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { BreakdownRow, DijkstraStep, Evaluation } from '../game/types';
import { Divider, Laurel } from './Ornaments';

export function Expandable({ title, children, defaultOpen = false, icon }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; icon?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gold/25 bg-black/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-semibold text-gold-light"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {icon ?? <Sigma className="h-4 w-4" aria-hidden />}
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && <div className="border-t border-gold/15 px-4 py-3">{children}</div>}
    </div>
  );
}

export function BreakdownTable({ rows, valueHeader = 'Objective' }: { rows: BreakdownRow[]; valueHeader?: string }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[420px] border-separate border-spacing-y-1 text-left text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-parchment/50">
            <th className="px-2 font-semibold">Option</th>
            <th className="px-2 font-semibold">{valueHeader}</th>
            <th className="px-2 font-semibold">Feasible</th>
            <th className="px-2 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={`${r.optimal ? 'bg-success/15' : r.selected ? 'bg-danger/15' : 'bg-white/5'}`}>
              <td className="rounded-l-lg px-2 py-1.5 font-semibold text-parchment">
                {r.label}
                {r.selected && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-parchment/70">your choice</span>}
              </td>
              <td className="px-2 py-1.5 tabular-nums text-parchment/90">{r.metric}</td>
              <td className="px-2 py-1.5">
                {r.feasible ? <Check className="h-4 w-4 text-success" aria-label="feasible" /> : <X className="h-4 w-4 text-danger" aria-label="infeasible" />}
              </td>
              <td className="rounded-r-lg px-2 py-1.5 text-xs text-parchment/70">
                {r.optimal && <span className="mr-1 font-bold text-success">★ Correct ·</span>}
                {r.note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DijkstraTrace({ steps, path }: { steps: DijkstraStep[]; path?: string[] }) {
  const nodes = steps.length ? Object.keys(steps[0].table) : [];
  return (
    <div className="space-y-3 text-sm">
      <p className="text-parchment/75">
        Dijkstra’s algorithm repeatedly finalizes the unvisited island with the lowest tentative cost, then relaxes its outgoing routes.
      </p>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-y-1 text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-parchment/50">
              <th className="px-2">Step</th>
              <th className="px-2">Finalize</th>
              {nodes.map((n) => (
                <th key={n} className="px-2 text-center">
                  {n === 'ITHACA' ? 'ITH' : n === 'START' ? 'S' : n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map((s, i) => (
              <tr key={i} className="bg-white/5">
                <td className="rounded-l-lg px-2 py-1 text-parchment/60">{i + 1}</td>
                <td className="px-2 py-1 font-semibold text-gold-light">
                  {s.visit} <span className="text-parchment/60">({s.distance})</span>
                </td>
                {nodes.map((n, j) => {
                  const v = s.table[n];
                  const updated = s.updates.some((u) => u.node === n);
                  const visitedNow = s.visit === n;
                  return (
                    <td
                      key={n}
                      className={`px-2 py-1 text-center tabular-nums ${j === nodes.length - 1 ? 'rounded-r-lg' : ''} ${visitedNow ? 'font-bold text-gold' : updated ? 'font-semibold text-aegean-light' : 'text-parchment/55'}`}
                    >
                      {v === null ? '∞' : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-parchment/55">
        <span className="font-semibold text-gold">Gold</span> = finalized this step · <span className="font-semibold text-aegean-light">teal</span> = tentative cost improved.
      </p>
      {path && (
        <p className="rounded-lg bg-success/15 px-3 py-2 font-semibold text-parchment">
          Reconstructed shortest route: <span className="text-gold-light">{path.join(' → ')}</span>
        </p>
      )}
    </div>
  );
}

function XPBurst({ xp, usedHint, replay }: { xp: number; usedHint: boolean; replay: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (xp === 0) return;
    let frame = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      setShown(Math.round(xp * p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [xp]);
  return (
    <motion.div initial={{ scale: 0.4, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }} className="text-center">
      <p className="font-display text-5xl font-black text-gold-gradient text-shadow-deep">{replay ? 'Practice' : `+${shown} XP`}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-parchment/60">
        {replay ? 'XP for this chapter was already earned' : usedHint ? 'Hint used · half XP' : 'Flawless · full XP'}
        {!replay && ' · held until the chapter is complete'}
      </p>
    </motion.div>
  );
}

interface FeedbackPanelProps {
  evaluation: Evaluation;
  xpEarned: number;
  usedHint: boolean;
  streak: number;
  chapterCompleted: boolean;
  replay?: boolean;
  timeAdded?: number;
  onContinue: () => void;
  continueLabel?: string;
  demo?: boolean;
}

/** Correct-answer overlay: success message, XP, streak, explanation and the math behind it. */
export function FeedbackPanel({ evaluation, xpEarned, usedHint, streak, chapterCompleted, replay = false, timeAdded, onContinue, continueLabel, demo }: FeedbackPanelProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    btnRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-abyss/75 p-3 backdrop-blur-sm md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <motion.div
        initial={{ y: 40, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="panel my-4 w-full max-w-2xl p-5 md:p-7"
      >
        <div className="relative mx-auto -mt-2 h-20 w-40">
          <Laurel className="absolute inset-0 h-full w-full" />
          <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.1 }} className="absolute left-1/2 top-3 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-success shadow-[0_0_30px_rgba(76,155,120,.7)]">
            <Check className="h-7 w-7 text-white" strokeWidth={3} aria-hidden />
          </motion.div>
        </div>
        <h2 id="feedback-title" className="font-display mt-2 text-center text-2xl font-bold text-gold md:text-3xl">
          {chapterCompleted && !demo ? 'The Final Trial Is Passed!' : 'Wisdom Prevails!'}
        </h2>
        <p className="mt-1 text-center text-sm font-semibold uppercase tracking-[0.25em] text-success">{evaluation.headline}</p>

        {!demo && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <XPBurst xp={xpEarned} usedHint={usedHint} replay={replay} />
            <div className="flex items-center gap-2" aria-label={`Streak ${streak} of 3`}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  initial={i === streak - 1 ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${i < streak ? 'border-gold bg-gold/25 text-gold-light shadow-[0_0_14px_rgba(216,175,99,.6)]' : 'border-white/20 text-white/30'}`}
                >
                  {i < streak ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                </motion.span>
              ))}
              <span className="font-display ml-2 text-lg font-bold text-parchment">Streak {streak}/3</span>
            </div>
          </div>
        )}

        <Divider className="my-5" />
        <div className="space-y-3">
          <p className="text-sm text-parchment/60">
            Your decision: <span className="font-semibold text-parchment">{evaluation.selectedLabel}</span>
          </p>
          <p className="font-serif text-xl leading-snug text-parchment">{evaluation.explanation}</p>
          <p className="rounded-lg border-l-4 border-aegean-light bg-aegean/10 px-3 py-2 text-sm text-parchment/85">
            <span className="font-bold text-aegean-light">Principle · </span>
            {evaluation.principle}
          </p>
          {!!timeAdded && (
            <p className="flex items-center gap-2 text-sm text-parchment/70">
              <Clock className="h-4 w-4 text-gold" aria-hidden /> +{timeAdded} hours of sailing added to the voyage (temporary until the chapter is complete).
            </p>
          )}
          {evaluation.dijkstra ? (
            <Expandable title="Visual breakdown: Dijkstra’s algorithm" defaultOpen>
              <DijkstraTrace steps={evaluation.dijkstra} path={evaluation.optimalPath} />
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-parchment/50">Every possible route</p>
                <BreakdownTable rows={evaluation.breakdown} valueHeader="Total cost" />
              </div>
            </Expandable>
          ) : (
            <Expandable title="Compare the answers">
              <BreakdownTable rows={evaluation.breakdown} valueHeader={evaluation.unit === 'survival value' ? 'Value · weight' : evaluation.unit === 'answer' ? 'Answer' : 'Objective'} />
            </Expandable>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            ref={btnRef}
            type="button"
            className="btn btn-gold px-8 py-3 text-sm"
            disabled={locked}
            onClick={() => {
              setLocked(true);
              onContinue();
            }}
          >
            {continueLabel ?? (chapterCompleted ? 'Complete the Chapter' : 'Next Challenge')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
