import { useTranslation } from '../../hooks/useTranslation';

export function HeroVisual() {
  const { t } = useTranslation();
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-ink-200/50 to-gold-200/40 blur-2xl dark:from-ink-800/40 dark:to-gold-700/20" />
      <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft dark:border-ink-800 dark:bg-ink-900">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-medium text-ink-400">{t('score_title')}</p>
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
            {t('current')}
          </span>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r="38" fill="none" stroke="currentColor" strokeWidth="9" className="text-ink-100 dark:text-ink-800" />
            <circle
              cx="44"
              cy="44"
              r="38"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="9"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={2 * Math.PI * 38 * 0.28}
              strokeLinecap="round"
            />
          </svg>
          <div>
            <p className="font-sans text-3xl font-bold text-ink-900 dark:text-ink-50">72</p>
            <p className="text-xs text-ink-400">{t('monthly_savings')}<br />{t('healthy')}</p>
          </div>
        </div>

        <div className="space-y-2.5 border-t border-ink-100 pt-4 dark:border-ink-800">
          {[
            { label: t('expenses'), width: '70%' },
            { label: t('monthly_savings'), width: '55%' },
            { label: t('goal'), width: '30%' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-ink-400">{row.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: row.width }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-xl2 border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 sm:block rtl:left-auto rtl:-right-6">
        <p className="text-xs font-medium text-ink-400">{t('nav_copilot')}</p>
        <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">
          {t('copilot_subtitle')}
        </p>
      </div>
    </div>
  );
}
