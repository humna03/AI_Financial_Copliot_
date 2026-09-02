from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Financial Copilot"
    app_env: str = "development"
    debug: bool = True
    database_url: str = "sqlite:///./financial_copilot.db"
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
