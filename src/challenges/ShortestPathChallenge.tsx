import { AnimatePresence, motion } from 'motion/react';
import { Anchor, MapPin, Navigation, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Expandable } from '../components/FeedbackPanel';
import { WeightedGraph } from '../components/WeightedGraph';
import { findEdge } from '../game/optimization';
import { sfx } from '../game/sound';
import type { Answer, ShortestPathQuestion } from '../game/types';

interface Props {
  question: ShortestPathQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
}

export function DijkstraEducation() {
  const steps = [
    'Start with a distance of zero at START; every other island is ∞ (unknown).',
    'Calculate tentative costs to every island connected to the current one.',
    'Select the unvisited island with the lowest tentative cost and finalize it.',
    'Update neighbouring islands if a cheaper path through it is found.',
    'Repeat until the destination is finalized.',
    'Reconstruct the shortest route by following each island’s best predecessor back to START.',
  ];
  return (
    <div className="space-y-3 text-sm text-parchment/85">
      <p>
        A <strong className="text-gold-light">weighted directed graph</strong> has islands (nodes) and one-way sea routes (edges) with costs. The cost of a
        route is the <em>sum</em> of its edge weights. <strong className="text-gold-light">Dijkstra’s algorithm</strong> finds the cheapest route:
      </p>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aegean/40 text-[11px] font-bold text-aegean-light">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="text-parchment/60">Fewer stops does not mean cheaper, and the cheapest first leg can lead into the most expensive waters.</p>
    </div>
  );
}

export function ShortestPathChallenge({ question, disabled, onSubmit }: Props) {
  const [path, setPath] = useState<string[]>([question.start]);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const locked = disabled || submitted;
  const current = path[path.length - 1];
  const arrived = current === question.goal;

  const legs = path.slice(1).map((to, i) => findEdge(question.edges, path[i], to)?.weight ?? 0);
  const cost = legs.reduce((s, w) => s + w, 0);

  useEffect(() => {
    if (!invalid) return;
    const t = setTimeout(() => setInvalid(null), 600);
    return () => clearTimeout(t);
  }, [invalid]);

  const click = (id: string) => {
    if (locked) return;
    if (id === current) return;
    if (arrived) {
      setMessage(`You have reached ${question.goal}. Submit your route, or Undo to change it.`);
      return;
    }
    if (path.includes(id)) {
      setInvalid(id);
      setMessage(`Your route already passes through ${id}. Use Undo to change course.`);
      sfx.invalid();
      return;
    }
    if (!findEdge(question.edges, current, id)) {
      setInvalid(id);
      setMessage(`There is no sea route from ${current} to ${id}. Follow the arrows leaving ${current}.`);
      sfx.invalid();
      return;
    }
    setMessage(null);
    setPath((p) => [...p, id]);
    sfx.select();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="parchment scrollbar-thin overflow-x-auto p-1.5 md:p-3">
        <div className="min-w-[540px]">
          <WeightedGraph question={question} path={path} onNodeClick={click} disabled={locked} invalidNode={invalid} />
        </div>
      </div>

      <div className="panel grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-parchment/55">Charted route</p>
          <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
            {path.map((id, i) => (
              <span key={`${id}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="flex items-center gap-1 text-xs text-parchment/50">
                    →<span className="rounded bg-gold/20 px-1 font-bold text-gold-light">{legs[i - 1]}</span>→
                  </span>
                )}
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`rounded-full border px-2.5 py-1 font-display text-xs font-bold ${id === question.goal ? 'border-gold bg-gold/30 text-gold-light' : 'border-aegean-light/50 bg-aegean/20 text-parchment'}`}
                >
                  {id}
                </motion.span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p className="flex items-center gap-1.5 text-parchment/70">
              <Navigation className="h-4 w-4 text-gold" aria-hidden /> Total cost:{' '}
              <span className="font-display text-xl font-bold tabular-nums text-gold-light">{cost}</span>
              {legs.length > 1 && <span className="text-xs text-parchment/45">({legs.join(' + ')})</span>}
            </p>
            <p className="flex items-center gap-1.5 text-parchment/70">
              <MapPin className="h-4 w-4 text-aegean-light" aria-hidden /> Current location: <span className="font-bold text-parchment">{current}</span>
            </p>
          </div>
          <AnimatePresence>
            {message && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg bg-danger/15 px-3 py-1.5 text-sm text-[#ffcfc6]" role="alert">
                {message}
              </motion.p>
            )}
          </AnimatePresence>
          {!arrived && !message && <p className="text-xs text-parchment/50">Click a glowing island connected to {current} to sail there.</p>}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 md:flex-col md:items-stretch">
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost flex-1 px-4 py-2 text-xs"
              disabled={locked || path.length <= 1}
              onClick={() => {
                setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));
                setMessage(null);
              }}
            >
              <Undo2 className="h-4 w-4" aria-hidden /> Undo
            </button>
            <button
              type="button"
              className="btn btn-ghost flex-1 px-4 py-2 text-xs"
              disabled={locked || path.length <= 1}
              onClick={() => {
                setPath([question.start]);
                setMessage(null);
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Reset path
            </button>
          </div>
          <button
            type="button"
            className="btn btn-gold px-6 py-3 text-sm"
            disabled={!arrived || locked}
            onClick={() => {
              if (!arrived || locked) return;
              setSubmitted(true);
              onSubmit({ kind: 'graph', path });
            }}
          >
            <Anchor className="h-4 w-4" aria-hidden /> Submit route
          </button>
        </div>
      </div>

      <Expandable title="Learn: shortest paths & Dijkstra’s algorithm">
        <DijkstraEducation />
      </Expandable>
    </div>
  );
}
