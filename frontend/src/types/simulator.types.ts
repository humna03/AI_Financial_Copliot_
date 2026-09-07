export interface SimulateInput {
  category: string;
  new_amount: number;
}

export interface SimulationBlock {
  monthly_savings: number;
  score: number;
  goal_progress_percent: number | null;
}

export interface SimulateResult {
  current: SimulationBlock;
  simulated: SimulationBlock;
}
