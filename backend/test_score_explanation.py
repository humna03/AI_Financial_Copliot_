"""
test_score_explanation.py — Tests for GET /api/users/{user_id}/score

Every financial endpoint now requires a valid JWT (see the IDOR/auth fix in
app/auth.py + app/routes/*.py), so these tests sign up and log in a real
account per test and attach its Bearer token to every request, matching the
current authenticated API contract.

Test database configuration is handled by conftest.py, which sets
DATABASE_URL once for the whole pytest session before any app module is
imported — see its docstring for why that matters here.

Run with:
    pytest test_score_explanation.py -v
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from sqlmodel import SQLModel

from app.main import app


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


def auth_headers(client) -> dict:
    """Signs up + logs in a fresh, uniquely-emailed account and returns the
    Authorization header for it."""
    email = f"score-{uuid.uuid4().hex}@example.com"
    password = "SuperSecret123"
    signup = client.post(
        "/auth/signup",
        json={"full_name": "Test User", "email": email, "password": password},
    )
    assert signup.status_code == 201, signup.text
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@patch("app.routes.score.gemini_client.generate_content")
def test_score_explanation_success_english(mock_generate, client):
    headers = auth_headers(client)

    # Setup user (English) and financial profile
    user_resp = client.post("/api/users", json={"language": "en"}, headers=headers)
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 80000,
            "monthly_savings": 10000,
            "expenses": [{"category": "food", "amount": 20000}],
        },
        headers=headers,
    )

    mock_generate.return_value = '{"explanation": "Your score is 59 because savings rate is low.", "suggestions": ["Save more money."]}'

    response = client.get(f"/api/users/{user_id}/score", headers=headers)

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
    headers = auth_headers(client)

    user_resp = client.post("/api/users", json={"language": "ur"}, headers=headers)
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 80000,
            "monthly_savings": 10000,
            "expenses": [{"category": "food", "amount": 20000}],
        },
        headers=headers,
    )

    mock_generate.return_value = '{"explanation": "آپ کا اسکور 59 ہے۔", "suggestions": ["بچت بڑھائیں۔"]}'

    response = client.get(f"/api/users/{user_id}/score", headers=headers)

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["score"] == 59
    assert json_data["data"]["explanation"] == "آپ کا اسکور 59 ہے۔"
    assert json_data["data"]["suggestions"] == ["بچت بڑھائیں۔"]
    prompt_used = mock_generate.call_args[0][0]
    assert "Urdu" in prompt_used


@patch("app.routes.score.gemini_client.generate_content")
def test_score_explanation_gemini_failure_fallback(mock_generate, client):
    headers = auth_headers(client)

    user_resp = client.post("/api/users", json={"language": "en"}, headers=headers)
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 80000,
            "monthly_savings": 10000,
            "expenses": [{"category": "food", "amount": 20000}],
        },
        headers=headers,
    )

    # Simulate Gemini failure (exception raised)
    mock_generate.side_effect = RuntimeError("Gemini down")

    response = client.get(f"/api/users/{user_id}/score", headers=headers)

    # Per API_CONTRACT.md §7: score and factors are still returned; explanation falls back gracefully
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["score"] == 59
    assert "Your score is 59 because" in json_data["data"]["explanation"]
    assert len(json_data["data"]["suggestions"]) > 0


def test_score_no_token_is_unauthorized(client):
    response = client.get("/api/users/1/score")
    assert response.status_code == 401


def test_score_wrong_owner_is_forbidden(client):
    """IDOR regression check: a second, unrelated authenticated account must
    never be able to read the first account's score."""
    owner_headers = auth_headers(client)
    owner_resp = client.post("/api/users", json={"language": "en"}, headers=owner_headers)
    owner_user_id = owner_resp.json()["data"]["user_id"]
    client.post(
        f"/api/users/{owner_user_id}/financial-data",
        json={
            "monthly_income": 80000,
            "monthly_savings": 10000,
            "expenses": [{"category": "food", "amount": 20000}],
        },
        headers=owner_headers,
    )

    stranger_headers = auth_headers(client)
    response = client.get(f"/api/users/{owner_user_id}/score", headers=stranger_headers)
    assert response.status_code == 403
    assert "80000" not in response.text
