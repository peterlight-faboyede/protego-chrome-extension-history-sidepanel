from datetime import datetime
from decouple import config as env_config
from pydantic import BaseModel, Field, field_validator, ValidationError
import sys

APP_VERSION = "1.0.0"
APP_TITLE = "History Sidepanel API"
start_time = datetime.now()


class Settings(BaseModel):
    database_url: str = Field(
        default_factory=lambda: env_config(
            "DATABASE_URL",
            default="postgresql://postgres:postgres@db:5432/history_db"
        )
    )
    
    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("DATABASE_URL cannot be empty")
        if not v.startswith(("postgresql://", "postgresql+psycopg2://")):
            raise ValueError("DATABASE_URL must be a valid PostgreSQL connection string")
        return v


def load_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as e:
        print("Configuration validation failed:")
        for error in e.errors():
            print(f"  {error['loc'][0]}: {error['msg']}")
        sys.exit(1)


settings = load_settings()

