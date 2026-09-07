import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { ToastContainer } from '../components/common/Toast';
import { PageTransition } from '../components/common/PageTransition';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50 transition-colors duration-200 ease-premium dark:bg-ink-950">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to={ROUTES.landing} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] font-sans text-sm font-bold text-white dark:text-ink-950">
            FC
          </div>
          <span className="font-sans text-sm font-semibold text-ink-900 dark:text-ink-50">
            AI Financial Copilot
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <PageTransition />
      </main>
      <ToastContainer />
    </div>
  );
}
