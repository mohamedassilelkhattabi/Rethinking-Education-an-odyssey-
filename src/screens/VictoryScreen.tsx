import { motion } from 'motion/react';
import { BookOpen, Map, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { GameIcon } from '../components/icons';
import { Divider, Laurel, Medallion } from '../components/Ornaments';
import { SunriseScene } from '../components/Scenes';
import { CHAPTERS, VICTORY_NARRATION } from '../data/chapters';
import { getRank, MAX_XP } from '../game/scoring';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onPlayAgain: () => void;
  onJourney: () => void;
  onReview: () => void;
}

export function VictoryScreen({ state, onPlayAgain, onJourney, onReview }: Props) {
  const rank = getRank(state.permanentXP);
  const [confirm, setConfirm] = useState(false);
  const stats: [string, string | number][] = [
    ['Final XP', `${state.permanentXP.toLocaleString()} / ${MAX_XP.toLocaleString()}`],
    ['Completed chapters', `${state.completedChapters.length}/4`],
    ['Questions solved', `${state.completedQuestionIds.length}/12`],
    ['Failed attempts', state.totalFailures],
    ['Hints used', state.totalHintsUsed],
    ['Crew remaining', state.crew],
    ['Supplies remaining', state.supplies],
    ['Total travel time', `${state.elapsedTime} hours`],
  ];

  return (
    <main className="relative min-h-screen px-4 pb-16 pt-10 md:pt-16">
      <SunriseScene />
      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 1.4 }} className="text-center">
          <div className="relative mx-auto h-20 w-48">
            <Laurel className="absolute inset-0 h-full w-full" />
          </div>
          <h1 className="font-display mt-1 text-5xl font-black text-gold-gradient text-shadow-deep md:text-7xl">ITHACA AT LAST</h1>
          <div className="mx-auto mt-5 max-w-2xl space-y-2">
            {VICTORY_NARRATION.map((line, i) => (
              <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 + i * 0.7 }} className="font-serif text-xl leading-snug text-[#fff6e0] drop-shadow-[0_2px_6px_rgba(0,0,0,.6)] md:text-2xl">
                {line}
              </motion.p>
            ))}
          </div>
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4.6, duration: 0.8 }} className="panel mt-[30vh] p-5 md:mt-[38vh] md:p-8">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-aegean-light">Your rank</p>
            <p className="font-display mt-1 text-3xl font-black text-gold-gradient md:text-4xl">{rank.title}</p>
            <p className="font-serif mt-1 text-lg italic text-parchment/75">{rank.description}</p>
          </div>
          <Divider className="my-5" />
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {stats.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-black/30 px-3 py-3 text-center">
                <dt className="text-[10px] uppercase tracking-widest text-parchment/50">{k}</dt>
                <dd className="font-display mt-1 text-lg font-bold tabular-nums text-parchment">{v}</dd>
              </div>
            ))}
          </dl>
          <h2 className="font-display mt-7 text-center text-sm font-bold uppercase tracking-[0.3em] text-gold">Badges of wisdom</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {CHAPTERS.map((c, i) => {
              const earned = state.completedChapters.includes(c.id);
              const flawless = state.chapterRecords[c.id]?.xp === 300;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 5 + i * 0.2, type: 'spring' }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center ${earned ? 'border-gold/50 bg-gold/10' : 'border-white/10 bg-white/5 opacity-50'}`}
                >
                  <Medallion className="h-14 w-14 shadow-[0_0_24px_rgba(216,175,99,.5)]" tone={earned ? 'gold' : 'gray'}>
                    <GameIcon name={c.badge.icon} className="h-7 w-7" />
                  </Medallion>
                  <p className="font-display text-sm font-bold text-parchment">{c.badge.name}</p>
                  {flawless && <p className="text-[10px] font-bold uppercase tracking-widest text-gold">★ Flawless</p>}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-gold px-7 py-3 text-sm" onClick={() => setConfirm(true)}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Play again
            </button>
            <button type="button" className="btn btn-ghost px-6 py-3 text-xs" onClick={onJourney}>
              <Map className="h-4 w-4" aria-hidden /> View journey
            </button>
            <button type="button" className="btn btn-teal px-6 py-3 text-xs" onClick={onReview}>
              <BookOpen className="h-4 w-4" aria-hidden /> Review computers & Python
            </button>
          </div>
          {confirm && (
            <div className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-center" role="alertdialog" aria-labelledby="again-title">
              <p id="again-title" className="text-sm text-parchment">Play again from the beginning? This clears your saved voyage, XP and statistics.</p>
              <div className="mt-3 flex justify-center gap-3">
                <button type="button" className="btn btn-ghost px-5 py-2 text-xs" onClick={() => setConfirm(false)} autoFocus>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger px-5 py-2 text-xs" onClick={onPlayAgain}>
                  Yes, start a new voyage
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
