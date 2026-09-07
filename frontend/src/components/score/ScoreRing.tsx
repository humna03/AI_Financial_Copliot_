import { useEffect, useState } from 'react';
import { classNames } from '../../utils/helpers';
import { useTranslation } from '../../hooks/useTranslation';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--primary)';
  if (score >= 45) return 'var(--accent)';
  return 'var(--danger)';
}

export function ScoreRing({ score, size = 160, strokeWidth = 12, className }: ScoreRingProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(score);

  // Starts at 0 and animates up to the real value on mount (and whenever
  // the score itself changes), instead of snapping straight to the target.
  const [displayScore, setDisplayScore] = useState(reducedMotion ? clamped : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayScore(clamped);
      return;
    }
    // Defer to the next frame so the browser registers the 0-state first,
    // otherwise the transition has no starting point to animate from.
    const raf = requestAnimationFrame(() => setDisplayScore(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped, reducedMotion]);

  const offset = circumference * (1 - displayScore / 100);

  return (
    <div className={classNames('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-ink-100 dark:text-ink-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold font-sans text-ink-900 dark:text-ink-50">{score}</span>
        <span className="text-xs text-ink-400">{t('score_out_of')}</span>
      </div>
    </div>
  );
}
