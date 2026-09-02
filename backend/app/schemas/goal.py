from typing import Optional

from pydantic import BaseModel, Field


class GoalRequest(BaseModel):
    target_amount: float = Field(gt=0)
    description: Optional[str] = Field(default=None, max_length=200)


class GoalResponse(BaseModel):
    target_amount: float
    description: Optional[str]
    created_at: str
    progress_percent: Optional[float] = None
    estimated_months_remaining: Optional[int] = None


class GoalDataResponse(BaseModel):
    data: GoalResponse