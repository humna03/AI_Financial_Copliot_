export interface ExpenseItem {
  category: string;
  amount: number;
}

export interface FinancialData {
  monthly_income: number;
  monthly_savings: number;
  expenses: ExpenseItem[];
  updated_at: string;
}

export interface FinancialDataInput {
  monthly_income: number;
  monthly_savings: number;
  expenses: ExpenseItem[];
}

export interface Goal {
  target_amount: number;
  description: string | null;
  created_at: string;
  progress_percent: number | null;
  estimated_months_remaining: number | null;
}

export interface GoalInput {
  target_amount: number;
  description?: string | null;
}
