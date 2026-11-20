import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import type { Chapter } from '../game/types';

interface ProgressTrackerProps {
  chapter: Chapter;
  currentQuestion: number;
  streak: number;
  attempt: number;
  failedIndex?: number | null;
  replay?: boolean;
  compact?: boolean;
}

export function ProgressTracker({ chapter, currentQuestion, streak, attempt, failedIndex = null, replay, compact }: ProgressTrackerProps) {
  return (
    <div className={`panel flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 ${compact ? '' : 'md:py-4'}`}>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-aegean-light">
          Chapter {chapter.numeral} · {chapter.difficulty}
          {replay && <span className="ml-2 rounded bg-bronze/40 px-1.5 py-0.5 text-gold-light">Practice voyage</span>}
        </p>
        <h2 className="font-display truncate text-base font-bold text-parchment md:text-lg">{chapter.title}</h2>
      </div>

      <ol className="flex items-center gap-1.5 md:gap-2" aria-label="Chapter progress">
        {[0, 1, 2].map((i) => {
          const failed = failedIndex === i;
          const done = !failed && i < streak;
          const current = !failed && !done && i === currentQuestion && failedIndex === null;
          return (
            <li key={i} className="flex items-center gap-1.5 md:gap-2">
              <motion.div
                layout
                className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider md:px-3 ${
                  failed
                    ? 'border-danger bg-danger/20 text-[#ffb4a8]'
                    : done
                      ? 'border-gold bg-gold/15 text-gold-light'
                      : current
                        ? 'border-aegean-light bg-aegean/25 text-white shadow-[0_0_18px_rgba(95,184,196,.45)]'
                        : 'border-white/15 bg-white/5 text-white/40'
                }`}
                aria-current={current ? 'step' : undefined}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/25">
                  {failed ? <X className="h-3.5 w-3.5" /> : done ? <Check className="h-3.5 w-3.5" /> : current ? <span className="anim-glow h-2 w-2 rounded-full bg-aegean-light" /> : <span className="h-1.5 w-1.5 rounded-full bg-white/30" />}
                </span>
                <span>Q{i + 1}</span>
                <span className="sr-only">{failed ? 'failed' : done ? 'complete' : current ? 'current' : 'upcoming'}</span>
              </motion.div>
              {i < 2 && <span className={`h-px w-3 md:w-6 ${i < streak ? 'bg-gold' : 'bg-white/20'}`} aria-hidden />}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-parchment/50">Streak</p>
          <motion.p key={streak} initial={{ scale: 1.5, color: '#f1d49a' }} animate={{ scale: 1, color: '#f0e2bf' }} className="font-display text-lg font-bold tabular-nums">
            {streak}/3
          </motion.p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-parchment/50">Attempt</p>
          <p className="font-display text-lg font-bold tabular-nums text-parchment">{attempt}</p>
        </div>
      </div>
    </div>
  );
}
