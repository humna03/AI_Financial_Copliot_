from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Expense, FinancialProfile, Goal, ScoreResult, User
from app.schemas import ScoreDataResponse, ScoreFactor as ScoreFactorSchema, ScoreResponse
from app.schemas.common import ErrorResponse
from app.services.score_engine import ScoreFactor, calculate_score

router = APIRouter()


def get_user_or_404(session: Session, user_id: int) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"User {user_id} not found"}},
        )
    return user


def get_financial_profile_or_404(session: Session, user_id: int) -> FinancialProfile:
    profile = session.exec(
        select(FinancialProfile).where(FinancialProfile.user_id == user_id)
    ).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Financial data not found. Submit financial data first."}},
        )
    return profile


def get_expenses(session: Session, user_id: int) -> list[Expense]:
    return session.exec(select(Expense).where(Expense.user_id == user_id)).all()


def get_goal(session: Session, user_id: int) -> Optional[Goal]:
    return session.exec(select(Goal).where(Goal.user_id == user_id)).first()


def get_latest_score(session: Session, user_id: int) -> Optional[ScoreResult]:
    return session.exec(
        select(ScoreResult)
        .where(ScoreResult.user_id == user_id)
        .order_by(ScoreResult.calculated_at.desc())
    ).first()


def save_score_result(session: Session, user_id: int, score_value: int, factors_summary: str) -> ScoreResult:
    score_result = ScoreResult(
        user_id=user_id,
        score_value=score_value,
        factors_summary=factors_summary,
        calculated_at=datetime.now(timezone.utc).isoformat(),
    )
    session.add(score_result)
    session.commit()
    session.refresh(score_result)
    return score_result


def build_explanation_and_suggestions(score_result, profile, expenses, goal, language: str = "en"):
    negative_factors = [f for f in score_result.factors if f.impact == "negative"]
    positive_factors = [f for f in score_result.factors if f.impact == "positive"]

    if language == "ur":
        if negative_factors:
            explanation = f"آپ کا اسکور {score_result.score} ہے کیونکہ "
            explanation += "، ".join([f.detail for f in negative_factors[:2]])
            explanation += "۔"
        else:
            explanation = f"آپ کا اسکور {score_result.score} ہے جو ایک اچھا نشان ہے۔"

        suggestions = []
        for f in negative_factors[:2]:
            if "savings" in f.name:
                suggestions.append("اپنی ماہانہ بچت بڑھانے کی کوشش کریں۔")
            elif "expense" in f.name:
                suggestions.append("خرچوں میں کمی لائیں، خاص طور پر غیر ضروری اخراجات کم کریں۔")
            elif "spending" in f.name:
                cat = f.name.replace("_spending", "")
                suggestions.append(f"اپنے {cat} خرچوں کا جائزہ لیں اور ان میں کمی لائیں۔")
        if not suggestions:
            suggestions = ["موجودہ مالی عادات کو برقرار رکھیں۔"]
    else:
        if negative_factors:
            explanation = f"Your score is {score_result.score} because "
            explanation += ", ".join([f.detail for f in negative_factors[:2]])
            explanation += "."
        else:
            explanation = f"Your score is {score_result.score}, which is a healthy rating."

        suggestions = []
        for f in negative_factors[:2]:
            if "savings" in f.name:
                suggestions.append("Try to increase your monthly savings rate.")
            elif "expense" in f.name:
                suggestions.append("Reduce overall expenses, especially discretionary spending.")
            elif "spending" in f.name:
                cat = f.name.replace("_spending", "")
                suggestions.append(f"Review your {cat} spending and look for ways to reduce it.")
        if not suggestions:
            suggestions = ["Maintain your current financial habits."]

    return explanation, suggestions[:2]


@router.get(
    "/users/{user_id}/score",
    response_model=ScoreDataResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User or financial data not found"},
        500: {"model": ErrorResponse, "description": "Calculation failure"},
    },
)
def get_score(user_id: int, session: Session = Depends(get_session)):
    get_user_or_404(session, user_id)

    profile = get_financial_profile_or_404(session, user_id)
    expenses = get_expenses(session, user_id)
    if not expenses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "No expenses found. Submit financial data first."}},
        )

    goal = get_goal(session, user_id)

    score_result = calculate_score(profile, expenses, goal)

    explanation, suggestions = build_explanation_and_suggestions(
        score_result, profile, expenses, goal, language="en"
    )

    factors_summary = "".join([
        f'{{"name": "{f.name}", "impact": "{f.impact}"}}' for f in score_result.factors
    ])

    save_score_result(session, user_id, score_result.score, factors_summary)

    return ScoreDataResponse(
        data=ScoreResponse(
            score=score_result.score,
            factors=[ScoreFactorSchema(name=f.name, impact=f.impact, detail=f.detail) for f in score_result.factors],
            explanation=explanation,
            suggestions=suggestions,
            calculated_at=datetime.now(timezone.utc).isoformat(),
        )
    )