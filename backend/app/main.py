from contextlib import asynccontextmanager
from typing import Iterator

# Load .env before any module-level `os.getenv(...)` calls run (notably in app.auth),
# so DATABASE_URL is consistent across the whole app instead of app.auth silently
# defaulting to a different SQLite file than everything else.
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import create_db_and_tables
from app.routes import health_router, score_router, simulate_router, financial_data_router, dashboard_router, copilot_router
from app.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> Iterator[None]:
    create_db_and_tables()
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

# CORS: only the configured frontend origin(s) may call this API — no wildcard.
# Set FRONTEND_URL in .env (comma-separated for multiple origins) to the real
# frontend origin(s) in each environment. Defaults to the local Vite dev server.
# Credentials stay disabled since auth is a Bearer header, not a browser cookie.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-financial-copliot.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(auth_router)
 

@app.get("/")
def root():
    return {"data": {"message": settings.app_name}}
