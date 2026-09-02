import pytest
from sqlmodel import SQLModel, create_engine, Session

from app.models import User, FinancialProfile, Expense, Goal, ScoreResult
from app.services.copilot_context import assemble_copilot_context


@pytest.fixture
def sqlite_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_assemble_context_full(sqlite_session):
    # Setup test user and data
    user = User(id=1, language="ur")
    sqlite_session.add(user)

    profile = FinancialProfile(
        id=1, user_id=1, monthly_income=100000.0, monthly_savings=20000.0
    )
    sqlite_session.add(profile)

    exp1 = Expense(id=1, user_id=1, category="food", amount=30000.0)
    exp2 = Expense(id=2, user_id=1, category="rent", amount=40000.0)
    sqlite_session.add(exp1)
    sqlite_session.add(exp2)

    goal = Goal(id=1, user_id=1, target_amount=240000.0, description="New Car")
    sqlite_session.add(goal)

    score_res = ScoreResult(
        id=1,
        user_id=1,
        score_value=85,
        factors_summary='[{"name": "savings_rate", "impact": "positive"}]',
    )
    sqlite_session.add(score_res)
    sqlite_session.commit()

    context = assemble_copilot_context(sqlite_session, 1)

    assert context.monthly_income == 100000.0
    assert context.monthly_savings == 20000.0
    assert len(context.expenses) == 2
    assert context.expenses[0]["category"] == "food"
    assert context.expenses[0]["amount"] == 30000.0
    assert context.goal is not None
    assert context.goal["target_amount"] == 240000.0
    assert context.goal["progress_percent"] == 100.0  # (20000 * 12 / 240000) * 100 = 100%
    assert context.score == 85
    assert len(context.factors) == 1
    assert context.factors[0]["name"] == "savings_rate"
    assert context.language == "ur"

    # Verify string prompt serialization works
    prompt_str = context.to_prompt_context_string()
    assert "100000.0" in prompt_str
    assert "ur" in prompt_str
    assert "New Car" in prompt_str


def test_assemble_context_missing_user(sqlite_session):
    with pytest.raises(ValueError, match="User 999 not found"):
        assemble_copilot_context(sqlite_session, 999)


def test_assemble_context_missing_profile(sqlite_session):
    user = User(id=2, language="en")
    sqlite_session.add(user)
    sqlite_session.commit()

    with pytest.raises(ValueError, match="Financial profile not found for user 2"):
        assemble_copilot_context(sqlite_session, 2)
