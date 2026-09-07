/** Formats a number as PKR, e.g. 80000 -> "Rs. 80,000". */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  const rounded = Math.round(amount);
  return `Rs. ${rounded.toLocaleString('en-PK')}`;
}

/** Compact form for tight spaces, e.g. 1,200,000 -> "Rs. 1.2M". */
export function formatCurrencyCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `Rs. ${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
}
