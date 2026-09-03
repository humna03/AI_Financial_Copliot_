"""
test_auth.py — Tests for app/auth.py (signup, login, protected /me route)

Run with:
    pytest test_auth.py -v
"""

import os

# Isolated test database, taake asli app.db se test data mix na ho
os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import router as auth_router

app = FastAPI()
app.include_router(auth_router)
client = TestClient(app)

TEST_USER = {
    "full_name": "Ali Khan",
    "email": "ali.khan@example.com",
    "password": "SuperSecret123",
}


@pytest.fixture(autouse=True)
def cleanup_test_db():
    """Har test se pehle/baad test database file delete kar deta hai."""
    yield
    if os.path.exists("test_auth.db"):
        os.remove("test_auth.db")


def test_signup_success():
    response = client.post("/auth/signup", json=TEST_USER)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == TEST_USER["email"]
    assert data["full_name"] == TEST_USER["full_name"]
    assert "hashed_password" not in data  # password kabhi response mein nahi aani chahiye


def test_signup_duplicate_email_fails():
    client.post("/auth/signup", json=TEST_USER)
    response = client.post("/auth/signup", json=TEST_USER)
    assert response.status_code == 400
    assert "pehle se" in response.json()["detail"]


def test_signup_weak_password_fails():
    weak_user = {**TEST_USER, "password": "123"}
    response = client.post("/auth/signup", json=weak_user)
    assert response.status_code == 422


def test_login_success():
    client.post("/auth/signup", json=TEST_USER)
    response = client.post(
        "/auth/login",
        json={"email": TEST_USER["email"], "password": TEST_USER["password"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_fails():
    client.post("/auth/signup", json=TEST_USER)
    response = client.post(
        "/auth/login",
        json={"email": TEST_USER["email"], "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user_fails():
    response = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "whatever123"},
    )
    assert response.status_code == 401


def test_protected_me_route_requires_token():
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_protected_me_route_with_valid_token():
    client.post("/auth/signup", json=TEST_USER)
    login_response = client.post(
        "/auth/login",
        json={"email": TEST_USER["email"], "password": TEST_USER["password"]},
    )
    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == TEST_USER["email"]
