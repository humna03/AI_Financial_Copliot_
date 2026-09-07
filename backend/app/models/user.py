from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    language: str = Field(default="en", max_length=2)
    # Links this financial profile to the auth_users.id that owns it (see app/auth.py).
    # Nullable so the column can be added additively to an existing database; a NULL
    # here means the profile has no verified owner and every ownership check denies it.
    auth_user_id: Optional[int] = Field(default=None, index=True)
