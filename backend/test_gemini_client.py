import unittest
from unittest.mock import MagicMock, patch
import pytest

from app.services.gemini_client import GeminiClient


def test_gemini_client_missing_api_key():
    client = GeminiClient(api_key="", model="gemini-2.5-flash")
    with pytest.raises(ValueError, match="GEMINI_API_KEY is not configured"):
        _ = client.client


def test_gemini_client_empty_prompt():
    client = GeminiClient(api_key="fake-key", model="gemini-2.5-flash")
    with pytest.raises(ValueError, match="Prompt cannot be empty"):
        client.generate_content("")


@patch("app.services.gemini_client.genai.Client")
def test_gemini_client_success(mock_genai_client):
    mock_instance = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Mocked Gemini response"
    mock_instance.models.generate_content.return_value = mock_response
    mock_genai_client.return_value = mock_instance

    client = GeminiClient(api_key="fake-key", model="gemini-2.5-flash")
    result = client.generate_content("Hello Gemini")

    assert result == "Mocked Gemini response"
    mock_instance.models.generate_content.assert_called_once_with(
        model="gemini-2.5-flash",
        contents="Hello Gemini",
    )


@patch("app.services.gemini_client.genai.Client")
def test_gemini_client_api_error(mock_genai_client):
    mock_instance = MagicMock()
    from google.genai import errors
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_instance.models.generate_content.side_effect = errors.APIError("API failure", response=mock_response)
    mock_genai_client.return_value = mock_instance

    client = GeminiClient(api_key="fake-key", model="gemini-2.5-flash")
    with pytest.raises(RuntimeError, match="Gemini service unavailable"):
        client.generate_content("Hello Gemini")
