from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ConversationTurn(BaseModel):
    """One prior turn of the Copilot chat, sent by the frontend so the AI
    (and the language detector) has real multi-turn context — e.g. so
    "Is mein se kitni save karun?" can be understood as referring to an
    income mentioned two messages earlier."""

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class CopilotAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    # Recent conversation turns, oldest first, NOT including `question`
    # itself. Optional/omittable for backward compatibility with older
    # frontend builds and single-turn callers (e.g. existing tests).
    history: Optional[List[ConversationTurn]] = Field(default=None, max_length=20)


class CopilotAskResponse(BaseModel):
    answer: str
    # The language actually detected from the user's message for this turn
    # ("en" | "roman-ur" | "ur") — NOT the account's stored UI language.
    # The frontend uses this to set per-message text direction/font.
    language: str


class CopilotAskDataResponse(BaseModel):
    data: CopilotAskResponse
