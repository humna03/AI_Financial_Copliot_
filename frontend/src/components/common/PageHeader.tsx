import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink-900 dark:text-ink-50">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-sm text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
