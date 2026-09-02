from dataclasses import dataclass
from typing import Optional

from app.models import FinancialProfile, Expense, Goal


@dataclass
class ScoreFactor:
    name: str
    impact: str
    detail: str = ""


@dataclass
class ScoreResult:
    score: int
    factors: list[ScoreFactor]
    monthly_savings: float
    goal_progress_percent: Optional[float] = None


def _score_savings_rate(savings_rate: float) -> tuple[int, str, str]:
    if savings_rate >= 0.20:
        return 40, "positive", f"Savings rate ({savings_rate:.0%}) meets healthy target (≥20%)"
    if savings_rate >= 0.15:
        return 32, "positive", f"Savings rate ({savings_rate:.0%}) is above 15%"
    if savings_rate >= 0.10:
        return 24, "negative", f"Savings rate ({savings_rate:.0%}) is below healthy target (20%)"
    if savings_rate >= 0.05:
        return 16, "negative", f"Savings rate ({savings_rate:.0%}) is below healthy target (20%)"
    if savings_rate >= 0.01:
        return 8, "negative", f"Savings rate ({savings_rate:.0%}) is well below healthy target (20%)"
    return 0, "negative", "Savings rate is 0%"


def _score_expense_ratio(expense_ratio: float) -> tuple[int, str, str]:
    if expense_ratio <= 0.50:
        return 35, "positive", f"Expense ratio ({expense_ratio:.0%}) is within healthy range (≤50%)"
    if expense_ratio <= 0.60:
        return 28, "negative", f"Expense ratio ({expense_ratio:.0%}) exceeds healthy threshold (50%)"
    if expense_ratio <= 0.70:
        return 21, "negative", f"Expense ratio ({expense_ratio:.0%}) exceeds healthy threshold (50%)"
    if expense_ratio <= 0.80:
        return 14, "negative", f"Expense ratio ({expense_ratio:.0%}) exceeds healthy threshold (50%)"
    if expense_ratio <= 0.90:
        return 7, "negative", f"Expense ratio ({expense_ratio:.0%}) exceeds healthy threshold (50%)"
    return 0, "negative", f"Expense ratio ({expense_ratio:.0%}) far exceeds healthy threshold (50%)"


def _score_goal_progress(progress_percent: float) -> tuple[int, str, str]:
    if progress_percent >= 100:
        return 25, "positive", f"Goal progress ({progress_percent:.0f}%) is on track"
    if progress_percent >= 75:
        return 18, "positive", f"Goal progress ({progress_percent:.0f}%) is making good progress"
    if progress_percent >= 50:
        return 12, "negative", f"Goal progress ({progress_percent:.0f}%) is behind schedule"
    if progress_percent >= 25:
        return 6, "negative", f"Goal progress ({progress_percent:.0f}%) is behind schedule"
    if progress_percent > 0:
        return 2, "negative", f"Goal progress ({progress_percent:.0f}%) is behind schedule"
    return 0, "negative", "No goal progress yet"


def calculate_goal_progress(monthly_savings: float, goal: Optional[Goal]) -> Optional[float]:
    if not goal or goal.target_amount <= 0:
        return None
    annual_savings = monthly_savings * 12
    progress = (annual_savings / goal.target_amount) * 100
    return round(min(progress, 100), 1)


def calculate_score(
    profile: FinancialProfile,
    expenses: list[Expense],
    goal: Optional[Goal] = None,
) -> ScoreResult:
    income = profile.monthly_income
    savings = profile.monthly_savings

    if income <= 0:
        return ScoreResult(
            score=0,
            factors=[
                ScoreFactor(name="income", impact="negative", detail="No income recorded")
            ],
            monthly_savings=savings,
            goal_progress_percent=calculate_goal_progress(savings, goal),
        )

    total_expenses = sum(e.amount for e in expenses)
    savings_rate = savings / income if income > 0 else 0
    expense_ratio = total_expenses / income if income > 0 else 0

    savings_score, savings_impact, savings_detail = _score_savings_rate(savings_rate)
    expense_score, expense_impact, expense_detail = _score_expense_ratio(expense_ratio)

    goal_progress = calculate_goal_progress(savings, goal)
    if goal_progress is not None:
        goal_score, goal_impact, goal_detail = _score_goal_progress(goal_progress)
    else:
        goal_score, goal_impact, goal_detail = 0, "negative", "No goal set"

    final_score = savings_score + expense_score + goal_score
    final_score = max(0, min(final_score, 100))

    factors: list[ScoreFactor] = []
    factors.append(ScoreFactor(name="savings_rate", impact=savings_impact, detail=savings_detail))
    factors.append(ScoreFactor(name="expense_ratio", impact=expense_impact, detail=expense_detail))
    if goal_progress is not None:
        factors.append(ScoreFactor(name="goal_progress", impact=goal_impact, detail=goal_detail))

    return ScoreResult(
        score=final_score,
        factors=factors,
        monthly_savings=savings,
        goal_progress_percent=goal_progress,
    )