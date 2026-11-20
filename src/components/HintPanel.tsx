import { useEffect, useState } from 'react';
import { ChevronRight, Feather, Lightbulb } from 'lucide-react';
import { MathText } from './MathText';

interface HintPanelProps {
  hint: string;
  /** Optional progressive step-by-step hints (Step 1 -> Step 2 -> Step 3). */
  hints?: string[];
  used: boolean;
  disabled?: boolean;
  onUse: () => void;
  /** Demo mode has no XP stakes. */
  showCost?: boolean;
}

export function HintPanel({ hint, hints, used, disabled, onUse, showCost = true }: HintPanelProps) {
  const steps = hints && hints.length > 0 ? hints : [hint];
  const [revealedCount, setRevealedCount] = useState(used ? 1 : 0);

  useEffect(() => {
    if (used && revealedCount === 0) setRevealedCount(1);
    if (!used) setRevealedCount(0);
  }, [used, hint]);

  const revealNext = () => {
    if (!used) onUse();
    setRevealedCount((n) => Math.min(steps.length, Math.max(1, n + 1)));
  };

  return (
    <div className="w-full space-y-2.5">
      {revealedCount > 0 && (
        <div className="rounded-xl border border-aegean-light/40 bg-midnight/90 p-3.5 text-sm text-parchment" role="status">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-aegean-light">
              <Feather className="h-4 w-4 shrink-0" aria-hidden />
              Athena’s Step-by-Step Guide ({revealedCount}/{steps.length})
            </p>
            {showCost && <span className="text-xs text-parchment/55">Max XP 50</span>}
          </div>
          <ol className="mt-2.5 space-y-2">
            {steps.slice(0, revealedCount).map((step, idx) => (
              <li key={idx} className="rounded-lg bg-white/5 px-3 py-2 text-sm leading-relaxed text-parchment/95">
                <MathText text={step} />
              </li>
            ))}
          </ol>
          {revealedCount < steps.length && !disabled && (
            <button
              type="button"
              onClick={revealNext}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-aegean-light/45 bg-aegean/25 px-3 py-1.5 text-xs font-semibold text-parchment transition-colors hover:bg-aegean/40"
            >
              Reveal step {revealedCount + 1} of {steps.length} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}

      {revealedCount === 0 && (
        <button
          type="button"
          onClick={revealNext}
          disabled={disabled}
          className="btn btn-ghost w-full px-4 py-2.5 text-xs"
        >
          <Lightbulb className="h-4 w-4" aria-hidden />
          Interactive hints ({steps.length} steps)
          {showCost && <span className="font-sans text-[11px] font-medium normal-case tracking-normal text-parchment/60">(XP 100 → 50)</span>}
        </button>
      )}
    </div>
  );
}
