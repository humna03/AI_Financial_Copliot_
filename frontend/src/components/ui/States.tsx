import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from '../../hooks/useTranslation';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Inbox, title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center dark:border-ink-700 dark:bg-ink-900/40">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-ink-400 dark:text-ink-500">{body}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-red-100 bg-red-50/60 px-6 py-10 text-center dark:border-red-900/40 dark:bg-red-950/20">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="max-w-sm text-sm text-red-700 dark:text-red-300">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {t('action_retry')}
        </Button>
      )}
    </div>
  );
}
