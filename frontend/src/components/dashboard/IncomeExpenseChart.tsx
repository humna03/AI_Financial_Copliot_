import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatCurrencyCompact } from '../../utils/currency';

interface Props {
  income: number;
  expenses: number;
  savings: number;
  animate: boolean;
}

/** A single-period comparison, not a fabricated historical trend — the
 * backend only exposes the current month's figures. */
export function IncomeExpenseChart({ income, expenses, savings, animate }: Props) {
  const { t } = useTranslation();

  const data = [
    { key: t('income'), value: Math.max(0, income), color: 'rgb(var(--primary-rgb))' },
    { key: t('expenses'), value: Math.max(0, expenses), color: 'rgb(var(--gold-rgb))' },
    { key: t('savings'), value: Math.max(0, savings), color: 'rgb(var(--accent-rgb))' },
  ];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
            width={56}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-hover)' }}
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            maxBarSize={64}
            isAnimationActive={animate}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
