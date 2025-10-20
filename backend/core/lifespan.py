from contextlib import asynccontextmanager

from fastapi import FastAPI

from core.config import APP_VERSION
from utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting", extra={"version": APP_VERSION})
    yield
    logger.info("Application shutting down")

