import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Eye, LogOut, Presentation, RotateCcw, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { ChallengeRenderer } from '../challenges/ChallengeRenderer';
import { BreakdownTable, FeedbackPanel } from '../components/FeedbackPanel';
import { HintPanel } from '../components/HintPanel';
import { ChapterBackdrop } from '../components/Scenes';
import { StoryPanel } from '../components/StoryPanel';
import { getChapter } from '../data/chapters';
import { getQuestion } from '../data/questions';
import { evaluateAnswer, optimalAnswer } from '../game/optimization';
import { sfx } from '../game/sound';
import type { Answer, Evaluation } from '../game/types';

const DEMO_IDS = [1, 4, 7, 10];
const DEMO_LABELS = ['Easy · Computer basics', 'Medium · Python basics', 'Medium · Lists and loops', 'Hard · Python debugging'];

/** Presenter showcase: one challenge per chapter, isolated from the saved campaign. */
export function DemoScreen({ onExit }: { onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [hint, setHint] = useState(false);
  const [reveal, setReveal] = useState(false);
  const question = getQuestion(DEMO_IDS[index]);
  const chapter = getChapter(question.chapterId);

  const go = (i: number) => {
    setIndex(i);
    setRound((r) => r + 1);
    setResult(null);
    setHint(false);
    setReveal(false);
  };

  const submit = (a: Answer) => {
    const ev = evaluateAnswer(question, a);
    setResult(ev);
    if (ev.correct) sfx.correct();
    else sfx.fail();
  };

  const solution = reveal ? evaluateAnswer(question, optimalAnswer(question)) : null;

  return (
    <div className="relative min-h-screen">
      <ChapterBackdrop theme={chapter.theme} dim={0.55} />
      <header className="sticky top-0 z-30 border-b-2 border-aegean-light/60 bg-gradient-to-r from-[#0d3440] via-[#163b5c] to-[#0d3440] shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-3 py-2 md:px-6">
          <span className="flex items-center gap-2 rounded-full bg-aegean-light px-3 py-1 font-display text-xs font-black tracking-[0.2em] text-midnight">
            <Presentation className="h-4 w-4" aria-hidden /> DEMO MODE
          </span>
          <span className="hidden text-xs text-parchment/70 md:inline">Presenter showcase · not saved · does not affect the campaign</span>
          <nav className="ml-auto flex flex-wrap gap-1.5" aria-label="Demo challenges">
            {DEMO_IDS.map((id, i) => (
              <button
                key={id}
                type="button"
                onClick={() => go(i)}
                aria-current={i === index ? 'step' : undefined}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${i === index ? 'border-gold bg-gold text-midnight' : 'border-gold/30 text-parchment/80 hover:bg-white/10'}`}
              >
                {getChapter(getQuestion(id).chapterId).numeral} · {DEMO_LABELS[i]}
              </button>
            ))}
          </nav>
          <button type="button" className="btn btn-ghost px-4 py-1.5 text-xs" onClick={onExit}>
            <LogOut className="h-4 w-4" aria-hidden /> Exit demo
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-5 md:px-6">
        <div className="panel mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-aegean-light">
              Demo {index + 1} of 4 · Chapter {chapter.numeral} · {chapter.difficulty}
            </p>
            <h1 className="font-display text-lg font-bold text-parchment">{chapter.title}</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost px-4 py-2 text-xs" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
              <Eye className="h-4 w-4" aria-hidden /> {reveal ? 'Hide' : 'Reveal'} solution
            </button>
            <button type="button" className="btn btn-ghost px-4 py-2 text-xs" onClick={() => go(index)}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Reset
            </button>
            {index < DEMO_IDS.length - 1 && (
              <button type="button" className="btn btn-teal px-4 py-2 text-xs" onClick={() => go(index + 1)}>
                <SkipForward className="h-4 w-4" aria-hidden /> Skip
              </button>
            )}
          </div>
        </div>

        {solution && (
          <p className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-parchment">
            <strong className="text-gold-light">Correct answer:</strong> {solution.optimalLabel}. Checked against{' '}
            {question.kind === 'quiz' ? 'the lesson and answer explanation' : question.kind === 'choice' ? 'constraint filtering + objective comparison' : question.kind === 'knapsack' ? 'brute-force subset enumeration' : 'Dijkstra’s algorithm'}.
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_1fr] lg:gap-6">
          <div className="flex flex-col gap-3">
            <StoryPanel question={question} indexLabel={`Demo challenge · Question ${question.id}`} />
            <HintPanel hint={question.lesson.hint} used={hint} onUse={() => setHint(true)} showCost={false} />
          </div>
          <div>
            <ChallengeRenderer key={`${round}-${question.id}`} question={question} disabled={!!result} onSubmit={submit} />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {result?.correct && (
          <FeedbackPanel
            demo
            evaluation={result}
            xpEarned={0}
            usedHint={hint}
            streak={1}
            chapterCompleted={false}
            onContinue={() => (index < DEMO_IDS.length - 1 ? go(index + 1) : onExit())}
            continueLabel={index < DEMO_IDS.length - 1 ? `Next demo: ${DEMO_LABELS[index + 1]}` : 'Finish demo'}
          />
        )}
        {result && !result.correct && (
          <motion.div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#1a0808]/80 p-3 backdrop-blur-sm md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="dialog" aria-modal="true" aria-labelledby="demo-fail">
            <motion.div initial={{ y: 30 }} animate={{ y: 0 }} className="panel my-4 w-full max-w-2xl p-6" style={{ borderColor: 'rgba(198,79,79,.5)' }}>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#ff9d8f]">
                <AlertTriangle className="h-4 w-4" aria-hidden /> {result.headline}
              </p>
              <h2 id="demo-fail" className="font-display mt-1 text-2xl font-bold text-[#ffd9d0]">Your journey has been interrupted</h2>
              <p className="mt-3 text-sm text-parchment/70">
                You chose: <span className="font-semibold text-parchment">{result.selectedLabel}</span>
              </p>
              <p className="mt-2 leading-relaxed text-parchment/90">{result.reason}</p>
              <p className="mt-3 rounded-lg border-l-4 border-aegean-light bg-aegean/10 px-3 py-2 text-sm text-parchment/85">{result.principle}</p>
              <div className="mt-3">
                <BreakdownTable rows={result.breakdown} valueHeader={question.kind === 'graph' ? 'Total cost' : 'Objective'} />
              </div>
              <p className="mt-3 text-xs text-parchment/50">In the campaign, this mistake would reset the chapter streak to 0/3 and restart at question 1.</p>
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" className="btn btn-danger px-6 py-3 text-sm" onClick={() => go(index)} autoFocus>
                  <RotateCcw className="h-4 w-4" aria-hidden /> Try again
                </button>
                {index < DEMO_IDS.length - 1 && (
                  <button type="button" className="btn btn-ghost px-5 py-2.5 text-xs" onClick={() => go(index + 1)}>
                    <SkipForward className="h-4 w-4" aria-hidden /> Skip to next
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
