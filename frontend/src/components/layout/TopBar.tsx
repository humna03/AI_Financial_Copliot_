import { Menu } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useTranslation } from '../../hooks/useTranslation';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export function TopBar() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  return (
    <header className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/80 px-4 py-3 backdrop-blur transition-colors duration-200 ease-premium dark:border-ink-800 dark:bg-ink-950/80 sm:px-8">
      <button
        onClick={() => dispatch(toggleSidebar())}
        aria-label={sidebarOpen ? t('sidebar_close_menu') : t('sidebar_open_menu')}
        aria-expanded={sidebarOpen}
        className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="ms-auto flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
