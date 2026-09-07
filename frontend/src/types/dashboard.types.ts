import type { ExpenseItem } from './financial.types';

export interface DashboardGoal {
  target_amount: number;
  description: string | null;
  progress_percent: number | null;
  estimated_months_remaining: number | null;
}

export interface Dashboard {
  score: number;
  monthly_income: number;
  monthly_savings: number;
  expenses: ExpenseItem[];
  goal: DashboardGoal;
  language: string;
  calculated_at: string;
}
