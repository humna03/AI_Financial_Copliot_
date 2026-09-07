import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { ExpenseItem } from '../../types/financial.types';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/currency';
import { titleCase } from '../../utils/helpers';

// Cycles through the brand palette only — green/teal as primary data color,
// gold used sparingly, never introducing an off-brand hue.
const PALETTE = [
  'rgb(var(--primary-rgb))',
  'rgb(var(--accent-rgb))',
  'rgb(var(--gold-rgb))',
  'rgb(var(--primary-rgb) / 0.55)',
  'rgb(var(--accent-rgb) / 0.55)',
  'rgb(var(--text-secondary-rgb))',
];

interface Props {
  expenses: ExpenseItem[];
  animate: boolean;
}

export function ExpenseBreakdownChart({ expenses, animate }: Props) {
  const { t } = useTranslation();
  const positive = expenses.filter((e) => e.amount > 0);
  const total = positive.reduce((sum, e) => sum + e.amount, 0);

  if (positive.length === 0 || total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-200 py-12 text-center dark:border-ink-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
          <PieChartIcon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-ink-700 dark:text-ink-200">{t('no_expenses_title')}</p>
        <p className="max-w-[220px] text-xs text-ink-400">{t('no_expenses_body')}</p>
      </div>
    );
  }

  const data = positive
    .map((e) => ({ name: titleCase(e.category), value: e.amount }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={data.length > 1 ? 2 : 0}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={animate}
              animationDuration={700}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={PALETTE[i % PALETTE.length]}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--text-primary)',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-ink-400">{t('total_expenses')}</span>
          <span className="text-lg font-semibold text-ink-900 dark:text-ink-50">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {data.map((entry, i) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-ink-600 dark:text-ink-300">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 text-ink-900 dark:text-ink-50">
              {formatCurrency(entry.value)}
              <span className="ms-1.5 text-xs text-ink-400">
                ({Math.round((entry.value / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
