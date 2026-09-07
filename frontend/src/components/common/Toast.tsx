import { useEffect } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { dismissToast } from '../../store/slices/uiSlice';
import { classNames } from '../../utils/helpers';
import { useTranslation } from '../../hooks/useTranslation';

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const tones = {
  success: 'border-ink-200 text-ink-700 dark:border-ink-700 dark:text-ink-100',
  error: 'border-red-200 text-red-700 dark:border-red-900/50 dark:text-red-300',
  info: 'border-gold-200 text-gold-700 dark:border-gold-700/40 dark:text-gold-300',
};

function ToastItem({ id, type, message }: { id: string; type: 'success' | 'error' | 'info'; message: string }) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(id)), 5000);
    return () => clearTimeout(timer);
  }, [id, dispatch]);

  return (
    <div
      className={classNames(
        'flex items-start gap-2.5 rounded-xl border bg-white px-4 py-3 text-sm shadow-soft dark:bg-ink-900',
        tones[type]
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{message}</p>
      <button onClick={() => dispatch(dismissToast(id))} aria-label={t('dismiss')}>
        <X className="h-4 w-4 text-ink-300" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-4 rtl:sm:right-auto rtl:sm:left-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}
