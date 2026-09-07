import { useEffect, useState, type FormEvent } from 'react';
import { Target } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PageSpinner } from '../components/ui/Loading';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { getGoal, upsertGoal } from '../api/financial.api';
import type { Goal } from '../types/financial.types';
import { ApiError } from '../types/api.types';
import { useAppDispatch } from '../store/hooks';
import { pushToast } from '../store/slices/uiSlice';
import { formatCurrency, formatPercent } from '../utils/currency';

export function GoalsPage() {
  const { financialUserId } = useAuth();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    if (!financialUserId) return;
    setLoading(true);
    setError(null);
    getGoal(financialUserId)
      .then((g) => {
        setGoal(g);
        setTargetAmount(String(g.target_amount));
        setDescription(g.description ?? '');
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setGoal(null);
          setEditing(true);
          return;
        }
        setError(err instanceof ApiError ? err.message : t('error_load_goal'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [financialUserId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!financialUserId) return;
    setFormError(null);
    setSaving(true);
    try {
      await upsertGoal(financialUserId, {
        target_amount: Number(targetAmount),
        description: description || undefined,
      });
      dispatch(pushToast('success', t('goal_saved')));
      setEditing(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('error_save_goal'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div>
      <PageHeader title={t('sidebar_goals')} subtitle={t('landing_final_subtitle')} />

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && !editing && goal && (
        <Card className="max-w-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-ink-900 dark:text-ink-50">
                {goal.description || t('goal')}
              </p>
              <p className="text-sm text-ink-400">{t('target')}: {formatCurrency(goal.target_amount)}</p>
            </div>
          </div>

          {goal.progress_percent !== null && (
            <div className="mb-2">
              <div className="mb-1 flex justify-between text-xs text-ink-400">
                <span>{t('progress')}</span>
                <span>{formatPercent(goal.progress_percent)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-700 ease-premium"
                  style={{ width: `${Math.min(100, goal.progress_percent)}%` }}
                />
              </div>
            </div>
          )}

          {goal.estimated_months_remaining !== null && (
            <p className="text-sm text-ink-400">
              {t('months_remaining', { count: goal.estimated_months_remaining })}
            </p>
          )}

          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditing(true)}>
            {t('action_edit_goal')}
          </Button>
        </Card>
      )}

      {!error && !goal && !editing && (
        <EmptyState
          icon={Target}
          title={t('empty_goal_title')}
          body={t('empty_goal_body')}
          actionLabel={t('action_set_goal')}
          onAction={() => setEditing(true)}
        />
      )}

      {!error && editing && (
        <Card className="max-w-lg">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label={t('target_amount')}
              type="number"
              min={1}
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
            <Input
              label={t('goal_description')}
              placeholder={t('goal_placeholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>
                {t('action_save')}
              </Button>
              {goal && (
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  {t('action_cancel')}
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
