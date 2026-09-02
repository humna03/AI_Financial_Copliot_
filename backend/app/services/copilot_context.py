import json
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select

from app.models import User, FinancialProfile, Expense, Goal, ScoreResult
from app.services.score_engine import calculate_goal_progress


@dataclass
class CopilotContext:
    monthly_income: float
    monthly_savings: float
    expenses: List[Dict[str, Any]]
    goal: Optional[Dict[str, Any]] = None
    score: Optional[int] = None
    factors: List[Dict[str, Any]] = field(default_factory=list)
    language: str = "en"

    def to_prompt_context_string(self) -> str:
        """Serializes the context into a clean text representation for AI prompts."""
        ctx = {
            "monthly_income": self.monthly_income,
            "monthly_savings": self.monthly_savings,
            "expenses": self.expenses,
            "goal": self.goal,
            "score": self.score,
            "factors": self.factors,
            "language": self.language,
        }
        return json.dumps(ctx, ensure_ascii=False, indent=2)


def assemble_copilot_context(session: Session, user_id: int) -> CopilotContext:
    """
    Assembles the minimum relevant financial context for a user from SQLite,
    following DATA_MODEL.md §11 and API_CONTRACT.md §10.
    
    Includes:
    - monthly_income, monthly_savings (from FinancialProfile)
    - relevant expenses (from Expense)
    - goal target amount and calculated progress percent (from Goal)
    - latest score value and factors (from ScoreResult)
    - language preference (from User)
    
    Does NOT call Gemini. Does NOT calculate the score (reuses existing stored score or calculates if needed).
    """
    user = session.get(User, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")

    profile = session.exec(
        select(FinancialProfile).where(FinancialProfile.user_id == user_id)
    ).first()
    if not profile:
        raise ValueError(f"Financial profile not found for user {user_id}")

    expenses_records = session.exec(
        select(Expense).where(Expense.user_id == user_id)
    ).all()
    expenses = [{"category": e.category, "amount": e.amount} for e in expenses_records]

    goal_record = session.exec(
        select(Goal).where(Goal.user_id == user_id)
    ).first()
    goal_data = None
    if goal_record:
        progress_pct = calculate_goal_progress(profile.monthly_savings, goal_record)
        goal_data = {
            "target_amount": goal_record.target_amount,
            "description": goal_record.description,
            "progress_percent": progress_pct,
        }

    score_record = session.exec(
        select(ScoreResult)
        .where(ScoreResult.user_id == user_id)
        .order_by(ScoreResult.calculated_at.desc())
    ).first()

    score_value = None
    factors = []
    if score_record:
        score_value = score_record.score_value
        try:
            # factors_summary was stored as json string or similar
            if score_record.factors_summary:
                # If stored as JSON string or fallback parsing
                if score_record.factors_summary.startswith("["):
                    factors = json.loads(score_record.factors_summary)
                else:
                    # Simple representation fallback if needed
                    factors = [{"summary": score_record.factors_summary}]
        except Exception:
            factors = []

    return CopilotContext(
        monthly_income=profile.monthly_income,
        monthly_savings=profile.monthly_savings,
        expenses=expenses,
        goal=goal_data,
        score=score_value,
        factors=factors,
        language=user.language,
    )
