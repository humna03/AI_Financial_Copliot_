import { useEffect, useState } from 'react';

/** Tracks the user's `prefers-reduced-motion` OS setting so chart/JS-driven
 * animations (which CSS media queries alone can't reach, e.g. recharts'
 * animationDuration) can be disabled for users who asked for less motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
