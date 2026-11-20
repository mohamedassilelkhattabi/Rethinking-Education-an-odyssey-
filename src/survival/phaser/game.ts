import Phaser from 'phaser';
import type { GameStore } from '../store';
import { ChapterScene } from './ChapterScene';
import { BootScene, EndScene, MenuScene } from './scenes';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/**
 * Owns the Phaser instance and keeps the running scene in sync with the store
 * (menu backdrop, the current chapter, or an ending), restarting when the run, chapter or store changes.
 */
export class GameHost {
  readonly game: Phaser.Game;
  private store: GameStore;
  private storeId = 0;
  private ready = false;
  private target = '';
  private unsub: () => void;

  constructor(parent: HTMLElement, store: GameStore) {
    this.store = store;
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: '#101b2d',
      pixelArt: false,
      antialias: true,
      roundPixels: false,
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 900 }, debug: false } },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      input: { keyboard: { capture: [] } },
      // Dev-only: `?loop=timeout` drives the loop from timers so automated tests run in a background tab.
      fps: { target: 60, forceSetTimeOut: import.meta.env.DEV && new URLSearchParams(location.search).get('loop') === 'timeout' },
      scene: [BootScene, MenuScene, ChapterScene, EndScene],
      banner: false,
    });
    this.game.registry.set('store', store);
    this.game.events.once('odyssey-ready', () => {
      this.ready = true;
      this.sync();
    });
    this.unsub = store.subscribe(() => this.sync());
  }

  setStore(store: GameStore) {
    if (store === this.store) return;
    this.unsub();
    this.store = store;
    this.storeId++;
    this.game.registry.set('store', store);
    this.unsub = store.subscribe(() => this.sync());
    this.sync();
  }

  private sync() {
    if (!this.ready) return;
    const { ui, state } = this.store;
    // Info screens keep whatever is running underneath (so a paused chapter is not rebuilt).
    if (ui.screen === 'howto' || ui.screen === 'review') return;
    let key: string;
    let data: object = {};
    if (ui.screen === 'play') {
      key = 'Chapter';
      data = { chapter: state.currentChapter };
    } else if (ui.screen === 'gameover') {
      key = 'End';
      data = { kind: 'death' };
    } else if (ui.screen === 'victory') {
      key = 'End';
      data = { kind: 'victory' };
    } else {
      key = 'Menu';
    }
    const target = key === 'Chapter' ? `Chapter:${this.storeId}:${state.runId}:${state.currentChapter}` : `${key}:${JSON.stringify(data)}`;
    if (target === this.target) return;
    this.target = target;
    const sm = this.game.scene;
    for (const k of ['Menu', 'Chapter', 'End']) if (sm.isActive(k) || sm.isPaused(k)) sm.stop(k);
    sm.start(key, data);
  }

  destroy() {
    this.unsub();
    this.game.destroy(true);
  }
}
