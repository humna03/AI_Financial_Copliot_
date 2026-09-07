interface ProgressBarProps {
  /** 0–100. Values outside that range are clamped for the bar's width. */
  percent: number;
  color?: string;
  trackClassName?: string;
  animate?: boolean;
}

export function ProgressBar({
  percent,
  color = 'var(--primary)',
  trackClassName,
  animate = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  return (
    <div
      className={
        trackClassName ?? 'h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800'
      }
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={animate ? 'h-full rounded-full transition-[width] duration-700 ease-premium' : 'h-full rounded-full'}
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
