from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from core.config import APP_VERSION
from utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting", extra={"version": APP_VERSION})
    
    from db.session import engine
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection pool established")
    except Exception as e:
        logger.error("Failed to establish database connection pool", extra={"error": str(e)})
        raise
    
    yield
    
    logger.info("Disposing database connection pool")
    engine.dispose()
    logger.info("Application shutting down")

