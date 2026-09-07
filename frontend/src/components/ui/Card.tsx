import type { HTMLAttributes } from 'react';
import { classNames } from '../../utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Only set this on cards that are genuinely interactive (clickable,
   * navigable). Static informational cards should stay still. */
  interactive?: boolean;
}

export function Card({ className, children, interactive, ...rest }: CardProps) {
  return (
    <div
      className={classNames(
        'rounded-xl2 border border-ink-100 bg-[var(--surface)] p-5 shadow-soft transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-premium dark:border-ink-800',
        interactive &&
          'hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-hover dark:hover:border-ink-700',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
