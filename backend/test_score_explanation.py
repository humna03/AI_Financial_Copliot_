import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from sqlmodel import SQLModel, Session, create_engine

from app.main import app
from app.database import get_session


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


@patch("app.routes.score.gemini_client.generate_content")
def test_score_explanation_success_english(mock_generate, client):
    # Setup user (English) and financial profile
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

    mock_generate.return_value = '{"explanation": "Your score is 59 because savings rate is low.", "suggestions": ["Save more money."]}'

    response = client.get(f"/api/users/{user_id}/score")

    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    # Verify score is calculated deterministically by backend Score Engine (59 for income 80k, savings 10k, exp 20k + no goal set = 24 + 35 + 0 = 59)
    assert json_data["data"]["score"] == 59
    assert json_data["data"]["explanation"] == "Your score is 59 because savings rate is low."
    assert json_data["data"]["suggestions"] == ["Save more money."]
    mock_generate.assert_called_once()
    prompt_used = mock_generate.call_args[0][0]
    assert "59/100" in prompt_used


@patch("app.routes.score.gemini_client.generate_content")
def test_score_explanation_success_urdu(mock_generate, client):
    user_resp = client.post("/api/users", json={"language": "ur"})
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 80000,
            "monthly_savings": 10000,
            "expenses": [{"category": "food", "amount": 20000}],
        },
    )

    mock_generate.return_value = '{"explanation": "آپ کا اسکور 59 ہے۔", "suggestions": ["بچت بڑھائیں۔"]}'

    response = client.get(f"/api/users/{user_id}/score")

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["score"] == 59
    assert json_data["data"]["explanation"] == "آپ کا اسکور 59 ہے۔"
    assert json_data["data"]["suggestions"] == ["بچت بڑھائیں۔"]
    prompt_used = mock_generate.call_args[0][0]
    assert "Urdu" in prompt_used


@patch("app.routes.score.gemini_client.generate_content")
def test_score_explanation_gemini_failure_fallback(mock_generate, client):
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

    # Simulate Gemini failure (exception raised)
    mock_generate.side_effect = RuntimeError("Gemini down")

    response = client.get(f"/api/users/{user_id}/score")

    # Per API_CONTRACT.md §7: score and factors are still returned; explanation falls back gracefully
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["score"] == 59
    assert "Your score is 59 because" in json_data["data"]["explanation"]
    assert len(json_data["data"]["suggestions"]) > 0
