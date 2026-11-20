import { motion, useReducedMotion } from 'motion/react';
import { ChevronsRight, Sailboat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OPENING_NARRATION } from '../data/chapters';
import { TitleScene } from '../components/Scenes';

const EMPHASIS = new Set(['Not his sword.', 'Not his strength.', 'His wisdom.']);

export function IntroductionScreen({ onFinish }: { onFinish: () => void }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? OPENING_NARRATION.length : 1);
  const done = shown >= OPENING_NARRATION.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setShown((s) => s + 1), shown < 4 ? 1900 : 1300);
    return () => clearTimeout(t);
  }, [shown, done]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-48 pt-10">
      <TitleScene />
      <div className="absolute inset-0 bg-abyss/45" aria-hidden />
      <div className="relative z-10 max-w-2xl text-center" aria-live="polite">
        {OPENING_NARRATION.slice(0, shown).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1 }}
            className={
              EMPHASIS.has(line)
                ? `font-display my-1 text-2xl font-bold md:text-3xl ${line === 'His wisdom.' ? 'text-gold-gradient text-shadow-deep text-3xl md:text-5xl' : 'text-parchment/90'}`
                : 'font-serif my-2 text-xl leading-snug text-parchment md:text-2xl'
            }
          >
            {line}
          </motion.p>
        ))}
      </div>
      <div className="relative z-10 mt-10 flex flex-col items-center gap-3">
        {done ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="btn btn-gold px-10 py-4 text-sm md:text-base"
            onClick={onFinish}
            autoFocus
          >
            <Sailboat className="h-5 w-5" aria-hidden /> Begin the Odyssey
          </motion.button>
        ) : (
          <button type="button" className="btn btn-ghost px-5 py-2 text-xs" onClick={() => setShown(OPENING_NARRATION.length)}>
            <ChevronsRight className="h-4 w-4" aria-hidden /> Skip narration
          </button>
        )}
      </div>
    </main>
  );
}
