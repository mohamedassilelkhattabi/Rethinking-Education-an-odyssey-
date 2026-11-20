import { useEffect, useRef } from 'react';

/** Focus an element on mount for keyboard users without scrolling the page to it. */
export function useQuietFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}
