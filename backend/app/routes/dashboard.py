from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Expense, FinancialProfile, Goal, User
from app.schemas.dashboard import DashboardDataResponse, DashboardResponse, GoalDashboardResponse, ExpenseItem
from app.schemas.common import ErrorResponse
from app.services.score_engine import calculate_score

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


def get_goal_with_progress(session: Session, user_id: int) -> Optional[GoalDashboardResponse]:
    goal = session.exec(select(Goal).where(Goal.user_id == user_id)).first()
    if not goal:
        return None
    
    profile = session.exec(
        select(FinancialProfile).where(FinancialProfile.user_id == user_id)
    ).first()
    
    progress_percent = None
    estimated_months_remaining = None
    
    if profile and goal.target_amount > 0:
        annual_savings = profile.monthly_savings * 12
        progress_percent = round(min((annual_savings / goal.target_amount) * 100, 100), 1)
        if profile.monthly_savings > 0:
            estimated_months_remaining = round(goal.target_amount / profile.monthly_savings)
    
    return GoalDashboardResponse(
        target_amount=goal.target_amount,
        description=goal.description,
        progress_percent=progress_percent,
        estimated_months_remaining=estimated_months_remaining,
    )


@router.get(
    "/users/{user_id}/dashboard",
    response_model=DashboardDataResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User or financial data not found"},
    },
)
def get_dashboard(user_id: int, session: Session = Depends(get_session)):
    get_user_or_404(session, user_id)
    
    profile = get_financial_profile_or_404(session, user_id)
    expenses = get_expenses(session, user_id)
    goal_response = get_goal_with_progress(session, user_id)
    
    if goal_response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "No goal set. Create a goal first."}},
        )
    
    score_result = calculate_score(profile, expenses, goal_response)
    
    # Calculate estimated_months_remaining for the dashboard goal display
    estimated_months_remaining = None
    if profile.monthly_savings > 0 and goal_response.target_amount > 0:
        estimated_months_remaining = round(goal_response.target_amount / profile.monthly_savings)
    
    return DashboardDataResponse(
        data=DashboardResponse(
            score=score_result.score,
            monthly_income=profile.monthly_income,
            monthly_savings=profile.monthly_savings,
            expenses=[ExpenseItem(category=e.category, amount=e.amount) for e in expenses],
            goal=goal_response,
            language="en",
            calculated_at=datetime.now(timezone.utc).isoformat(),
        )
    )