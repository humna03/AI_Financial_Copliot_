import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.database import get_session, create_db_and_tables
from sqlmodel import SQLModel, create_engine, Session

from app.models import User, FinancialProfile, Expense, Goal, ScoreResult


@pytest.fixture(autouse=True)
def setup_db():
    from app.database import engine
    SQLModel.metadata.create_all(engine)
    yield
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@patch("app.routes.copilot.gemini_client.generate_content")
def test_copilot_ask_success_english(mock_generate, client):
    # Setup user and financial profile
    user_resp = client.post("/api/users", json={"language": "en"})
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 80000,
            "monthly_savings": 10000,
            "expenses": [{"category": "food", "amount": 20000}],
        },
    )

    mock_generate.return_value = "Based on your savings of 10,000, you are doing well."

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": "Can I afford to save more?"},
    )

    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert json_data["data"]["answer"] == "Based on your savings of 10,000, you are doing well."
    assert json_data["data"]["language"] == "en"
    mock_generate.assert_called_once()
    prompt_used = mock_generate.call_args[0][0]
    assert "Can I afford to save more?" in prompt_used
    assert "80000" in prompt_used


@patch("app.routes.copilot.gemini_client.generate_content")
def test_copilot_ask_success_urdu(mock_generate, client):
    user_resp = client.post("/api/users", json={"language": "ur"})
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 50000,
            "monthly_savings": 5000,
            "expenses": [{"category": "rent", "amount": 20000}],
        },
    )

    mock_generate.return_value = "آپ کی بچت اچھی ہے۔"

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": "کیا میں زیادہ بچت کر سکتا ہوں؟"},
    )

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["answer"] == "آپ کی بچت اچھی ہے۔"
    assert json_data["data"]["language"] == "ur"
    prompt_used = mock_generate.call_args[0][0]
    assert "Urdu" in prompt_used


def test_copilot_ask_unknown_user(client):
    response = client.post(
        "/api/users/999/copilot/ask",
        json={"question": "Can I save more?"},
    )
    assert response.status_code == 404
    assert "error" in response.json()


def test_copilot_ask_no_financial_data(client):
    user_resp = client.post("/api/users", json={"language": "en"})
    user_id = user_resp.json()["data"]["user_id"]

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": "Can I save more?"},
    )
    assert response.status_code == 404
    assert "error" in response.json()


def test_copilot_ask_validation_empty_question(client):
    user_resp = client.post("/api/users", json={"language": "en"})
    user_id = user_resp.json()["data"]["user_id"]

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": ""},
    )
    assert response.status_code == 422
    assert "error" in response.json()
