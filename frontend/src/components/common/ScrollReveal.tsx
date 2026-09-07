import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { classNames } from '../../utils/helpers';

interface ScrollRevealProps {
  children: ReactNode;
  /** Stagger delay in ms, applied via transition-delay. Keep short (0-240ms). */
  delay?: number;
  className?: string;
}

/**
 * Fades + slides an element in once it enters the viewport, using a single
 * IntersectionObserver per instance that disconnects itself after the first
 * reveal (no repeated layout work, no leaked observers). Falls back to an
 * already-visible state when the user prefers reduced motion.
 */
export function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={classNames(
        'transition-[opacity,transform] duration-500 ease-premium',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
