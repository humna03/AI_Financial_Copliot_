from typing import List, Optional

from pydantic import BaseModel, Field


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
    new_amount: float = Field(ge=0)


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