import { Link } from 'react-router-dom';
import {
  Gauge,
  MessageCircle,
  FlaskConical,
  Lightbulb,
  Target,
  ArrowRight,
  UploadCloud,
  ScanLine,
  Sparkles,
  Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import { HeroVisual } from '../components/layout/HeroVisual';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ScoreRing } from '../components/score/ScoreRing';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { useTranslation } from '../hooks/useTranslation';
import { ROUTES } from '../constants/routes';
import type { TranslationKey } from '../utils/i18n';

const features: { icon: LucideIcon; title: TranslationKey; body: TranslationKey }[] = [
  { icon: Gauge, title: 'feature_score_title', body: 'feature_score_body' },
  { icon: MessageCircle, title: 'feature_copilot_title', body: 'feature_copilot_body' },
  { icon: FlaskConical, title: 'feature_simulator_title', body: 'feature_simulator_body' },
  { icon: Lightbulb, title: 'feature_insights_title', body: 'feature_insights_body' },
  { icon: Target, title: 'feature_goals_title', body: 'feature_goals_body' },
];

const steps: { icon: LucideIcon; title: TranslationKey; body: TranslationKey }[] = [
  { icon: UploadCloud, title: 'step_add_title', body: 'step_add_body' },
  { icon: ScanLine, title: 'step_analyze_title', body: 'step_analyze_body' },
  { icon: Lightbulb, title: 'step_insights_title', body: 'step_insights_body' },
  { icon: Sparkles, title: 'step_copilot_title', body: 'step_copilot_body' },
];

const prompts: TranslationKey[] = ['prompt_improve', 'prompt_reduce', 'prompt_save'];

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink-50 dark:bg-ink-950">
      <LandingNavbar />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div>
          <h1 className="animate-fade-in-up font-sans text-3xl font-bold leading-tight text-ink-900 dark:text-ink-50 sm:text-4xl lg:text-5xl">
            {t('hero_title')}
          </h1>
          <p
            className="mt-5 max-w-lg animate-fade-in-up text-base text-ink-500 dark:text-ink-300"
            style={{ animationDelay: '90ms' }}
          >
            {t('hero_subtitle')}
          </p>
          <div
            className="mt-8 flex animate-fade-in-up flex-wrap gap-3"
            style={{ animationDelay: '170ms' }}
          >
            <Link to={ROUTES.register}>
              <Button size="lg">
                {t('hero_cta_primary')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="secondary">
                {t('hero_cta_secondary')}
              </Button>
            </a>
          </div>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <HeroVisual />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-section-anchor mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <ScrollReveal className="mb-10 max-w-xl">
          <h2 className="font-sans text-2xl font-semibold text-ink-900 dark:text-ink-50 sm:text-3xl">
            {t('landing_features_title')}
          </h2>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
            {t('landing_features_subtitle')}
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 70}>
              <Card interactive className="group h-full">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-600 transition-colors duration-200 ease-premium group-hover:bg-[var(--primary)] group-hover:text-white dark:bg-ink-800 dark:text-ink-300 dark:group-hover:text-ink-950">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-sans text-base font-semibold text-ink-900 dark:text-ink-50">
                  {t(f.title)}
                </h3>
                <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{t(f.body)}</p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="landing-section-anchor border-y border-ink-100 bg-white py-16 dark:border-ink-800 dark:bg-ink-900/40"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <ScrollReveal>
            <h2 className="mb-10 font-sans text-2xl font-semibold text-ink-900 dark:text-ink-50 sm:text-3xl">
              {t('nav_how')}
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 80} className="relative">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white transition-transform duration-200 ease-premium hover:scale-105 dark:text-ink-950">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-sans text-sm font-semibold text-ink-900 dark:text-ink-50">
                  {i + 1}. {t(s.title)}
                </h3>
                <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{t(s.body)}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Score showcase */}
      <section id="score" className="landing-section-anchor mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              {t('nav_score')}
            </p>
            <h2 className="mt-2 font-sans text-2xl font-semibold text-ink-900 dark:text-ink-50 sm:text-3xl">
              {t('feature_score_title')}
            </h2>
            <p className="mt-3 max-w-md text-sm text-ink-500 dark:text-ink-300">
              {t('score_subtitle')}
            </p>
            <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
              {t('feature_score_body')}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <Card className="mx-auto flex max-w-sm flex-col items-center gap-4 py-8">
              <ScoreRing score={72} />
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {t('healthy')}
              </span>
              <p className="px-2 text-center text-xs text-ink-400">{t('suggestions')}</p>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* AI Copilot showcase */}
      <section
        id="copilot"
        className="landing-section-anchor border-y border-ink-100 bg-white py-16 dark:border-ink-800 dark:bg-ink-900/40"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <ScrollReveal className="lg:order-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                {t('nav_copilot')}
              </p>
              <h2 className="mt-2 font-sans text-2xl font-semibold text-ink-900 dark:text-ink-50 sm:text-3xl">
                {t('feature_copilot_title')}
              </h2>
              <p className="mt-3 max-w-md text-sm text-ink-500 dark:text-ink-300">
                {t('copilot_subtitle')}
              </p>
              <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
                {t('feature_copilot_body')}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={100} className="lg:order-1">
              <Card className="mx-auto max-w-sm">
                <div className="flex items-center gap-2 border-b border-ink-100 pb-3 dark:border-ink-800">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white dark:text-ink-950">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium text-ink-500 dark:text-ink-300">
                    {t('copilot_title')}
                  </span>
                </div>
                <div className="my-4 flex flex-wrap gap-1.5">
                  {prompts.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-ink-200 px-2.5 py-1 text-[11px] text-ink-500 dark:border-ink-700 dark:text-ink-300"
                    >
                      {t(p)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                  <span className="flex-1 truncate text-xs text-ink-400">
                    {t('copilot_placeholder')}
                  </span>
                  <Send className="h-3.5 w-3.5 shrink-0 text-ink-400 rtl:-scale-x-100" />
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* What-If Simulator showcase */}
      <section id="simulator" className="landing-section-anchor mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              {t('nav_simulator')}
            </p>
            <h2 className="mt-2 font-sans text-2xl font-semibold text-ink-900 dark:text-ink-50 sm:text-3xl">
              {t('feature_simulator_title')}
            </h2>
            <p className="mt-3 max-w-md text-sm text-ink-500 dark:text-ink-300">
              {t('simulator_subtitle')}
            </p>
            <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
              {t('feature_simulator_body')}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <Card className="mx-auto max-w-sm space-y-4">
              {[
                { label: t('current'), width: '55%' },
                { label: t('simulated'), width: '72%' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-ink-400">
                    <span>{row.label}</span>
                    <span>{t('goal_progress')}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-700 ease-premium"
                      style={{ width: row.width }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-8">
        <ScrollReveal>
          <h2 className="font-sans text-2xl font-semibold text-ink-900 dark:text-ink-50 sm:text-3xl">
            {t('landing_final_title')}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink-500 dark:text-ink-300">
            {t('landing_final_subtitle')}
          </p>
          <Link to={ROUTES.register}>
            <Button size="lg" className="mt-6">
              {t('hero_cta_primary')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        </ScrollReveal>
      </section>

      <footer className="border-t border-ink-100 py-8 text-center text-xs text-ink-400 dark:border-ink-800">
        {t('landing_footer')}
      </footer>
    </div>
  );
}
