from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class FinancialProfile(SQLModel, table=True):
    __tablename__ = "financial_profiles"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    monthly_income: float = Field(ge=0)
    monthly_savings: float = Field(ge=0)
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
