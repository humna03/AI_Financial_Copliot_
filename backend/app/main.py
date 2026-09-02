from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.database import create_db_and_tables
from app.routes import health_router, score_router, simulate_router, financial_data_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

app.include_router(health_router, prefix="/api")
app.include_router(score_router, prefix="/api")
app.include_router(simulate_router, prefix="/api")
app.include_router(financial_data_router, prefix="/api")


@app.get("/")
def root():
    return {"data": {"message": settings.app_name}}
