import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PageSpinner } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/States';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { getFinancialData, upsertFinancialData } from '../api/financial.api';
import { ApiError } from '../types/api.types';
import { useAppDispatch } from '../store/hooks';
import { pushToast } from '../store/slices/uiSlice';
import type { ExpenseItem } from '../types/financial.types';

const DEFAULT_EXPENSE: ExpenseItem = { category: '', amount: 0 };

export function FinancialProfilePage() {
  const { financialUserId } = useAuth();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([{ ...DEFAULT_EXPENSE }]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    if (!financialUserId) return;
    setLoading(true);
    setLoadError(null);
    getFinancialData(financialUserId)
      .then((data) => {
        setIncome(String(data.monthly_income));
        setSavings(String(data.monthly_savings));
        setExpenses(data.expenses.length ? data.expenses : [{ ...DEFAULT_EXPENSE }]);
      })
      .catch((err: unknown) => {
        // 404 just means no data submitted yet — start from a blank form, not an error.
        if (err instanceof ApiError && err.status === 404) return;
        setLoadError(err instanceof ApiError ? err.message : t('error_load_financial'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [financialUserId]);

  const updateExpense = (index: number, field: keyof ExpenseItem, value: string) => {
    setExpenses((prev) =>
      prev.map((exp, i) =>
        i === index ? { ...exp, [field]: field === 'amount' ? Number(value) : value } : exp
      )
    );
  };

  const addExpense = () => setExpenses((prev) => [...prev, { ...DEFAULT_EXPENSE }]);
  const removeExpense = (index: number) =>
    setExpenses((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!financialUserId) return;
    setFormError(null);

    const cleanExpenses = expenses
      .map((exp) => ({ category: exp.category.trim(), amount: Number(exp.amount) }))
      .filter((exp) => exp.category.length > 0);

    if (cleanExpenses.length === 0) {
      setFormError(t('error_expense_required'));
      return;
    }

    setSaving(true);
    try {
      await upsertFinancialData(financialUserId, {
        monthly_income: Number(income),
        monthly_savings: Number(savings),
        expenses: cleanExpenses,
      });
      dispatch(pushToast('success', t('financial_saved')));
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('error_save_financial'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title={t('sidebar_financial')}
        subtitle={t('financial_subtitle')}
      />

      {loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('monthly_income')}
              type="number"
              min={0}
              step="1"
              required
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
            <Input
              label={t('monthly_savings')}
              type="number"
              min={0}
              step="1"
              required
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
            />
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                {t('expenses')}
              </h3>
              <Button type="button" variant="secondary" size="sm" onClick={addExpense}>
                <Plus className="h-4 w-4" /> {t('add_expense')}
              </Button>
            </div>

            <div className="space-y-3">
              {expenses.map((exp, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <Input
                    label={i === 0 ? t('category') : undefined}
                    placeholder={t('expense_placeholder')}
                    value={exp.category}
                    onChange={(e) => updateExpense(i, 'category', e.target.value)}
                  />
                  <Input
                    label={i === 0 ? t('amount') : undefined}
                    type="number"
                    min={0}
                    value={exp.amount}
                    onChange={(e) => updateExpense(i, 'amount', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExpense(i)}
                    disabled={expenses.length === 1}
                    aria-label={t('action_delete')}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button type="submit" loading={saving}>
            {t('action_save')}
          </Button>
        </form>
      )}
    </div>
  );
}
