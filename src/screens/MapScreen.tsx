import { motion } from 'motion/react';
import { BookOpen, Check, Crown, Home, Lock, Sailboat, Star } from 'lucide-react';
import { useState } from 'react';
import { CHAPTERS, LOCATIONS } from '../data/chapters';
import { Divider } from '../components/Ornaments';
import { WorldMap, type LocationStatus } from '../components/WorldMap';
import { frontierChapter, isVoyageComplete } from '../game/reducer';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onOpenChapter: (chapterId: number) => void;
  onShipArrived: () => void;
  onReview: () => void;
  onTitle: () => void;
  onVictory: () => void;
}

export function MapScreen({ state, onOpenChapter, onShipArrived, onReview, onTitle, onVictory }: Props) {
  const frontier = frontierChapter(state.completedChapters);
  const complete = isVoyageComplete(state);
  const statuses: LocationStatus[] = LOCATIONS.map((loc, i) => {
    if (i === 0) return 'completed';
    if (loc.chapterId === null) return complete ? 'completed' : 'locked';
    if (state.completedChapters.includes(loc.chapterId)) return 'completed';
    return loc.chapterId === frontier ? 'current' : 'locked';
  });
  const shipAt = Math.min(frontier, LOCATIONS.length - 1);
  const [selected, setSelected] = useState<number>(Math.min(frontier, LOCATIONS.length - 1));
  const selLoc = LOCATIONS[selected];
  const selChapter = selLoc.chapterId ? CHAPTERS.find((c) => c.id === selLoc.chapterId)! : null;
  const selStatus = statuses[selected];

  return (
    <main className="relative min-h-[calc(100vh-56px)] px-3 py-5 md:px-6 md:py-8">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#1c3a5a_0%,#101b2d_55%,#0a1220_100%)]" aria-hidden />
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.4em] text-aegean-light">The wine-dark sea</p>
            <h1 className="font-display text-3xl font-black text-gold-gradient md:text-4xl">The Voyage Home</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost px-4 py-2 text-xs" onClick={onReview}>
              <BookOpen className="h-4 w-4" aria-hidden /> Concepts
            </button>
            <button type="button" className="btn btn-ghost px-4 py-2 text-xs" onClick={onTitle}>
              <Home className="h-4 w-4" aria-hidden /> Title
            </button>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="parchment scrollbar-thin self-start overflow-x-auto p-2 md:p-3">
            <div className="min-w-[620px]">
            <WorldMap
              statuses={statuses}
              shipAt={shipAt}
              shipMove={state.pendingShipMove}
              onShipArrived={onShipArrived}
              selected={selected}
              onSelect={(i) => {
                setSelected(i);
              }}
            />
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 xl:flex xl:flex-col">
            <motion.section key={selected} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="panel p-5">
              {selChapter ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-aegean-light">
                    Chapter {selChapter.numeral} · {selChapter.difficulty}
                  </p>
                  <h2 className="font-display mt-1 text-xl font-bold text-parchment">{selChapter.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selChapter.focus.map((f) => (
                      <span key={f} className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-0.5 text-xs text-gold-light">
                        {f}
                      </span>
                    ))}
                  </div>
                  <Divider className="my-4" />
                  {selStatus === 'locked' ? (
                    <p className="flex items-center gap-2 text-sm text-parchment/60">
                      <Lock className="h-4 w-4" aria-hidden /> Complete the previous chapter to unlock this island.
                    </p>
                  ) : (
                    <>
                      {selStatus === 'completed' && state.chapterRecords[selChapter.id] && (
                        <p className="mb-3 flex items-center gap-2 text-sm text-gold-light">
                          <Check className="h-4 w-4" aria-hidden /> Completed · {state.chapterRecords[selChapter.id].xp} XP earned
                        </p>
                      )}
                      <button type="button" className={`btn ${selStatus === 'current' ? 'btn-gold' : 'btn-ghost'} w-full px-6 py-3 text-sm`} onClick={() => onOpenChapter(selChapter.id)}>
                        <Sailboat className="h-4 w-4" aria-hidden /> {selStatus === 'current' ? 'Sail to this island' : 'Revisit (practice)'}
                      </button>
                      {selStatus === 'completed' && <p className="mt-2 text-center text-xs text-parchment/50">Practice voyages award no XP and change no resources.</p>}
                    </>
                  )}
                </>
              ) : selected === 0 ? (
                <>
                  <h2 className="font-display text-xl font-bold text-parchment">Troy</h2>
                  <p className="font-serif mt-2 text-lg text-parchment/75">Where the voyage began, ten years after the war. There is no going back — only forward.</p>
                </>
              ) : (
                <>
                  <h2 className="font-display flex items-center gap-2 text-xl font-bold text-parchment">
                    <Crown className="h-5 w-5 text-gold" aria-hidden /> Ithaca
                  </h2>
                  {complete ? (
                    <>
                      <p className="font-serif mt-2 text-lg text-parchment/80">Home at last. The voyage is complete.</p>
                      <button type="button" className="btn btn-gold mt-4 w-full px-6 py-3 text-sm" onClick={onVictory}>
                        <Crown className="h-4 w-4" aria-hidden /> View the victory
                      </button>
                    </>
                  ) : (
                    <p className="mt-2 flex items-center gap-2 text-sm text-parchment/60">
                      <Lock className="h-4 w-4" aria-hidden /> Conquer all four chapters to reach home.
                    </p>
                  )}
                </>
              )}
            </motion.section>

            <section className="panel p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-gold">Ship’s log</h2>
              <ul className="mt-3 space-y-2">
                {CHAPTERS.map((c) => {
                  const done = state.completedChapters.includes(c.id);
                  const rec = state.chapterRecords[c.id];
                  const attempts = state.chapterAttempts[c.id] ?? 0;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(c.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/5 ${selected === c.id ? 'bg-white/10' : ''}`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${
                            done ? 'bg-gold text-midnight' : c.id === frontier ? 'bg-aegean text-white' : 'bg-white/10 text-white/40'
                          }`}
                        >
                          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : c.numeral}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-semibold ${done || c.id === frontier ? 'text-parchment' : 'text-parchment/40'}`}>{c.location}</span>
                          <span className="block text-xs text-parchment/45">
                            {attempts ? `${attempts} attempt${attempts > 1 ? 's' : ''}` : c.id === frontier ? 'Awaiting your arrival' : 'Locked'}
                          </span>
                        </span>
                        {rec && (
                          <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-gold-light">
                            <Star className="h-3.5 w-3.5" aria-hidden /> {rec.xp}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-parchment/60">
                <div className="rounded-lg bg-black/25 py-2">
                  <p className="font-display text-lg font-bold text-parchment">{state.totalFailures}</p>Failed attempts
                </div>
                <div className="rounded-lg bg-black/25 py-2">
                  <p className="font-display text-lg font-bold text-parchment">{state.totalHintsUsed}</p>Hints used
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
