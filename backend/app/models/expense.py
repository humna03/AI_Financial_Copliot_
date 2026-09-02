from typing import Optional

from sqlmodel import Field, SQLModel


class Expense(SQLModel, table=True):
    __tablename__ = "expenses"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    category: str = Field(max_length=50)
    amount: float = Field(ge=0)
