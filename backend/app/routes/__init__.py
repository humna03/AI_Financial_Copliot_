from app.routes.health import router as health_router
from app.routes.score import router as score_router
from app.routes.simulate import router as simulate_router
from app.routes.financial_data import router as financial_data_router
from app.routes.dashboard import router as dashboard_router
from app.routes.copilot import router as copilot_router

__all__ = ["health_router", "score_router", "simulate_router", "financial_data_router", "dashboard_router", "copilot_router"]