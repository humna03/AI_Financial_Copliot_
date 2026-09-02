from typing import List, Optional

from pydantic import BaseModel, Field


class ExpenseItem(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    amount: float = Field(ge=0)


class GoalDashboardResponse(BaseModel):
    target_amount: float
    description: Optional[str]
    progress_percent: Optional[float] = None
    estimated_months_remaining: Optional[int] = None


class DashboardResponse(BaseModel):
    score: int
    monthly_income: float
    monthly_savings: float
    expenses: List[ExpenseItem]
    goal: GoalDashboardResponse
    language: str
    calculated_at: str


class DashboardDataResponse(BaseModel):
    data: DashboardResponse