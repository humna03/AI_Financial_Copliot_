from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Financial Copilot"
    app_env: str = "development"
    debug: bool = True
    database_url: str = "sqlite:///./financial_copilot.db"
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash"

    # Comma-separated list of frontend origins allowed to call this API, e.g.
    # "http://localhost:5173,https://app.example.com". Defaults to the Vite dev
    # server so local development keeps working out of the box. Production
    # deployments MUST set this to their real frontend origin(s) — never "*".
    frontend_url: str = "http://localhost:5173"

    # .env is shared with app/auth.py's own os.getenv() reads (e.g.
    # AUTH_SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES), which aren't Settings
    # fields, hence extra="ignore".
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_allowed_origins(self) -> List[str]:
        """Splits frontend_url on commas and strips whitespace, so a single env
        var can configure one or several allowed origins without any wildcard."""
        return [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]


settings = Settings()
