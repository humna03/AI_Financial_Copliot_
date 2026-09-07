import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md animate-fade-in-up rounded-xl2 border border-ink-100 bg-white p-6 shadow-soft dark:border-ink-800 dark:bg-ink-900">
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h3>}
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="ms-auto rounded-lg p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
