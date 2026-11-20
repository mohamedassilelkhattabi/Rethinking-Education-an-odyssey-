import { Heart, Home, Play, Presentation, Skull, Trophy, Utensils, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { itemDataUrl } from '../art/world';
import { ITEM_ORDER, ITEMS } from '../items';
import type { GameStore } from '../store';
import type { SurvivalState } from '../types';
import { useKeys } from './hooks';

export function InventoryPanel({ store, state }: { store: GameStore; state: SurvivalState }) {
  const icons = useMemo(() => Object.fromEntries(ITEM_ORDER.map((id) => [id, itemDataUrl(id, 4)])), []);
  const close = () => store.setUI({ overlay: 'none' });
  useKeys({ i: close, escape: close, f: () => store.dispatch({ type: 'CONSUME' }) });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0a0705]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="inv-title">
      <div className="px-panel w-full max-w-lg p-5">
        <div className="flex items-center justify-between">
          <h2 id="inv-title" className="font-pixel text-sm text-[#f1d49a]">
            PROVISIONS
          </h2>
          <button type="button" className="px-btn px-btn-dark !p-2" onClick={close} aria-label="Close inventory">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="font-term mt-1 text-xl text-[#c9b98a]">
          Health {state.health}/100 · Hunger {state.hunger}/100
        </p>
        <ul className="mt-3 space-y-2">
          {ITEM_ORDER.map((id) => {
            const def = ITEMS[id];
            const qty = state.inventory[id];
            const selected = state.selectedItem === id;
            return (
              <li key={id}>
                <div
                  className={`flex items-center gap-3 border-2 p-2 ${selected ? 'border-[#d8af63] bg-[#3a2a14]' : 'border-[#1a1208] bg-[#2a1d14]'}`}
                >
                  <button type="button" onClick={() => store.dispatch({ type: 'SELECT_ITEM', item: id })} className="flex flex-1 items-center gap-3 text-left" aria-pressed={selected}>
                    <img src={icons[id]} alt="" className={`pixelated h-12 w-12 ${qty === 0 ? 'opacity-30 grayscale' : ''}`} />
                    <span>
                      <span className="font-pixel block text-[11px] text-[#f0e2bf]">
                        {def.name} <span className="text-[#c9b98a]">×{qty}</span>
                      </span>
                      <span className="font-term block text-xl leading-5 text-[#c9b98a]">{def.description}</span>
                    </span>
                  </button>
                  <button type="button" className="px-btn !px-3 !text-[9px]" disabled={qty === 0} onClick={() => store.dispatch({ type: 'CONSUME', item: id })}>
                    {def.health ? <Heart className="h-3.5 w-3.5" /> : <Utensils className="h-3.5 w-3.5" />} {def.health ? 'Drink' : 'Eat'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="font-term mt-3 text-lg leading-5 text-[#c9b98a]">Click an item to select it for the quick slot ([F] eats it). Food restores hunger; only ambrosia restores health.</p>
      </div>
    </div>
  );
}

export function PauseMenu({ store, muted, onToggleMute, onQuit }: { store: GameStore; muted: boolean; onToggleMute: () => void; onQuit: () => void }) {
  const resume = () => store.setUI({ overlay: 'none' });
  useKeys({ escape: resume });
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0a0705]/75 p-4" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className="px-panel flex w-full max-w-sm flex-col gap-3 p-6 text-center">
        <h2 id="pause-title" className="font-pixel text-lg text-[#f1d49a]">
          PAUSED
        </h2>
        <p className="font-term text-xl text-[#c9b98a]">Hunger does not drain while paused.</p>
        <button type="button" className="px-btn" onClick={resume} autoFocus>
          <Play className="h-4 w-4" /> Resume
        </button>
        <button type="button" className="px-btn px-btn-dark" onClick={onToggleMute}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} Sound: {muted ? 'off' : 'on'}
        </button>
        <button type="button" className="px-btn px-btn-dark" onClick={() => store.setUI({ screen: 'howto', overlay: 'none' })}>
          How to play
        </button>
        <button type="button" className="px-btn px-btn-dark" onClick={onQuit}>
          <Home className="h-4 w-4" /> {store.demo ? 'Quit demo run' : 'Save & quit to menu'}
        </button>
      </div>
    </div>
  );
}

/** Short-lived message for state.notice (pickups, eating, sealed exits). */
export function Toast({ state }: { state: SurvivalState }) {
  const [visible, setVisible] = useState<SurvivalState['notice']>(null);
  useEffect(() => {
    if (!state.notice) return;
    setVisible(state.notice);
    const t = window.setTimeout(() => setVisible(null), 2200);
    return () => window.clearTimeout(t);
  }, [state.notice]);
  if (!visible) return null;
  const color = visible.tone === 'bad' ? '#ff9d8f' : visible.tone === 'good' ? '#a6f0b0' : '#f0e2bf';
  return (
    <div key={visible.id} className="toast-in px-panel font-pixel absolute left-1/2 top-[24%] z-30 max-w-[80%] px-4 py-2 text-center text-[10px] leading-5" style={{ color }} role="status">
      {visible.text}
    </div>
  );
}

export function DemoBar({ store, onExit }: { store: GameStore; onExit: () => void }) {
  const jump = (id: number) => {
    store.dispatch({ type: 'DEMO_JUMP_CHAPTER', chapterId: id });
    store.dispatch({ type: 'DEMO_REFILL' });
    store.setUI({ screen: 'play', overlay: 'none', npc: null, cinematic: 'none' });
  };
  return (
    <div className="fixed bottom-0 left-1/2 z-50 flex max-w-[calc(100vw-8px)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 border-x-[3px] border-t-[3px] border-[#1a1208] bg-[#2f8190] px-2 py-1 shadow-lg">
      <span className="font-pixel flex items-center gap-1 bg-[#1a1208] px-2 py-1 text-[8px] text-[#5fb8c4]" title="Demo mode: nothing here is saved or affects your campaign">
        <Presentation className="h-3 w-3" /> DEMO · NOT SAVED
      </span>
      <span className="font-pixel px-1 text-[8px] text-[#eafcff]">Unit:</span>
      {[1, 2, 3, 4, 5, 6].map((id) => (
        <button key={id} type="button" className="px-btn px-btn-dark !px-1.5 !py-1 !text-[8px]" onClick={() => jump(id)} aria-label={`Jump to chapter ${id}`}>
          {['I', 'II', 'III', 'IV', 'V', 'VI'][id - 1]}
        </button>
      ))}
      <button type="button" className="px-btn px-btn-dark !px-2 !py-1 !text-[8px]" onClick={() => store.dispatch({ type: 'DEMO_REFILL' })}>
        Refill
      </button>
      <button type="button" className="px-btn px-btn-red !px-2 !py-1 !text-[8px]" onClick={() => store.dispatch({ type: 'DEMO_KILL' })} disabled={store.ui.screen !== 'play'}>
        <Skull className="h-3 w-3" /> Show death
      </button>
      <button
        type="button"
        className="px-btn !px-2 !py-1 !text-[8px]"
        onClick={() => {
          store.dispatch({ type: 'DEMO_WIN' });
          store.setUI({ screen: 'victory', overlay: 'none', npc: null });
        }}
      >
        <Trophy className="h-3 w-3" /> Show victory
      </button>
      <button type="button" className="px-btn px-btn-dark !px-2 !py-1 !text-[8px]" onClick={onExit}>
        <X className="h-3 w-3" /> Exit demo
      </button>
    </div>
  );
}
