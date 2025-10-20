from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DBAPIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from core.config import settings
from utils.logger import logger

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=2, max=10),
    retry=retry_if_exception_type((OperationalError, DBAPIError)),
    reraise=True
)
def create_db_engine():
    logger.info("Creating database engine")
    
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=3600
    )
    
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Database connection verified")
    
    return engine

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

