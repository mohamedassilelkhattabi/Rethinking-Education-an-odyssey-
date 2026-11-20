import { AnimatePresence, motion } from 'motion/react';
import { Anchor, Clock, Package, Star, Users, Volume2, VolumeX } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GameState } from '../game/types';
import { MAX_XP } from '../game/scoring';

function Stat({ icon, label, value, accent, hint }: { icon: ReactNode; label: string; value: ReactNode; accent?: string; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-gold/25 bg-midnight/70 px-2 py-1 md:gap-2 md:px-3 md:py-1.5" title={hint ?? label}>
      <span className={accent ?? 'text-gold'}>{icon}</span>
      <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-parchment/55 lg:inline">{label}</span>
      <span className="sr-only lg:hidden">{label}</span>
      <span className="font-sans text-xs font-bold tabular-nums text-parchment md:text-sm">{value}</span>
    </div>
  );
}

interface HUDProps {
  state: GameState;
  muted: boolean;
  onToggleSound: () => void;
  actions?: ReactNode;
}

export function GameHUD({ state, muted, onToggleSound, actions }: HUDProps) {
  const inAttempt = ['challenge', 'correct', 'failure'].includes(state.screen);
  return (
    <header className="relative z-30 border-b border-gold/20 bg-gradient-to-b from-abyss/95 to-midnight/80 backdrop-blur-md md:sticky md:top-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-1.5 md:px-6 md:py-2">
        <div className="mr-auto flex items-center gap-2">
          <Anchor className="h-5 w-5 text-gold" aria-hidden />
          <span className="font-display text-sm font-bold text-gold-gradient md:text-base">ODYSSEY</span>
        </div>
        <div className="order-last flex w-full flex-wrap items-center justify-center gap-1 md:order-none md:w-auto md:gap-2" aria-label="Voyage status">
          <Stat icon={<Users className="h-4 w-4" />} label="Crew" value={state.crew} />
          <Stat icon={<Package className="h-4 w-4" />} label="Supplies" value={state.supplies} />
          <Stat icon={<Clock className="h-4 w-4" />} label="Time" value={`${state.elapsedTime}h`} hint="Elapsed voyage time" />
          <Stat
            icon={<Star className="h-4 w-4" />}
            label="XP"
            hint="Permanent XP (+ temporary chapter XP at risk)"
            value={
              <span className="flex items-center gap-1">
                {state.permanentXP}
                <span className="text-xs font-medium text-parchment/40">/{MAX_XP}</span>
                <AnimatePresence>
                  {inAttempt && state.temporaryXP > 0 && (
                    <motion.span
                      key={state.temporaryXP}
                      initial={{ opacity: 0, y: -6, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-1 rounded-full bg-aegean/40 px-1.5 text-xs text-aegean-light"
                    >
                      +{state.temporaryXP} at risk
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            }
          />
          <Stat icon={<span className="font-display text-xs">IV</span>} label="Chapters" value={`${state.completedChapters.length}/4`} hint="Completed chapters" />
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={onToggleSound}
            className="rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-pressed={!muted}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
