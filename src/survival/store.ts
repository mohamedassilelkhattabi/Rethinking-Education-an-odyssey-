import { createRun, survivalReducer } from './reducer';
import { loadRun, saveRun, type StorageLike } from './save';
import type { SurvivalAction, SurvivalState } from './types';

export type Screen = 'menu' | 'howto' | 'play' | 'gameover' | 'victory' | 'review';
export type Overlay =
  | 'none'
  | 'intro'
  | 'dialogue'
  | 'challenge'
  | 'result'
  | 'inventory'
  | 'pause'
  | 'chapterComplete'
  | 'social'
  | 'personalize'
  | 'reviewEncounter';

export interface UIState {
  screen: Screen;
  overlay: Overlay;
  /** Question id of the NPC currently being spoken to. */
  npc: number | null;
  muted: boolean;
  /** Bumped when the world should cut to a cinematic (e.g. dying). */
  cinematic: 'none' | 'dying' | 'departing';
}

export interface Snapshot {
  state: SurvivalState;
  ui: UIState;
}

interface StoreOptions {
  persist: boolean;
  demo: boolean;
  storage?: StorageLike | null;
  initial?: SurvivalState;
  muted?: boolean;
}

const DEMO_ACTIONS = new Set(['DEMO_JUMP_CHAPTER', 'DEMO_REFILL', 'DEMO_KILL', 'DEMO_WIN']);

/**
 * Single source of truth shared by Phaser scenes and React overlays.
 * Game rules live in the pure reducer; this class only adds persistence and change notification.
 */
export class GameStore {
  readonly demo: boolean;
  private readonly persist: boolean;
  private readonly storage: StorageLike | null | undefined;
  private snapshot: Snapshot;
  private listeners = new Set<() => void>();
  private lastTickSave = 0;

  constructor(opts: StoreOptions) {
    this.demo = opts.demo;
    this.persist = opts.persist;
    this.storage = opts.storage;
    this.snapshot = {
      state: opts.initial ?? createRun(),
      ui: { screen: 'menu', overlay: 'none', npc: null, muted: opts.muted ?? false, cinematic: 'none' },
    };
  }

  get state(): SurvivalState {
    return this.snapshot.state;
  }

  get ui(): UIState {
    return this.snapshot.ui;
  }

  getSnapshot = (): Snapshot => this.snapshot;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  /** True while the world must be frozen (menus, dialogue, puzzles, cinematics, death). */
  get worldPaused(): boolean {
    const { ui, state } = this.snapshot;
    return ui.screen !== 'play' || ui.overlay !== 'none' || ui.cinematic !== 'none' || state.status !== 'playing';
  }

  dispatch = (action: SurvivalAction): void => {
    if (DEMO_ACTIONS.has(action.type) && !this.demo) return;
    const prev = this.snapshot.state;
    const next = survivalReducer(prev, action);
    if (next === prev) return;
    this.snapshot = { ...this.snapshot, state: next };
    this.persistIfNeeded(prev, next, action);
    this.emit();
  };

  setUI = (patch: Partial<UIState>): void => {
    const ui = { ...this.snapshot.ui, ...patch };
    if ((Object.keys(patch) as (keyof UIState)[]).every((k) => this.snapshot.ui[k] === ui[k])) return;
    this.snapshot = { ...this.snapshot, ui };
    this.emit();
  };

  /** Start a brand-new run (new game, or restart after death). */
  newRun(): void {
    this.dispatch({ type: 'NEW_RUN' });
    this.setUI({ screen: 'play', overlay: 'intro', npc: null, cinematic: 'none' });
  }

  /** Resume a saved living run. Returns false if there is none. */
  continueRun(): boolean {
    const saved = this.persist ? loadRun(this.storage ?? undefined) : null;
    if (!saved) return false;
    this.snapshot = { ...this.snapshot, state: saved };
    this.emit();
    this.setUI({ screen: 'play', overlay: 'none', npc: null, cinematic: 'none' });
    return true;
  }

  hasLivingSave(): boolean {
    return this.persist && !!loadRun(this.storage ?? undefined);
  }

  private persistIfNeeded(prev: SurvivalState, next: SurvivalState, action: SurvivalAction) {
    if (!this.persist) return;
    const storage = this.storage === undefined ? undefined : this.storage;
    if (next.status !== 'playing') {
      // Transition out of a living run: wipe the save exactly once.
      if (prev.status === 'playing') saveRun(next, storage);
      return;
    }
    if (action.type === 'TICK') {
      // Throttle routine time saves, but never lose health changes (refresh must not undo damage).
      const now = Date.now();
      if (prev.health === next.health && prev.hunger === next.hunger && now - this.lastTickSave < 5_000) return;
      this.lastTickSave = now;
    }
    saveRun(next, storage);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }
}
