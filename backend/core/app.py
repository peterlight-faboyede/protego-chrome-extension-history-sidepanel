from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from api.routes import health, visits
from core.config import APP_TITLE, APP_VERSION
from core.exceptions import (
    general_exception_handler,
    rate_limit_handler,
    validation_exception_handler,
)
from core.lifespan import lifespan
from middleware.logging import LoggingMiddleware
from middleware.security import SecurityHeadersMiddleware


def create_app() -> FastAPI:
    limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
    
    app = FastAPI(
        title=APP_TITLE,
        version=APP_VERSION,
        lifespan=lifespan
    )
    
    app.state.limiter = limiter
    
    setup_middleware(app)
    setup_exception_handlers(app)
    setup_routes(app)
    
    return app


def setup_middleware(app: FastAPI):
    # CORS must be added first (last to execute in middleware chain)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "chrome-extension://*",  # Chrome extensions
            "http://localhost:3000",  # Local development
            "http://localhost:5173",  # Vite dev server
        ],
        allow_credentials=False,  # Not needed for chrome extensions
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)


def setup_exception_handlers(app: FastAPI):
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)


def setup_routes(app: FastAPI):
    app.include_router(health.router, tags=["health"])
    app.include_router(visits.router, prefix="/api/v1/visits", tags=["visits"])

