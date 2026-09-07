import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}

export function MetricCard({ icon: Icon, label, value, hint }: MetricCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink-400">{label}</p>
        <p className="break-words text-xl font-semibold text-ink-900 dark:text-ink-50">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
      </div>
    </Card>
  );
}
