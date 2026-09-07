from pydantic import BaseModel, Field

# Generous but finite domain ceiling for a single monthly financial figure.
# Bounding above (rather than only below with `ge=0`) also rejects NaN and
# Infinity for free, since any comparison against NaN is False and `inf` is
# never <= a finite number.
MAX_MONETARY_AMOUNT = 100_000_000  # per-field ceiling, e.g. $100M/month


class ExpenseItem(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    amount: float = Field(ge=0, le=MAX_MONETARY_AMOUNT)


class FinancialDataRequest(BaseModel):
    monthly_income: float = Field(ge=0, le=MAX_MONETARY_AMOUNT)
    monthly_savings: float = Field(ge=0, le=MAX_MONETARY_AMOUNT)
    expenses: list[ExpenseItem] = Field(min_length=1)


class FinancialDataResponse(BaseModel):
    monthly_income: float
    monthly_savings: float
    expenses: list[ExpenseItem]
    updated_at: str


class FinancialDataDataResponse(BaseModel):
    data: FinancialDataResponse