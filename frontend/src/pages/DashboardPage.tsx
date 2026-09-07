import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  PiggyBank,
  Receipt,
  TrendingUp,
  Gauge,
  Lightbulb,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ExpenseBreakdownChart } from '../components/dashboard/ExpenseBreakdownChart';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { SavingsGoalPanel } from '../components/dashboard/SavingsGoalPanel';
import { ScoreRing } from '../components/score/ScoreRing';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Loading';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { getDashboard } from '../api/dashboard.api';
import { getScore } from '../api/score.api';
import { getFinancialData } from '../api/financial.api';
import type { Dashboard } from '../types/dashboard.types';
import type { Score } from '../types/score.types';
import { ApiError } from '../types/api.types';
import { formatCurrency, formatPercent } from '../utils/currency';
import { formatDate, titleCase } from '../utils/helpers';
import { ROUTES } from '../constants/routes';

export function DashboardPage() {
  const { financialUserId } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const animateCharts = !reducedMotion;

  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Secondary, non-blocking enrichment: score factors/suggestions and the
  // financial profile's last-updated timestamp. Both reuse existing
  // endpoints, and either can silently stay null without breaking the page.
  const [scoreDetail, setScoreDetail] = useState<Score | null>(null);
  const [profileUpdatedAt, setProfileUpdatedAt] = useState<string | null>(null);

  const load = () => {
    if (!financialUserId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setScoreDetail(null);
    setProfileUpdatedAt(null);

    getDashboard(financialUserId)
      .then((dashboard) => {
        setData(dashboard);
        getScore(financialUserId)
          .then(setScoreDetail)
          .catch(() => setScoreDetail(null));
        getFinancialData(financialUserId)
          .then((fd) => setProfileUpdatedAt(fd.updated_at))
          .catch(() => setProfileUpdatedAt(null));
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Something went wrong.');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [financialUserId]);

  const totalExpenses = data ? data.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
  const savingsRate =
    data && data.monthly_income > 0 ? (data.monthly_savings / data.monthly_income) * 100 : null;
  const hasExpenses = (data?.expenses.length ?? 0) > 0 && totalExpenses > 0;

  const activity: { label: string; detail: string }[] = [];
  if (data) {
    activity.push({
      label: t('activity_score_calculated'),
      detail: formatDate(data.calculated_at),
    });
  }
  if (profileUpdatedAt) {
    activity.push({
      label: t('activity_profile_updated'),
      detail: formatDate(profileUpdatedAt),
    });
  }

  return (
    <div>
      <PageHeader title={t('sidebar_dashboard')} subtitle={t('dashboard_subtitle')} />

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && notFound && (
        <EmptyState
          title={t('empty_financial_title')}
          body={t('empty_financial_body')}
          actionLabel={t('action_add_financial')}
          onAction={() => navigate(ROUTES.financial)}
        />
      )}

      {!loading && !error && !notFound && data && (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                icon: Wallet,
                label: t('income'),
                value: formatCurrency(data.monthly_income),
              },
              {
                icon: PiggyBank,
                label: t('savings'),
                value: formatCurrency(data.monthly_savings),
              },
              {
                icon: Receipt,
                label: t('total_expenses'),
                value: formatCurrency(totalExpenses),
              },
              {
                icon: TrendingUp,
                label: t('savings_rate'),
                value: formatPercent(savingsRate),
              },
              {
                icon: Gauge,
                label: t('score_title'),
                value: `${data.score}/100`,
                hint:
                  data.score >= 70
                    ? t('healthy')
                    : data.score >= 45
                      ? t('needs_attention')
                      : t('at_risk'),
              },
            ].map((metric, i) => (
              <div
                key={metric.label}
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: reducedMotion ? '0ms' : `${i * 60}ms` }}
              >
                <MetricCard {...metric} />
              </div>
            ))}
          </div>

          {/* Expense breakdown + income vs expenses */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-1 font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                {t('expense_breakdown')}
              </h3>
              <p className="mb-4 text-xs text-ink-400">{t('expense_breakdown_subtitle')}</p>
              <ExpenseBreakdownChart expenses={data.expenses} animate={animateCharts} />
            </Card>

            <Card>
              <h3 className="mb-1 font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                {t('income_vs_expenses')}
              </h3>
              <p className="mb-4 text-xs text-ink-400">{t('income_vs_expenses_subtitle')}</p>
              <IncomeExpenseChart
                income={data.monthly_income}
                expenses={totalExpenses}
                savings={data.monthly_savings}
                animate={animateCharts}
              />
            </Card>
          </div>

          {/* Savings/goal, score insights, recent activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <h3 className="mb-4 font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                {t('savings_goal_title')}
              </h3>
              <SavingsGoalPanel
                monthlyIncome={data.monthly_income}
                totalExpenses={totalExpenses}
                savingsRate={savingsRate}
                goal={data.goal}
                hasExpenses={hasExpenses}
                animate={animateCharts}
              />
            </Card>

            <Card className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                  {t('score_insights')}
                </h3>
                <ScoreRing score={data.score} size={72} strokeWidth={7} />
              </div>

              {scoreDetail ? (
                <div className="flex flex-1 flex-col">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {scoreDetail.factors.slice(0, 4).map((f) => (
                      <Badge key={f.name} tone={f.impact === 'positive' ? 'positive' : 'negative'}>
                        {titleCase(f.name.replace(/_/g, ' '))}
                      </Badge>
                    ))}
                  </div>
                  {scoreDetail.suggestions[0] && (
                    <div className="flex gap-2 text-sm text-ink-600 dark:text-ink-300">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                      <span>{scoreDetail.suggestions[0]}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="flex-1 text-sm text-ink-400">{data.score >= 70 ? t('healthy') : data.score >= 45 ? t('needs_attention') : t('at_risk')}</p>
              )}

              <Link
                to={ROUTES.score}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] transition-transform duration-200 ease-premium hover:translate-x-0.5"
              >
                {t('view_full_breakdown')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-[18px] w-[18px] text-ink-400" />
                <h3 className="font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                  {t('recent_activity')}
                </h3>
              </div>
              {activity.length > 0 ? (
                <ul className="space-y-3">
                  {activity.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-ink-600 dark:text-ink-300">{item.label}</span>
                      <span className="shrink-0 text-xs text-ink-400">{item.detail}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-400">{t('no_recent_activity')}</p>
              )}
            </Card>
          </div>

          {/* Existing expense list, preserved as-is */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-[18px] w-[18px] text-ink-400" />
              <h3 className="font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                {t('expenses')}
              </h3>
            </div>
            <div className="divide-y divide-ink-100 dark:divide-ink-800">
              {data.expenses.map((e) => (
                <div key={e.category} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink-600 dark:text-ink-300">{titleCase(e.category)}</span>
                  <span className="font-medium text-ink-900 dark:text-ink-50">
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
