from typing import Optional

from pydantic import BaseModel, Field

# Goals can reasonably run larger than a single month's income/expense figure
# (e.g. a house down payment or retirement target), so this ceiling is higher
# than MAX_MONETARY_AMOUNT in financial_data.py, but still finite — which also
# rejects NaN and Infinity for free (see comment there).
MAX_GOAL_AMOUNT = 1_000_000_000  # 1 billion


class GoalRequest(BaseModel):
    target_amount: float = Field(gt=0, le=MAX_GOAL_AMOUNT)
    description: Optional[str] = Field(default=None, max_length=200)


class GoalResponse(BaseModel):
    target_amount: float
    description: Optional[str]
    created_at: str
    progress_percent: Optional[float] = None
    estimated_months_remaining: Optional[int] = None


class GoalDataResponse(BaseModel):
    data: GoalResponse