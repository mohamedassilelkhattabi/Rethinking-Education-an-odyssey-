import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { GameStore, Snapshot } from '../store';

export function useGame(store: GameStore): Snapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** Window-level key handler while `enabled`. Keys are matched on `event.key` (case-insensitive) or `event.code`. */
export function useKeys(handlers: Record<string, (e: KeyboardEvent) => void>, enabled = true) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }
      const h = ref.current[e.key.toLowerCase()] ?? ref.current[e.code];
      if (h) {
        e.preventDefault();
        h(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

/** Typewriter reveal; returns [visible text, done, skip]. */
export function useTypewriter(text: string, cps = 45): [string, boolean, () => void] {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
  }, [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = window.setTimeout(() => setN((v) => Math.min(text.length, v + 2)), (1000 / cps) * 2);
    return () => window.clearTimeout(t);
  }, [n, text, cps]);
  return [text.slice(0, n), n >= text.length, () => setN(text.length)];
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
}
