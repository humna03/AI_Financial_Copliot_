from contextlib import asynccontextmanager
from typing import Iterator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import create_db_and_tables
from app.routes import health_router, score_router, simulate_router, financial_data_router, dashboard_router, copilot_router
from app.auth import router as auth_router
app.include_router(auth_router)

@asynccontextmanager
async def lifespan(app: FastAPI) -> Iterator[None]:
    create_db_and_tables()
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)


@app.exception_handler(FastAPIHTTPException)
async def custom_http_exception_handler(request: Request, exc: FastAPIHTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        error_code = exc.detail["error"].get("code", "UNKNOWN_ERROR")
        error_message = exc.detail["error"].get("message", "")
    elif isinstance(exc.detail, list):
        error_code = "VALIDATION_ERROR"
        error_messages = [err.get("msg", str(err)) for err in exc.detail]
        error_message = "; ".join(error_messages) if error_messages else "Validation failure"
    else:
        error_code = "UNKNOWN_ERROR"
        error_message = str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": error_code, "message": error_message}},
    )


@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for err in exc.errors():
        msg = err.get("msg", str(err))
        loc = err.get("loc", [])
        # Format: "field_name: message"
        field_name = ".".join(str(p) for p in loc) if loc else "body"
        error_messages.append(f"{field_name}: {msg}")
    error_message = "; ".join(error_messages) if error_messages else "Validation failure"
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": error_message}},
    )


app.include_router(health_router, prefix="/api")
app.include_router(score_router, prefix="/api")
app.include_router(simulate_router, prefix="/api")
app.include_router(financial_data_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(copilot_router, prefix="/api")


@app.get("/")
def root():
    return {"data": {"message": settings.app_name}}
