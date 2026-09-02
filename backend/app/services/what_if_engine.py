from dataclasses import dataclass
from typing import Optional

from app.models import FinancialProfile, Expense, Goal
from app.services.score_engine import ScoreFactor, ScoreResult, calculate_score


@dataclass
class SimulationCurrent:
    monthly_savings: float
    score: int
    goal_progress_percent: Optional[float]


@dataclass
class SimulationSimulated:
    monthly_savings: float
    score: int
    goal_progress_percent: Optional[float]


@dataclass
class SimulationResult:
    current: SimulationCurrent
    simulated: SimulationSimulated


def run_simulation(
    profile: FinancialProfile,
    expenses: list[Expense],
    goal: Optional[Goal],
    category: str,
    new_amount: float,
) -> SimulationResult:
    current_result = calculate_score(profile, expenses, goal)

    simulated_expenses = []
    for expense in expenses:
        if expense.category.lower() == category.lower():
            simulated_expenses.append(
                type("Expense", (), {"category": expense.category, "amount": new_amount})()
            )
        else:
            simulated_expenses.append(expense)

    simulated_savings = profile.monthly_income - sum(e.amount for e in simulated_expenses)
    simulated_profile = type(
        "FinancialProfile",
        (),
        {
            "monthly_income": profile.monthly_income,
            "monthly_savings": max(0, simulated_savings),
        },
    )()

    simulated_result = calculate_score(simulated_profile, simulated_expenses, goal)

    return SimulationResult(
        current=SimulationCurrent(
            monthly_savings=current_result.monthly_savings,
            score=current_result.score,
            goal_progress_percent=current_result.goal_progress_percent,
        ),
        simulated=SimulationSimulated(
            monthly_savings=simulated_result.monthly_savings,
            score=simulated_result.score,
            goal_progress_percent=simulated_result.goal_progress_percent,
        ),
    )