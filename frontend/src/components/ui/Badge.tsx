import type { HTMLAttributes } from 'react';
import { classNames } from '../../utils/helpers';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'positive' | 'negative' | 'neutral';
}

const tones = {
  positive: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  negative: 'bg-gold-50 text-gold-700 dark:bg-gold-700/20 dark:text-gold-300',
  neutral: 'bg-ink-50 text-ink-500 dark:bg-ink-800 dark:text-ink-400',
};

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex max-w-full items-center gap-1 whitespace-normal break-words rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
