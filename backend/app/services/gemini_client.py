import logging
from typing import Optional
from google import genai
from google.genai import errors

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.gemini_api_key
        self.model = model or settings.gemini_model
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not configured")
            # Initialize official google-genai client
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def generate_content(self, prompt: str) -> str:
        """
        Sends a prompt to Gemini and returns the generated text response.
        Handles provider/API failures by raising RuntimeError (which the future Copilot layer can map to 502).
        Does not access the database.
        """
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty")

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
            if response and response.text:
                return response.text
            raise RuntimeError("Empty response received from Gemini API")
        except errors.APIError as e:
            logger.error(f"Gemini API error: {e}")
            raise RuntimeError(f"Gemini service unavailable: {e}") from e
        except Exception as e:
            logger.error(f"Unexpected error communicating with Gemini: {e}")
            raise RuntimeError(f"Gemini service error: {e}") from e


# Singleton instance for backend use
gemini_client = GeminiClient()
