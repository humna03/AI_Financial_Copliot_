import { Languages } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { setLanguage } from '../../store/slices/languageSlice';
import { useTranslation } from '../../hooks/useTranslation';
import { classNames } from '../../utils/helpers';

export function LanguageSwitcher() {
  const { lang } = useTranslation();
  const dispatch = useAppDispatch();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-1.5 py-1 dark:border-ink-700 dark:bg-ink-900">
      <Languages className="h-3.5 w-3.5 text-ink-400" />
      {(['en', 'ur'] as const).map((code) => (
        <button
          key={code}
          onClick={() => dispatch(setLanguage(code))}
          className={classNames(
            'rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
            lang === code
              ? 'bg-[var(--primary)] text-white dark:text-ink-950'
              : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-200'
          )}
        >
          {code === 'en' ? 'EN' : 'اردو'}
        </button>
      ))}
    </div>
  );
}
