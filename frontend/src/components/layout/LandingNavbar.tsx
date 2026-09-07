import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useTranslation } from '../../hooks/useTranslation';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Button } from '../ui/Button';
import { classNames } from '../../utils/helpers';

const links = [
  { id: 'features', key: 'nav_features' as const },
  { id: 'how-it-works', key: 'nav_how' as const },
  { id: 'score', key: 'nav_score' as const },
  { id: 'copilot', key: 'nav_copilot' as const },
  { id: 'simulator', key: 'nav_simulator' as const },
];

export function LandingNavbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(links[0].id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Scroll-spy: highlight whichever section is currently most visible,
  // using a single shared IntersectionObserver instead of a scroll listener.
  useEffect(() => {
    const sections = links
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/70 bg-ink-50/80 backdrop-blur dark:border-ink-800/70 dark:bg-ink-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <Link to={ROUTES.landing} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] font-sans text-sm font-bold text-white dark:text-ink-950">
            FC
          </div>
          <span className="font-sans text-sm font-semibold text-ink-900 dark:text-ink-50">
            AI Financial Copilot
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={classNames(
                'relative py-1 text-sm transition-colors',
                activeId === l.id
                  ? 'text-ink-900 dark:text-ink-50'
                  : 'text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-ink-50'
              )}
            >
              {t(l.key)}
              <span
                className={classNames(
                  'absolute -bottom-0.5 left-0 h-0.5 w-full rounded-full bg-[var(--primary)] transition-transform duration-300 ease-premium',
                  activeId === l.id ? 'scale-x-100' : 'scale-x-0'
                )}
              />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link to={ROUTES.login} className="text-sm font-medium text-ink-600 dark:text-ink-300">
            {t('nav_login')}
          </Link>
          <Link to={ROUTES.register}>
            <Button size="sm">{t('nav_get_started')}</Button>
          </Link>
        </div>

        <button
          className="text-ink-500 transition-transform duration-200 ease-premium active:scale-90 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t('sidebar_close_menu') : t('sidebar_open_menu')}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className={classNames('mobile-nav-panel md:hidden', open && 'is-open')}>
        <div className="border-t border-ink-100 bg-ink-50 px-4 py-4 dark:border-ink-800 dark:bg-ink-950">
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className={classNames(
                  'text-sm transition-colors',
                  activeId === l.id ? 'font-medium text-ink-900 dark:text-ink-50' : 'text-ink-500 dark:text-ink-300'
                )}
              >
                {t(l.key)}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link to={ROUTES.login} onClick={() => setOpen(false)} className="text-sm font-medium text-ink-600 dark:text-ink-300">
              {t('nav_login')}
            </Link>
            <Link to={ROUTES.register} onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full">
                {t('nav_get_started')}
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
