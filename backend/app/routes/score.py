import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Expense, FinancialProfile, Goal, ScoreResult, User
from app.schemas import ScoreDataResponse, ScoreFactor as ScoreFactorSchema, ScoreResponse
from app.schemas.common import ErrorResponse
from app.services.score_engine import ScoreFactor, calculate_score
from app.services.gemini_client import gemini_client

logger = logging.getLogger(__name__)

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


def build_fallback_explanation_and_suggestions(score_result, language: str = "en"):
    negative_factors = [f for f in score_result.factors if f.impact == "negative"]

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


def generate_ai_explanation_and_suggestions(score_result, language: str = "en"):
    """
    Uses Gemini to explain the backend-calculated score and factors in plain language,
    in the user's selected language (English or Urdu).
    Per API_CONTRACT.md §7 & ARCHITECTURE.md §14, if Gemini is unavailable, falls back gracefully.
    """
    lang_name = "Urdu" if language == "ur" else "English"
    factors_desc = ", ".join([f"{f.name} ({f.impact}): {f.detail}" for f in score_result.factors])
    
    prompt = f"""You are an AI Financial Copilot. A user's Financial Health Score has been calculated by the system score engine as {score_result.score}/100.
Contributing factors: {factors_desc}.

Instructions:
1. Provide a clear, concise 1-sentence plain-language explanation of why the user received this score based on the factors.
2. Provide 1-2 actionable improvement suggestions.
3. Respond in {lang_name}.
4. Format your response strictly as JSON with keys "explanation" (string) and "suggestions" (array of strings). Do not include any other text or markdown block outside valid JSON if possible, or parse cleanly.
"""
    try:
        response_text = gemini_client.generate_content(prompt)
        # Clean up markdown code blocks if present
        cleaned_text = response_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        elif cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()

        data = json.loads(cleaned_text)
        explanation = data.get("explanation")
        suggestions = data.get("suggestions")
        if explanation and isinstance(suggestions, list) and len(suggestions) > 0:
            return explanation, suggestions[:2]
    except Exception as e:
        logger.warning(f"Gemini score explanation generation failed or failed to parse JSON: {e}. Falling back to default explanation.")

    return build_fallback_explanation_and_suggestions(score_result, language)


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


@router.get(
    "/users/{user_id}/score",
    response_model=ScoreDataResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User or financial data not found"},
        500: {"model": ErrorResponse, "description": "Calculation failure"},
        502: {"model": ErrorResponse, "description": "Gemini unavailable — score and factors still returned with default explanation"},
    },
)
def get_score(user_id: int, session: Session = Depends(get_session)):
    user = get_user_or_404(session, user_id)
    profile = get_financial_profile_or_404(session, user_id)
    expenses = get_expenses(session, user_id)
    if not expenses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "No expenses found. Submit financial data first."}},
        )

    goal = get_goal(session, user_id)

    # 1. Authoritative score calculation by backend Score Engine (AI never determines score)
    score_result = calculate_score(profile, expenses, goal)

    # 2. AI explanation generation via Gemini (with graceful fallback per API_CONTRACT.md §7 / ARCHITECTURE.md §14)
    try:
        explanation, suggestions = generate_ai_explanation_and_suggestions(
            score_result, language=user.language
        )
    except Exception:
        explanation, suggestions = build_fallback_explanation_and_suggestions(
            score_result, language=user.language
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
