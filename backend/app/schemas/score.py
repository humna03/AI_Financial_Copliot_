from typing import List, Optional

from pydantic import BaseModel, Field

# Matches financial_data.py's ceiling — the simulator adjusts one existing
# expense category, so the same per-field bound applies.
MAX_MONETARY_AMOUNT = 100_000_000


class ScoreFactor(BaseModel):
    name: str
    impact: str
    detail: Optional[str] = None


class ScoreResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    factors: List[ScoreFactor]
    explanation: str
    suggestions: List[str]
    calculated_at: str


class ScoreDataResponse(BaseModel):
    data: ScoreResponse


class SimulateRequest(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    new_amount: float = Field(ge=0, le=MAX_MONETARY_AMOUNT)


class SimulationCurrent(BaseModel):
    monthly_savings: float
    score: int
    goal_progress_percent: Optional[float] = None


class SimulationSimulated(BaseModel):
    monthly_savings: float
    score: int
    goal_progress_percent: Optional[float] = None


class SimulateResponse(BaseModel):
    current: SimulationCurrent
    simulated: SimulationSimulated


class SimulateDataResponse(BaseModel):
    data: SimulateResponse