from pydantic import BaseModel, Field


class ExpenseItem(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    amount: float = Field(ge=0)


class FinancialDataRequest(BaseModel):
    monthly_income: float = Field(ge=0)
    monthly_savings: float = Field(ge=0)
    expenses: list[ExpenseItem] = Field(min_length=1)


class FinancialDataResponse(BaseModel):
    monthly_income: float
    monthly_savings: float
    expenses: list[ExpenseItem]
    updated_at: str


class FinancialDataDataResponse(BaseModel):
    data: FinancialDataResponse