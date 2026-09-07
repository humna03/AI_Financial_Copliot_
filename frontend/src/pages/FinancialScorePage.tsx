import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Loading';
import { EmptyState, ErrorState } from '../components/ui/States';
import { ScoreRing } from '../components/score/ScoreRing';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { getScore } from '../api/score.api';
import type { Score } from '../types/score.types';
import { ApiError } from '../types/api.types';
import { titleCase } from '../utils/helpers';
import { ROUTES } from '../constants/routes';

export function FinancialScorePage() {
  const { financialUserId } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!financialUserId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    getScore(financialUserId)
      .then(setScore)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(err instanceof ApiError ? err.message : t('error_load_score'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [financialUserId]);

  if (loading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title={t('score_title')}
        subtitle={t('score_subtitle')}
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {notFound && (
        <EmptyState
          title={t('empty_financial_title')}
          body={t('empty_financial_body')}
          actionLabel={t('action_add_financial')}
          onAction={() => navigate(ROUTES.financial)}
        />
      )}

      {score && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center gap-4 text-center lg:col-span-1">
            <ScoreRing score={score.score} />
            <p className="max-w-xs text-sm text-ink-500 dark:text-ink-300">{score.explanation}</p>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h3 className="mb-3 font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                {t('factors')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {score.factors.map((f) => (
                  <Badge key={f.name} tone={f.impact === 'positive' ? 'positive' : 'negative'}>
                    {titleCase(f.name.replace(/_/g, ' '))}
                    {f.detail ? ` — ${f.detail}` : ''}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-[18px] w-[18px] text-gold-500" />
                <h3 className="font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                  {t('suggestions')}
                </h3>
              </div>
              <ul className="space-y-2">
                {score.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <span className="text-ink-300 dark:text-ink-600">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
