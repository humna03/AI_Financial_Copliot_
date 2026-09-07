export interface ScoreFactor {
  name: string;
  impact: 'positive' | 'negative' | string;
  detail: string | null;
}

export interface Score {
  score: number;
  factors: ScoreFactor[];
  explanation: string;
  suggestions: string[];
  calculated_at: string;
}
