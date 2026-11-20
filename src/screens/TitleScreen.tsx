import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, HelpCircle, Play, Presentation, Sailboat } from 'lucide-react';
import { useState } from 'react';
import { Divider } from '../components/Ornaments';
import { TitleScene } from '../components/Scenes';

interface Props {
  hasSave: boolean;
  progressLabel: string;
  onNewGame: () => void;
  onContinue: () => void;
  onHowToPlay: () => void;
  onDemo: () => void;
  onReview: () => void;
  onSwitchEdition?: () => void;
}

export function TitleScreen({ hasSave, progressLabel, onNewGame, onContinue, onHowToPlay, onDemo, onReview, onSwitchEdition }: Props) {
  const [confirming, setConfirming] = useState(false);
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-40 pt-10 text-center">
      <TitleScene />
      <motion.div className="relative z-10 flex max-w-3xl flex-col items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.5em] text-aegean-light md:text-xs">A Computer & Python Learning Adventure</p>
        <h1 className="font-display mt-3 text-6xl font-black leading-none text-gold-gradient text-shadow-deep sm:text-7xl md:text-8xl lg:text-9xl">ODYSSEY</h1>
        <p className="font-display mt-2 text-lg font-bold tracking-[0.35em] text-parchment md:text-2xl">THE PATH TO ITHACA</p>
        <Divider className="my-5 w-72" />
        <p className="font-serif text-xl italic text-parchment/85 md:text-2xl">Every choice shapes your journey home.</p>

        <div className="mt-8 flex flex-col items-center gap-3">
          {hasSave ? (
            <>
              <button type="button" className="btn btn-gold px-10 py-4 text-sm md:text-base" onClick={onContinue} autoFocus>
                <Sailboat className="h-5 w-5" aria-hidden /> Continue the voyage
              </button>
              <p className="text-xs text-parchment/60">{progressLabel}</p>
              <button type="button" className="btn btn-ghost px-6 py-2 text-xs" onClick={() => setConfirming(true)}>
                <Play className="h-4 w-4" aria-hidden /> New voyage
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-gold px-10 py-4 text-sm md:text-base" onClick={onNewGame} autoFocus>
              <Sailboat className="h-5 w-5" aria-hidden /> Set sail
            </button>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-ghost px-5 py-2 text-xs" onClick={onHowToPlay}>
              <HelpCircle className="h-4 w-4" aria-hidden /> How to play
            </button>
            <button type="button" className="btn btn-teal px-5 py-2 text-xs" onClick={onDemo}>
              <Presentation className="h-4 w-4" aria-hidden /> Demo mode
            </button>
            <button type="button" className="btn btn-ghost px-5 py-2 text-xs" onClick={onReview}>
              <BookOpen className="h-4 w-4" aria-hidden /> Concepts
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {confirming && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/80 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <motion.div className="panel max-w-md p-6 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <h2 id="confirm-title" className="font-display text-xl font-bold text-gold">Begin a new voyage?</h2>
              <p className="mt-3 text-sm text-parchment/80">Your current progress — completed chapters, XP and statistics — will be erased. This cannot be undone.</p>
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" className="btn btn-ghost px-5 py-2 text-xs" onClick={() => setConfirming(false)} autoFocus>
                  Keep my voyage
                </button>
                <button type="button" className="btn btn-danger px-5 py-2 text-xs" onClick={onNewGame}>
                  Start over
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="absolute bottom-3 z-10 text-[10px] uppercase tracking-[0.3em] text-parchment/40">
        Progress saves automatically
        {onSwitchEdition && (
          <>
            {' · '}
            <button type="button" onClick={onSwitchEdition} className="uppercase tracking-[0.3em] text-gold/80 underline-offset-4 hover:text-gold hover:underline">
              Play the survival edition
            </button>
          </>
        )}
      </p>
    </main>
  );
}
