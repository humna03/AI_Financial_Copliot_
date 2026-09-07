import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../constants/routes';
import { useTranslation } from '../hooks/useTranslation';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 px-4 text-center dark:bg-ink-950">
      <p className="font-sans text-6xl font-bold text-ink-200 dark:text-ink-800">404</p>
      <h1 className="text-xl font-semibold text-ink-900 dark:text-ink-50">{t('page_not_found')}</h1>
      <p className="max-w-sm text-sm text-ink-400">
        {t('page_not_found_body')}
      </p>
      <Link to={ROUTES.landing}>
        <Button>{t('back_home')}</Button>
      </Link>
    </div>
  );
}
