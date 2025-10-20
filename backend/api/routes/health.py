from datetime import datetime

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text

from api.response import error_response, success_response
from core.config import APP_VERSION, start_time
from db.session import engine
from utils.logger import logger

router = APIRouter()


@router.get("/health")
def health_check():
    health_status = {
        "status": "healthy",
        "version": APP_VERSION,
        "uptime_seconds": (datetime.now() - start_time).total_seconds(),
    }
    
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        logger.error("Database health check failed", extra={"error": str(e)})
        health_status["database"] = "disconnected"
        health_status["status"] = "unhealthy"
        return error_response(
            message="Service unhealthy",
            status_code=503,
            data=health_status
        )
    
    return success_response(
        data=health_status,
        message="Service is healthy"
    )


@router.get("/")
def root():
    return success_response(
        data={"message": "History Sidepanel API"},
        message="API is running"
    )

