import { PiggyBank } from 'lucide-react';
import type { DashboardGoal } from '../../types/dashboard.types';
import { useTranslation } from '../../hooks/useTranslation';
import { ProgressBar } from '../ui/ProgressBar';
import { formatCurrency, formatPercent } from '../../utils/currency';

interface Props {
  monthlyIncome: number;
  totalExpenses: number;
  savingsRate: number | null;
  goal: DashboardGoal;
  hasExpenses: boolean;
  animate: boolean;
}

export function SavingsGoalPanel({
  monthlyIncome,
  totalExpenses,
  savingsRate,
  goal,
  hasExpenses,
  animate,
}: Props) {
  const { t } = useTranslation();
  const remaining = monthlyIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-ink-500 dark:text-ink-300">{t('savings_rate')}</span>
          <span className="font-medium text-ink-900 dark:text-ink-50">
            {formatPercent(savingsRate)}
          </span>
        </div>
        <ProgressBar
          percent={savingsRate ?? 0}
          color="var(--primary)"
          animate={animate}
        />
        <p className="mt-1.5 text-xs text-ink-400">{t('savings_rate_hint')}</p>
      </div>

      {hasExpenses && (
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-hover)] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
            <PiggyBank className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-400">{t('remaining_after_expenses')}</p>
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-ink-500 dark:text-ink-300">{t('sidebar_goals')}</span>
          <span className="font-medium text-ink-900 dark:text-ink-50">
            {goal.progress_percent !== null ? formatPercent(goal.progress_percent) : t('no_goal_short')}
          </span>
        </div>
        {goal.progress_percent !== null ? (
          <>
            <ProgressBar percent={goal.progress_percent} color="var(--gold)" animate={animate} />
            <p className="mt-1.5 truncate text-xs text-ink-400">
              {goal.description ?? t('goal')} — {formatCurrency(goal.target_amount)}
            </p>
          </>
        ) : (
          <p className="mt-1.5 text-xs text-ink-400">{t('empty_goal_body')}</p>
        )}
      </div>
    </div>
  );
}
