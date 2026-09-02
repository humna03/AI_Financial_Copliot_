from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Expense, FinancialProfile, Goal, User
from app.schemas import (
    ErrorResponse,
    ExpenseItem,
    FinancialDataRequest,
    FinancialDataDataResponse,
    FinancialDataResponse,
    GoalDataResponse,
    GoalRequest,
    GoalResponse,
    UserCreate,
    UserDataResponse,
    UserResponse,
)

router = APIRouter()


@router.post(
    "/users",
    response_model=UserDataResponse,
    status_code=status.HTTP_201_CREATED,
    responses={422: {"model": ErrorResponse, "description": "Validation failure"}},
)
def create_user(user_data: UserCreate, session: Session = Depends(get_session)):
    user = User(language=user_data.language)
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserDataResponse(data=UserResponse(user_id=user.id, language=user.language))


@router.post(
    "/users/{user_id}/financial-data",
    response_model=FinancialDataDataResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User not found"},
        422: {"model": ErrorResponse, "description": "Validation failure"},
    },
)
def upsert_financial_data(
    user_id: int, request: FinancialDataRequest, session: Session = Depends(get_session)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"User {user_id} not found"}},
        )

    existing_profile = session.exec(
        select(FinancialProfile).where(FinancialProfile.user_id == user_id)
    ).first()
    if existing_profile:
        existing_profile.monthly_income = request.monthly_income
        existing_profile.monthly_savings = request.monthly_savings
        existing_profile.updated_at = datetime.now(timezone.utc).isoformat()
        session.add(existing_profile)
        profile = existing_profile
    else:
        profile = FinancialProfile(
            user_id=user_id,
            monthly_income=request.monthly_income,
            monthly_savings=request.monthly_savings,
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        session.add(profile)
    session.commit()

    existing_expenses = session.exec(select(Expense).where(Expense.user_id == user_id)).all()
    for e in existing_expenses:
        session.delete(e)

    for exp in request.expenses:
        expense = Expense(user_id=user_id, category=exp.category, amount=exp.amount)
        session.add(expense)

    session.commit()
    session.refresh(profile)

    expenses = session.exec(select(Expense).where(Expense.user_id == user_id)).all()
    return FinancialDataDataResponse(
        data=FinancialDataResponse(
            monthly_income=profile.monthly_income,
            monthly_savings=profile.monthly_savings,
            expenses=[ExpenseItem(category=e.category, amount=e.amount) for e in expenses],
            updated_at=profile.updated_at,
        )
    )


@router.get(
    "/users/{user_id}/financial-data",
    response_model=FinancialDataDataResponse,
    responses={404: {"model": ErrorResponse, "description": "User or financial data not found"}},
)
def get_financial_data(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"User {user_id} not found"}},
        )

    profile = session.exec(
        select(FinancialProfile).where(FinancialProfile.user_id == user_id)
    ).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Financial data not found"}},
        )

    expenses = session.exec(select(Expense).where(Expense.user_id == user_id)).all()
    return FinancialDataDataResponse(
        data=FinancialDataResponse(
            monthly_income=profile.monthly_income,
            monthly_savings=profile.monthly_savings,
            expenses=[ExpenseItem(category=e.category, amount=e.amount) for e in expenses],
            updated_at=profile.updated_at,
        )
    )


@router.post(
    "/users/{user_id}/goal",
    response_model=GoalDataResponse,
    status_code=status.HTTP_200_OK,
    responses={
        404: {"model": ErrorResponse, "description": "User not found"},
        422: {"model": ErrorResponse, "description": "Validation failure"},
    },
)
def upsert_goal(user_id: int, request: GoalRequest, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"User {user_id} not found"}},
        )

    existing_goal = session.exec(select(Goal).where(Goal.user_id == user_id)).first()
    if existing_goal:
        existing_goal.target_amount = request.target_amount
        existing_goal.description = request.description
        session.add(existing_goal)
        goal = existing_goal
    else:
        goal = Goal(
            user_id=user_id,
            target_amount=request.target_amount,
            description=request.description,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        session.add(goal)
    session.commit()
    session.refresh(goal)

    return GoalDataResponse(
        data=GoalResponse(
            target_amount=goal.target_amount,
            description=goal.description,
            created_at=goal.created_at,
            progress_percent=None,
            estimated_months_remaining=None,
        )
    )


@router.get(
    "/users/{user_id}/goal",
    response_model=GoalDataResponse,
    responses={404: {"model": ErrorResponse, "description": "User or goal not found"}},
)
def get_goal(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"User {user_id} not found"}},
        )

    goal = session.exec(select(Goal).where(Goal.user_id == user_id)).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Goal not found"}},
        )

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

    return GoalDataResponse(
        data=GoalResponse(
            target_amount=goal.target_amount,
            description=goal.description,
            created_at=goal.created_at,
            progress_percent=progress_percent,
            estimated_months_remaining=estimated_months_remaining,
        )
    )