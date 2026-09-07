import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';

export function SettingsPage() {
  const { authUser, financialUserId } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title={t('settings_title')} />

      <Card>
        <h3 className="mb-3 font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
          {t('account')}
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-ink-400">{t('name')}</dt>
            <dd className="min-w-0 truncate text-ink-800 dark:text-ink-100">{authUser?.full_name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-ink-400">{t('field_email')}</dt>
            <dd className="min-w-0 truncate text-ink-800 dark:text-ink-100">{authUser?.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-ink-400">{t('financial_profile_id')}</dt>
            <dd className="min-w-0 truncate text-ink-800 dark:text-ink-100">{financialUserId}</dd>
          </div>
        </dl>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <h3 className="font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
            {t('theme')}
          </h3>
          <p className="text-sm text-ink-400">{t('settings_theme_description')}</p>
        </div>
        <ThemeToggle />
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <h3 className="font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
            {t('language')}
          </h3>
          <p className="text-sm text-ink-400">
            {t('settings_language_description')}
          </p>
        </div>
        <LanguageSwitcher />
      </Card>
    </div>
  );
}
