import { Loader2 } from 'lucide-react';
import { classNames } from '../../utils/helpers';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={classNames('h-5 w-5 animate-spin text-ink-400', className)} />;
}

export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-400">
      <Spinner className="h-8 w-8" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={classNames(
        'animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
