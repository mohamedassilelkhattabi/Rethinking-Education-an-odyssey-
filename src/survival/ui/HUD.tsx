import { Pause, RefreshCw, Sparkles, Users, Volume2, VolumeX } from 'lucide-react';
import { useMemo } from 'react';
import { getChapter } from '../../data/chapters';
import { heartIcon, hungerIcon, itemDataUrl } from '../art/world';
import { ITEMS } from '../items';
import type { GameStore } from '../store';
import type { SurvivalState } from '../types';

function healthColor(v: number) {
  return v > 50 ? '#4caf50' : v > 25 ? '#f0a030' : '#d8443a';
}
function hungerColor(v: number) {
  return v > 50 ? '#e0b354' : v > 20 ? '#f08a30' : '#d8443a';
}

function Bar({ icon, value, color, label, flash }: { icon: string; value: number; color: string; label: string; flash?: boolean }) {
  return (
    <div className="flex items-center gap-2" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <img src={icon} alt="" className={`pixelated h-5 w-5 shrink-0 ${flash ? 'blink' : ''}`} />
      <div className="px-bar w-28 md:w-36">
        <span style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="font-pixel w-[66px] text-[9px] tabular-nums text-[#f0e2bf]">{Math.round(value)}/100</span>
    </div>
  );
}

interface HUDProps {
  store: GameStore;
  state: SurvivalState;
  muted: boolean;
  onToggleMute: () => void;
  dueReviews: number;
  unreadSocial: number;
  onOpenPersonalize: (tab?: 'consent' | 'profile' | 'mastery') => void;
  onOpenSocial: () => void;
}

export function HUD({
  store,
  state,
  muted,
  onToggleMute,
  dueReviews,
  unreadSocial,
  onOpenPersonalize,
  onOpenSocial,
}: HUDProps) {
  const icons = useMemo(() => ({ heart: heartIcon(3), hunger: hungerIcon(3) }), []);
  const itemIcon = useMemo(() => itemDataUrl(state.selectedItem, 3), [state.selectedItem]);
  const chapter = getChapter(state.currentChapter);
  const lowHealth = state.health > 0 && state.health < 30;
  const starving = state.hunger <= 0;
  const qty = state.inventory[state.selectedItem];

  return (
    <>
      {(lowHealth || starving) && <div className="danger-vignette pointer-events-none absolute inset-0 z-10" aria-hidden />}

      {/* Top-left: survival */}
      <div className="px-panel absolute left-3 top-3 z-20 flex flex-col gap-1.5 px-3 py-2">
        <Bar icon={icons.heart} value={state.health} color={healthColor(state.health)} label="Health" flash={lowHealth} />
        <Bar icon={icons.hunger} value={state.hunger} color={hungerColor(state.hunger)} label="Hunger" flash={starving || state.hunger < 20} />
        {lowHealth && <p className="font-pixel blink text-[8px] text-[#ff8a7a]">LOW HEALTH — EAT AMBROSIA</p>}
        {starving && <p className="font-pixel blink text-[8px] text-[#ffb347]">YOU ARE STARVING!</p>}
      </div>

      {/* Top-centre: world-matched utility controls (AI Profile, Reviews, Community, Pause, Mute) */}
      <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1.5">
        <button
          type="button"
          className="px-btn px-btn-dark !px-2.5 !py-2 !text-[8px]"
          onClick={() => onOpenPersonalize('profile')}
          aria-label="Open AI Personalization and Retention"
          title="AI Personalization & Mastery"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#f1d49a]" />
          <span className="hidden lg:inline">AI Profile</span>
        </button>

        {dueReviews > 0 && (
          <button
            type="button"
            className="px-btn px-btn-teal !px-2.5 !py-2 !text-[8px]"
            onClick={() => onOpenPersonalize('mastery')}
            aria-label={`${dueReviews} spaced-repetition reviews due`}
            title="Scheduled Spaced-Repetition Reviews"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="tabular-nums">{dueReviews}</span>
          </button>
        )}

        <button
          type="button"
          className="px-btn px-btn-dark relative !px-2.5 !py-2 !text-[8px]"
          onClick={onOpenSocial}
          aria-label="Open Community Hub"
          title="Social Hub: Group Chats & DMs"
        >
          <Users className="h-3.5 w-3.5 text-[#5fb8c4]" />
          <span className="hidden lg:inline">Social</span>
          {unreadSocial > 0 && (
            <span className="ml-0.5 bg-[#d8af63] px-1 text-[8px] tabular-nums text-[#1a1208]">{unreadSocial}</span>
          )}
        </button>

        <button type="button" className="px-btn px-btn-dark !p-2" onClick={() => store.setUI({ overlay: 'pause' })} aria-label="Pause (Esc)">
          <Pause className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="px-btn px-btn-dark !p-2" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={!muted}>
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Top-right: Calculus I unit & streak */}
      <div className="px-panel absolute right-3 top-3 z-20 px-3 py-2 text-right">
        <p className="font-pixel text-[8px] text-[#5fb8c4]">{chapter.unitLabel.toUpperCase()}</p>
        <p className="font-term text-xl leading-5 text-[#f0e2bf]">{chapter.title}</p>
        <div className="mt-1 flex items-center justify-end gap-1.5" aria-label={`Streak ${state.currentStreak} of 3`}>
          <span className="font-pixel mr-1 text-[8px] text-[#c9b98a]">STREAK</span>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`font-pixel flex h-4 w-4 items-center justify-center border-2 border-[#1a1208] text-[8px] ${
                i < state.currentStreak ? 'bg-[#d8af63] text-[#1a1208]' : 'bg-[#2a1d14] text-[#6b5a48]'
              }`}
            >
              {i < state.currentStreak ? '✓' : i + 1}
            </span>
          ))}
          <span className="font-pixel ml-1 text-[9px] tabular-nums text-[#f0e2bf]">{state.currentStreak}/3</span>
        </div>
        <p className="font-pixel mt-1 text-[9px] tabular-nums text-[#f1d49a]">
          XP {state.xp}
          {state.temporaryXP > 0 && <span className="text-[#5fb8c4]"> +{state.temporaryXP}</span>}
        </p>
      </div>

      {/* Bottom-left: quick slot */}
      <button
        type="button"
        onClick={() => store.setUI({ overlay: 'inventory' })}
        className="px-panel absolute bottom-3 left-3 z-20 flex items-center gap-3 px-3 py-2 text-left"
        aria-label={`Selected item: ${ITEMS[state.selectedItem].name}, ${qty} left. Open inventory.`}
      >
        <span className="relative flex h-10 w-10 items-center justify-center border-2 border-[#d8af63] bg-[#2a1d14]">
          <img src={itemIcon} alt="" className={`pixelated h-7 w-7 ${qty === 0 ? 'opacity-30 grayscale' : ''}`} />
          <span className="font-pixel absolute -bottom-1 -right-1 bg-[#1a1208] px-1 text-[8px] tabular-nums text-[#f0e2bf]">{qty}</span>
        </span>
        <span>
          <span className="font-pixel block text-[9px] text-[#f0e2bf]">{ITEMS[state.selectedItem].name}</span>
          <span className="font-term block text-lg leading-5 text-[#c9b98a]">[F] eat · [Q] next · [I] bag</span>
        </span>
      </button>

      {/* Bottom-right: controls reminder */}
      <div className="font-term pointer-events-none absolute bottom-3 right-3 z-20 hidden text-right text-lg leading-5 text-[#f0e2bf]/85 drop-shadow-[2px_2px_0_#000] md:block">
        A/D move · SPACE jump · E talk · ESC pause
      </div>
    </>
  );
}
