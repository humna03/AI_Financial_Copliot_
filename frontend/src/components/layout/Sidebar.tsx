import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Target,
  Gauge,
  FlaskConical,
  MessageCircle,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { setSidebarOpen } from '../../store/slices/uiSlice';
import { classNames } from '../../utils/helpers';

const navItems = [
  { to: ROUTES.dashboard, icon: LayoutDashboard, key: 'sidebar_dashboard' as const },
  { to: ROUTES.financial, icon: Wallet, key: 'sidebar_financial' as const },
  { to: ROUTES.goals, icon: Target, key: 'sidebar_goals' as const },
  { to: ROUTES.score, icon: Gauge, key: 'sidebar_score' as const },
  { to: ROUTES.simulator, icon: FlaskConical, key: 'sidebar_simulator' as const },
  { to: ROUTES.copilot, icon: MessageCircle, key: 'sidebar_copilot' as const },
  { to: ROUTES.settings, icon: Settings, key: 'sidebar_settings' as const },
];

export function Sidebar() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const authUser = useAppSelector((s) => s.auth.authUser);

  const close = () => dispatch(setSidebarOpen(false));

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen]);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 animate-fade-in bg-ink-950/40 lg:hidden" onClick={close} />
      )}
      <aside
        className={classNames(
          'fixed inset-y-0 start-0 z-40 flex w-64 flex-col border-e border-ink-100 bg-[var(--sidebar)] p-4 transition-[transform,background-color,border-color] duration-200 ease-premium dark:border-ink-800 lg:static',
          sidebarOpen
            ? 'max-lg:translate-x-0'
            : 'max-lg:-translate-x-full max-lg:rtl:translate-x-full'
        )}
      >
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] font-sans text-sm font-bold text-white dark:text-ink-950">
              FC
            </div>
            <span className="font-sans text-sm font-semibold text-ink-900 dark:text-ink-50">
              AI Financial Copilot
            </span>
          </div>
          <button onClick={close} className="text-ink-400 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              className={({ isActive }) =>
                classNames(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-200 ease-premium',
                  isActive
                    ? 'bg-[var(--primary)] text-white dark:text-ink-950'
                    : 'text-ink-500 hover:translate-x-0.5 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800'
                )
              }
            >
              <Icon className="h-[18px] w-[18px] transition-transform duration-200 ease-premium group-hover:scale-110" />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-ink-100 pt-4 dark:border-ink-800">
          {authUser && (
            <p className="mb-2 truncate px-1 text-xs text-ink-400">{authUser.email}</p>
          )}
          <button
            onClick={() => dispatch(logout())}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {t('sidebar_logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
