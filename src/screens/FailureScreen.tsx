import { motion } from 'motion/react';
import { AlertTriangle, BookOpen, Compass, Map, RotateCcw, Target } from 'lucide-react';
import { AnimatedShip } from '../components/AnimatedShip';
import { BreakdownTable, Expandable } from '../components/FeedbackPanel';
import { Divider } from '../components/Ornaments';
import { StormScene } from '../components/Scenes';
import { useQuietFocus } from '../components/useQuietFocus';
import { getChapter } from '../data/chapters';
import { getQuestion } from '../data/questions';
import type { GameState } from '../game/types';

function StreakCollapse({ before }: { before: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Streak reset from ${before} to 0`}>
      {[0, 1, 2].map((i) => {
        const wasDone = i < before;
        const failedHere = i === before;
        return (
          <motion.span
            key={i}
            initial={{ scale: 1, backgroundColor: wasDone ? 'rgba(216,175,99,.35)' : failedHere ? 'rgba(198,79,79,.5)' : 'rgba(255,255,255,.05)' }}
            animate={{ scale: [1, 1.15, 0.9, 1], backgroundColor: 'rgba(255,255,255,.04)', borderColor: 'rgba(198,79,79,.6)' }}
            transition={{ delay: 0.9 + i * 0.18, duration: 0.7 }}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold/50 font-display text-sm font-bold text-parchment/70"
          >
            Q{i + 1}
          </motion.span>
        );
      })}
      <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }} className="font-display ml-3 text-lg font-bold text-[#ffb4a8]">
        Streak {before}/3 → 0/3
      </motion.span>
    </div>
  );
}

export function FailureScreen({ state, onRetry, onMap }: { state: GameState; onRetry: () => void; onMap: () => void }) {
  const outcome = state.lastOutcome!;
  const chapter = getChapter(outcome.chapterId);
  const question = getQuestion(outcome.questionId);
  const e = outcome.evaluation;
  const retryRef = useQuietFocus<HTMLButtonElement>();

  return (
    <main className="relative min-h-[calc(100vh-56px)] px-3 py-6 md:px-6 md:py-10">
      <StormScene />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mx-auto max-w-3xl pb-48">
        <div className="text-center">
          <div className="relative mx-auto h-32 w-56" aria-hidden>
            <AnimatedShip motion="toss" sailColor="crimson" className="absolute inset-x-0 top-0 mx-auto w-48 drop-shadow-[0_0_24px_rgba(198,79,79,.45)]" />
            <svg viewBox="0 0 224 40" className="absolute inset-x-0 bottom-0 h-10 w-full">
              <path d="M0 20 Q28 4 56 20 T112 20 T168 20 T224 20 L224 40 L0 40 Z" fill="#1b2a37" />
              <path d="M0 26 Q28 12 56 26 T112 26 T168 26 T224 26 L224 40 L0 40 Z" fill="#0e1822" />
            </svg>
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.2 }} className="absolute -right-2 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-danger shadow-[0_0_40px_rgba(198,79,79,.8)]">
              <AlertTriangle className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          <h1 className="font-display mt-4 text-3xl font-black leading-tight text-[#ffd9d0] text-shadow-deep md:text-5xl">Your Journey Has Been Interrupted</h1>
          <p className="font-serif mt-2 text-xl italic text-parchment/80">One wrong decision has cost you this chapter’s progress.</p>
        </div>

        <div className="mt-6">
          <StreakCollapse before={outcome.streakBefore} />
        </div>

        <section className="panel mt-6 border-danger/40 p-5 md:p-7" style={{ borderColor: 'rgba(198,79,79,.45)' }}>
          <dl className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
            {[
              ['Chapter', `${chapter.numeral}. ${chapter.location}`],
              ['Failed at', `Question ${outcome.questionIndex + 1} of 3`],
              ['Completed before', `${outcome.streakBefore} question${outcome.streakBefore === 1 ? '' : 's'}`],
              ['Attempt', `#${outcome.attemptNumber}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-black/30 px-2 py-2">
                <dt className="text-[10px] uppercase tracking-widest text-parchment/50">{k}</dt>
                <dd className="font-display mt-0.5 text-sm font-bold text-parchment">{v}</dd>
              </div>
            ))}
          </dl>
          {outcome.temporaryXPLost > 0 && (
            <p className="mt-3 text-center text-sm text-[#ffb4a8]">
              Temporary XP lost: {outcome.temporaryXPLost} → 0 · Resource changes from this attempt were restored.
            </p>
          )}
          <Divider className="my-5" />

          <h2 className="font-display text-lg font-bold text-parchment">{question.title}</h2>
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-parchment/50">1 · Your answer</p>
              <p className="mt-1 font-semibold text-parchment">{e.selectedLabel}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff9d8f]">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> 2 · Why it was wrong — {e.headline}
              </p>
              <p className="mt-1 leading-relaxed text-parchment/90">{e.reason}</p>
            </div>
            <div className="rounded-lg border-l-4 border-aegean-light bg-aegean/10 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-aegean-light">
                <Target className="h-3.5 w-3.5" aria-hidden /> 3 · The lesson
              </p>
              <p className="mt-1 text-sm text-parchment/90">{e.principle}</p>
            </div>
            <div className="rounded-lg border-l-4 border-gold bg-gold/10 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
                <Compass className="h-3.5 w-3.5" aria-hidden /> 4 · Next time
              </p>
              <p className="mt-1 text-sm text-parchment/90">{e.nextTime}</p>
            </div>
            <Expandable title="Compare every option" icon={<BookOpen className="h-4 w-4" aria-hidden />}>
              <BreakdownTable rows={e.breakdown} valueHeader={question.kind === 'graph' ? 'Total cost' : question.kind === 'knapsack' ? 'Value · weight' : question.kind === 'quiz' ? 'Answer' : 'Objective'} />
            </Expandable>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button ref={retryRef} type="button" className="btn btn-danger px-10 py-4 text-sm" onClick={onRetry}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Retry chapter
            </button>
            <button type="button" className="btn btn-ghost px-5 py-2.5 text-xs" onClick={onMap}>
              <Map className="h-4 w-4" aria-hidden /> Return to map
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-parchment/50">Retrying restarts at question 1. Previously completed chapters are safe.</p>
        </section>
      </motion.div>
    </main>
  );
}
