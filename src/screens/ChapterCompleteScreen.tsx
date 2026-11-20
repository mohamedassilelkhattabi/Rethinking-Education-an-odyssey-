import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Clock, Crown, Package, Star } from 'lucide-react';
import { useMemo } from 'react';
import { GameIcon } from '../components/icons';
import { Divider, Laurel, Medallion, Meander } from '../components/Ornaments';
import { ChapterBackdrop } from '../components/Scenes';
import { useQuietFocus } from '../components/useQuietFocus';
import { getChapter, TOTAL_CHAPTERS } from '../data/chapters';
import { MAX_CHAPTER_XP } from '../game/scoring';
import type { GameState } from '../game/types';

function Confetti() {
  const reduce = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        x: (Math.random() - 0.5) * 900,
        y: -200 - Math.random() * 400,
        r: Math.random() * 720 - 360,
        d: Math.random() * 0.4,
        c: ['#d8af63', '#f1d49a', '#5fb8c4', '#fff6dc'][i % 4],
        s: 6 + Math.random() * 8,
      })),
    [],
  );
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-[40%] z-20" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-sm"
          style={{ width: b.s, height: b.s * 0.5, background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 700], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: 2.8, delay: b.d, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export function ChapterCompleteScreen({ state, onContinue }: { state: GameState; onContinue: () => void }) {
  const outcome = state.lastOutcome!;
  const chapter = getChapter(outcome.chapterId);
  const last = chapter.id === TOTAL_CHAPTERS;
  const replay = outcome.replay;
  const record = state.chapterRecords[chapter.id];
  const xp = replay ? 0 : outcome.chapterXPAwarded;
  const continueRef = useQuietFocus<HTMLButtonElement>();

  return (
    <main className="relative flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-8">
      <ChapterBackdrop theme={chapter.theme} dim={0.45} />
      <Confetti />
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} className="w-full max-w-2xl">
        <div className="relative mx-auto h-28 w-56">
          <Laurel className="absolute inset-0 h-full w-full" />
          <p className="font-display absolute inset-x-0 top-6 text-center text-5xl font-black text-gold-gradient text-shadow-deep">{chapter.numeral}</p>
        </div>
        <div className="mt-3 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.5em] text-success">{replay ? 'Practice voyage complete' : 'Chapter complete'}</p>
          <h1 className="font-display mt-2 text-3xl font-black text-parchment text-shadow-deep md:text-4xl">{chapter.title}</h1>
          <p className="mt-2 text-sm text-parchment/70">Three correct decisions in a row. The trial is passed.</p>
        </div>

        <section className="panel mt-6 p-5 md:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-black/30 p-3 text-center">
              <Star className="mx-auto h-5 w-5 text-gold" aria-hidden />
              <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="font-display mt-1 text-2xl font-black text-gold-light">
                {replay ? '—' : `+${xp}`}
              </motion.p>
              <p className="text-[10px] uppercase tracking-widest text-parchment/50">{replay ? 'XP already earned' : `of ${MAX_CHAPTER_XP} XP · now permanent`}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-3 text-center">
              {chapter.completionEffect.elapsedTime ? <Clock className="mx-auto h-5 w-5 text-gold" aria-hidden /> : <Package className="mx-auto h-5 w-5 text-gold" aria-hidden />}
              <p className="mt-1 text-sm font-semibold text-parchment">{replay ? 'No changes on a practice voyage' : chapter.completionEffectText}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-3 text-center">
              <Crown className="mx-auto h-5 w-5 text-gold" aria-hidden />
              <p className="font-display mt-1 text-2xl font-black text-parchment">{record?.attemptsToComplete ?? outcome.attemptNumber}</p>
              <p className="text-[10px] uppercase tracking-widest text-parchment/50">attempt{(record?.attemptsToComplete ?? outcome.attemptNumber) > 1 ? 's' : ''} needed</p>
            </div>
          </div>

          {!replay && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-5 flex items-center gap-4 rounded-xl border border-gold/40 bg-gold/10 p-4">
              <Medallion className="h-14 w-14 shrink-0">
                <GameIcon name={chapter.badge.icon} className="h-7 w-7" />
              </Medallion>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Badge earned</p>
                <p className="font-display text-lg font-bold text-parchment">{chapter.badge.name}</p>
                <p className="text-sm text-parchment/70">{chapter.badge.description}</p>
              </div>
            </motion.div>
          )}

          <Divider className="my-5" />
          <div className="parchment p-5">
            <Meander ink className="mb-3" />
            <div className="font-serif space-y-1.5 text-lg leading-snug text-ink md:text-xl">
              {chapter.completion.map((p, i) => (
                <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 + i * 0.4 }}>
                  {p}
                </motion.p>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button ref={continueRef} type="button" className="btn btn-gold px-10 py-4 text-sm" onClick={onContinue}>
              {last && !replay ? 'Sail into Ithaca' : 'Continue the voyage'} <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>
      </motion.div>
    </main>
  );
}
