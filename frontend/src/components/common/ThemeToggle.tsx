import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { classNames } from '../../utils/helpers';
import type { ThemeMode } from '../../store/slices/themeSlice';

const options: { mode: ThemeMode; icon: typeof Sun; label: 'theme_light' | 'theme_dark' | 'theme_system' }[] = [
  { mode: 'light', icon: Sun, label: 'theme_light' },
  { mode: 'dark', icon: Moon, label: 'theme_dark' },
  { mode: 'system', icon: Laptop, label: 'theme_system' },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center rounded-full border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-900">
      {options.map(({ mode: m, icon: Icon, label }) => (
        <button
          key={m}
          aria-label={t(label)}
          onClick={() => setMode(m)}
          className={classNames(
            'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
            mode === m
              ? 'bg-[var(--primary)] text-white dark:text-ink-950'
              : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-200'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
