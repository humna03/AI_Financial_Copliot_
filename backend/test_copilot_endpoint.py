"""
test_copilot_endpoint.py — Tests for POST /api/users/{user_id}/copilot/ask

Every financial endpoint now requires a valid JWT (see the IDOR/auth fix in
app/auth.py + app/routes/*.py), so these tests sign up and log in a real
account per test and attach its Bearer token to every request, matching the
current authenticated API contract.

Test database configuration is handled by conftest.py, which sets
DATABASE_URL once for the whole pytest session before any app module is
imported — see its docstring for why that matters here.

Run with:
    pytest test_copilot_endpoint.py -v
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from sqlmodel import SQLModel


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
    Authorization header for it. Each call creates an independent account, so
    tests that need two separate users (e.g. an IDOR check) can call this
    twice."""
    email = f"copilot-{uuid.uuid4().hex}@example.com"
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


@patch("app.routes.copilot.gemini_client.generate_content")
def test_copilot_ask_success_english(mock_generate, client):
    headers = auth_headers(client)

    # Setup user and financial profile
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

    mock_generate.return_value = "Based on your savings of 10,000, you are doing well."

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": "Can I afford to save more?"},
        headers=headers,
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
    headers = auth_headers(client)

    user_resp = client.post("/api/users", json={"language": "ur"}, headers=headers)
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 50000,
            "monthly_savings": 5000,
            "expenses": [{"category": "rent", "amount": 20000}],
        },
        headers=headers,
    )

    mock_generate.return_value = "آپ کی بچت اچھی ہے۔"

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": "کیا میں زیادہ بچت کر سکتا ہوں؟"},
        headers=headers,
    )

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["answer"] == "آپ کی بچت اچھی ہے۔"
    assert json_data["data"]["language"] == "ur"
    prompt_used = mock_generate.call_args[0][0]
    assert "Urdu" in prompt_used


@patch("app.routes.copilot.gemini_client.generate_content")
def test_copilot_ask_success_roman_urdu(mock_generate, client):
    """A Roman Urdu question should be detected as such and answered in
    Roman Urdu, regardless of the account's stored UI language."""
    headers = auth_headers(client)

    user_resp = client.post("/api/users", json={"language": "en"}, headers=headers)
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 100000,
            "monthly_savings": 15000,
            "expenses": [{"category": "rent", "amount": 30000}],
        },
        headers=headers,
    )

    mock_generate.return_value = "Aap ki savings theek hain, lekin thori aur bacha sakte hain."

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": "Meri savings kitni hain?"},
        headers=headers,
    )

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["language"] == "roman-ur"
    prompt_used = mock_generate.call_args[0][0]
    assert "Roman Urdu" in prompt_used


@patch("app.routes.copilot.gemini_client.generate_content")
def test_copilot_ask_uses_conversation_history_for_context_and_language(mock_generate, client):
    """A short follow-up like 'Is mein se 20% kitna hoga?' should be
    answered using the earlier turn's context, and history should keep the
    conversation in Roman Urdu even though the follow-up alone is short."""
    headers = auth_headers(client)

    user_resp = client.post("/api/users", json={"language": "en"}, headers=headers)
    user_id = user_resp.json()["data"]["user_id"]

    client.post(
        f"/api/users/{user_id}/financial-data",
        json={
            "monthly_income": 100000,
            "monthly_savings": 15000,
            "expenses": [{"category": "rent", "amount": 30000}],
        },
        headers=headers,
    )

    mock_generate.return_value = "Is mein se 20,000 save hoga."

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={
            "question": "Is mein se 20% kitna hoga?",
            "history": [
                {"role": "user", "content": "Meri income 100000 hai."},
                {"role": "assistant", "content": "Theek hai, aap ki income 100,000 hai."},
            ],
        },
        headers=headers,
    )

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["language"] == "roman-ur"
    prompt_used = mock_generate.call_args[0][0]
    assert "Meri income 100000 hai." in prompt_used
    assert "Is mein se 20% kitna hoga?" in prompt_used


def test_copilot_ask_no_token_is_unauthorized(client):
    """A completely unauthenticated request must be rejected before any
    ownership/existence check runs."""
    response = client.post(
        "/api/users/1/copilot/ask",
        json={"question": "Can I save more?"},
    )
    assert response.status_code == 401


def test_copilot_ask_unknown_user(client):
    headers = auth_headers(client)
    response = client.post(
        "/api/users/999999/copilot/ask",
        json={"question": "Can I save more?"},
        headers=headers,
    )
    assert response.status_code == 404
    assert "error" in response.json()


def test_copilot_ask_wrong_owner_is_forbidden(client):
    """IDOR regression check: a second, unrelated authenticated account must
    never be able to ask Copilot about the first account's financial user_id."""
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
    response = client.post(
        f"/api/users/{owner_user_id}/copilot/ask",
        json={"question": "What is this person's income?"},
        headers=stranger_headers,
    )
    assert response.status_code == 403
    assert "80000" not in response.text
    assert "10000" not in response.text


def test_copilot_ask_no_financial_data(client):
    headers = auth_headers(client)
    user_resp = client.post("/api/users", json={"language": "en"}, headers=headers)
    user_id = user_resp.json()["data"]["user_id"]

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": "Can I save more?"},
        headers=headers,
    )
    assert response.status_code == 404
    assert "error" in response.json()


def test_copilot_ask_validation_empty_question(client):
    headers = auth_headers(client)
    user_resp = client.post("/api/users", json={"language": "en"}, headers=headers)
    user_id = user_resp.json()["data"]["user_id"]

    response = client.post(
        f"/api/users/{user_id}/copilot/ask",
        json={"question": ""},
        headers=headers,
    )
    assert response.status_code == 422
    assert "error" in response.json()
