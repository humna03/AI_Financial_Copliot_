from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class ScoreResult(SQLModel, table=True):
    __tablename__ = "score_results"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    score_value: int = Field(ge=0, le=100)
    calculated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    factors_summary: str = Field()
