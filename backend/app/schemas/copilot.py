from pydantic import BaseModel, Field


class CopilotAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


class CopilotAskResponse(BaseModel):
    answer: str
    language: str


class CopilotAskDataResponse(BaseModel):
    data: CopilotAskResponse
