from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Expense, FinancialProfile, Goal, User
from app.schemas import SimulateDataResponse, SimulateRequest, SimulateResponse, SimulationCurrent, SimulationSimulated
from app.schemas.common import ErrorResponse
from app.services.what_if_engine import run_simulation

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


def get_goal(session: Session, user_id: int) -> Goal | None:
    return session.exec(select(Goal).where(Goal.user_id == user_id)).first()


@router.post(
    "/users/{user_id}/simulate",
    response_model=SimulateDataResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid category or amount"},
        404: {"model": ErrorResponse, "description": "User, financial data, or goal not found"},
        422: {"model": ErrorResponse, "description": "Validation failure"},
    },
)
def run_what_if_simulation(
    user_id: int, request: SimulateRequest, session: Session = Depends(get_session)
):
    get_user_or_404(session, user_id)

    profile = get_financial_profile_or_404(session, user_id)
    expenses = get_expenses(session, user_id)
    if not expenses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "No expenses found. Submit financial data first."}},
        )

    matching_expense = next(
        (e for e in expenses if e.category.lower() == request.category.lower()), None
    )
    if not matching_expense:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": f"Category '{request.category}' not found in user's expenses",
                }
            },
        )

    goal = get_goal(session, user_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Goal not set. Create a goal first."}},
        )

    result = run_simulation(profile, expenses, goal, request.category, request.new_amount)

    return SimulateDataResponse(
        data=SimulateResponse(
            current=SimulationCurrent(
                monthly_savings=result.current.monthly_savings,
                score=result.current.score,
                goal_progress_percent=result.current.goal_progress_percent,
            ),
            simulated=SimulationSimulated(
                monthly_savings=result.simulated.monthly_savings,
                score=result.simulated.score,
                goal_progress_percent=result.simulated.goal_progress_percent,
            ),
        )
    )