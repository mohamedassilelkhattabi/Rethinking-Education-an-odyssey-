import { AnimatePresence, motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { ChallengeRenderer } from '../challenges/ChallengeRenderer';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { HintPanel } from '../components/HintPanel';
import { ProgressTracker } from '../components/ProgressTracker';
import { ChapterBackdrop } from '../components/Scenes';
import { StoryPanel } from '../components/StoryPanel';
import { getChapter } from '../data/chapters';
import { QUESTIONS } from '../data/questions';
import { currentQuestionOf } from '../game/reducer';
import type { Answer, GameState } from '../game/types';

interface Props {
  state: GameState;
  onSubmit: (questionId: number, answer: Answer) => void;
  onHint: (questionId: number) => void;
  onContinue: () => void;
  onAbandon: () => void;
}

export function ChallengeScreen({ state, onSubmit, onHint, onContinue, onAbandon }: Props) {
  const chapter = getChapter(state.currentChapter);
  const question = currentQuestionOf(state);
  const attempt = state.chapterAttempts[chapter.id] ?? 1;
  const showFeedback = state.screen === 'correct' && state.lastOutcome?.correct;
  const [confirmLeave, setConfirmLeave] = useState(false);
  const usedHint = !!state.hintsUsed[question.id];

  return (
    <main className="relative min-h-[calc(100vh-56px)] px-3 py-4 md:px-6 md:py-6">
      <ChapterBackdrop theme={chapter.theme} dim={0.55} />
      <div className="mx-auto max-w-7xl">
        <ProgressTracker chapter={chapter} currentQuestion={state.currentQuestion} streak={state.currentStreak} attempt={attempt} replay={state.isReplay} />

        <motion.div key={`${attempt}-${question.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`mt-4 grid gap-4 lg:gap-6 ${question.kind === 'graph' ? 'lg:grid-cols-[minmax(270px,320px)_1fr]' : 'lg:grid-cols-[minmax(300px,380px)_1fr]'}`}>
          <div className="flex flex-col gap-3">
            <StoryPanel question={question} indexLabel={`Challenge ${state.currentQuestion + 1} of 3 · Problem ${question.id} of ${QUESTIONS.length}`} />
            <HintPanel hint={question.lesson.hint} hints={question.lesson.hints} used={usedHint} disabled={state.screen !== 'challenge'} onUse={() => onHint(question.id)} showCost={!state.isReplay} />
            <button type="button" className="self-start text-xs text-parchment/45 underline-offset-4 hover:text-parchment/80 hover:underline" onClick={() => setConfirmLeave(true)} disabled={state.screen !== 'challenge'}>
              <LogOut className="mr-1 inline h-3.5 w-3.5" aria-hidden /> Abandon chapter and return to the map
            </button>
          </div>
          <div>
            <ChallengeRenderer key={`${attempt}-${question.id}`} question={question} disabled={state.screen !== 'challenge'} onSubmit={(a) => onSubmit(question.id, a)} />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showFeedback && state.lastOutcome && (
          <FeedbackPanel
            key={`fb-${state.lastOutcome.questionId}-${attempt}`}
            evaluation={state.lastOutcome.evaluation}
            xpEarned={state.lastOutcome.xpEarned}
            usedHint={state.lastOutcome.usedHint}
            streak={state.currentStreak}
            chapterCompleted={state.lastOutcome.chapterCompleted}
            replay={state.lastOutcome.replay}
            timeAdded={state.lastOutcome.resourceDelta.elapsedTime}
            onContinue={onContinue}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmLeave && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/80 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="leave-title">
            <div className="panel max-w-md p-6 text-center">
              <h2 id="leave-title" className="font-display text-xl font-bold text-gold">Abandon this chapter?</h2>
              <p className="mt-3 text-sm text-parchment/80">
                Your current streak ({state.currentStreak}/3) and {state.temporaryXP} temporary XP will be lost. Completed chapters are safe.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" className="btn btn-ghost px-5 py-2 text-xs" onClick={() => setConfirmLeave(false)} autoFocus>
                  Stay and fight
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-5 py-2 text-xs"
                  onClick={() => {
                    setConfirmLeave(false);
                    onAbandon();
                  }}
                >
                  Abandon
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
