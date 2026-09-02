from typing import Literal

from pydantic import BaseModel


class UserCreate(BaseModel):
    language: Literal["en", "ur"]


class UserResponse(BaseModel):
    user_id: int
    language: str


class UserDataResponse(BaseModel):
    data: UserResponse