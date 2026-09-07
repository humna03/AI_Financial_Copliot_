import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { PageSpinner } from '../components/ui/Loading';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { getFinancialData, upsertFinancialData } from '../api/financial.api';
import { runSimulation } from '../api/simulator.api';
import type { ExpenseItem } from '../types/financial.types';
import type { SimulateResult } from '../types/simulator.types';
import { ApiError } from '../types/api.types';
import { useAppDispatch } from '../store/hooks';
import { pushToast } from '../store/slices/uiSlice';
import { formatCurrency, formatPercent } from '../utils/currency';
import { titleCase } from '../utils/helpers';
import { ROUTES } from '../constants/routes';

function ComparisonRow({
  label,
  current,
  simulated,
  format = (v: number) => String(v),
}: {
  label: string;
  current: number | null;
  simulated: number | null;
  format?: (v: number) => string;
}) {
  const delta = current !== null && simulated !== null ? simulated - current : null;
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-2.5 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="font-medium text-ink-900 dark:text-ink-50">
        {current !== null ? format(current) : '—'}
      </span>
      <span className="flex items-center gap-1.5 font-medium">
        {simulated !== null ? format(simulated) : '—'}
        {delta !== null && delta !== 0 && (
          <span className={delta > 0 ? 'text-ink-600 dark:text-ink-300' : 'text-gold-600 dark:text-gold-400'}>
            ({delta > 0 ? '+' : ''}
            {format(delta)})
          </span>
        )}
      </span>
    </div>
  );
}

export function SimulatorPage() {
  const { financialUserId } = useAuth();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<ExpenseItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [category, setCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const load = () => {
    if (!financialUserId) return;
    setLoading(true);
    setNotFound(false);
    setLoadError(null);
    getFinancialData(financialUserId)
      .then((data) => {
        setExpenses(data.expenses);
        if (data.expenses[0]) {
          setCategory(data.expenses[0].category);
          setNewAmount(String(data.expenses[0].amount));
        }
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setLoadError(err instanceof ApiError ? err.message : t('error_load_expenses'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [financialUserId]);

  const onSimulate = async (e: FormEvent) => {
    e.preventDefault();
    if (!financialUserId) return;
    setRunError(null);
    setRunning(true);
    try {
      const res = await runSimulation(financialUserId, {
        category,
        new_amount: Number(newAmount),
      });
      setResult(res);
    } catch (err) {
      setRunError(err instanceof ApiError ? err.message : t('error_run_simulation'));
    } finally {
      setRunning(false);
    }
  };

  const onApply = async () => {
    if (!financialUserId || !expenses) return;
    setApplying(true);
    try {
      const updatedExpenses = expenses.map((exp) =>
        exp.category === category ? { ...exp, amount: Number(newAmount) } : exp
      );
      const data = await getFinancialData(financialUserId);
      await upsertFinancialData(financialUserId, {
        monthly_income: data.monthly_income,
        monthly_savings: data.monthly_savings,
        expenses: updatedExpenses,
      });
      dispatch(pushToast('success', t('simulation_applied')));
      setExpenses(updatedExpenses);
    } catch (err) {
      dispatch(
        pushToast('error', err instanceof ApiError ? err.message : t('error_apply_simulation'))
      );
    } finally {
      setApplying(false);
    }
  };

  const onReset = () => {
    setResult(null);
    setRunError(null);
  };

  if (loading) return <PageSpinner />;

  return (
    <div>
      <PageHeader title={t('simulator_title')} subtitle={t('simulator_subtitle')} />

      {loadError && <ErrorState message={loadError} onRetry={load} />}

      {notFound && (
        <EmptyState
          title={t('empty_financial_title')}
          body={t('empty_financial_body')}
          actionLabel={t('action_add_financial')}
          onAction={() => navigate(ROUTES.financial)}
        />
      )}

      {!loadError && !notFound && expenses && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <form onSubmit={onSimulate} className="flex flex-col gap-4">
              <Select
                label={t('category')}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  const match = expenses.find((exp) => exp.category === e.target.value);
                  if (match) setNewAmount(String(match.amount));
                }}
              >
                {expenses.map((exp) => (
                  <option key={exp.category} value={exp.category}>
                    {titleCase(exp.category)} ({formatCurrency(exp.amount)})
                  </option>
                ))}
              </Select>
              <Input
                label={t('new_amount')}
                type="number"
                min={0}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
              {runError && <p className="text-sm text-red-500">{runError}</p>}
              <div className="flex gap-2">
                <Button type="submit" loading={running}>
                  {t('action_run_simulation')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
                {result && (
                  <Button type="button" variant="secondary" onClick={onReset}>
                    {t('action_reset')}
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card>
            {!result ? (
              <div className="flex h-full items-center justify-center py-10 text-center text-sm text-ink-400">
                {t('simulation_empty')}
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <div className="grid grid-cols-3 pb-2 text-xs font-medium uppercase tracking-wide text-ink-300">
                  <span></span>
                  <span>{t('current')}</span>
                  <span>{t('simulated')}</span>
                </div>
                <div className="divide-y divide-ink-100 dark:divide-ink-800">
                  <ComparisonRow
                    label={t('monthly_savings')}
                    current={result.current.monthly_savings}
                    simulated={result.simulated.monthly_savings}
                    format={formatCurrency}
                  />
                  <ComparisonRow
                    label={t('score_title')}
                    current={result.current.score}
                    simulated={result.simulated.score}
                  />
                  <ComparisonRow
                    label={t('goal_progress')}
                    current={result.current.goal_progress_percent}
                    simulated={result.simulated.goal_progress_percent}
                    format={formatPercent}
                  />
                </div>
                <Button className="mt-5 w-full" loading={applying} onClick={onApply}>
                  {t('action_apply')}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
