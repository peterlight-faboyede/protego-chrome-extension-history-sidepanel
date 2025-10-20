import pytest
from datetime import datetime
from unittest.mock import patch
from pydantic import ValidationError

from core.config import APP_VERSION, APP_TITLE, start_time, Settings, load_settings


class TestConfig:
    def test_app_version(self):
        assert APP_VERSION == "1.0.0"
    
    def test_app_title(self):
        assert APP_TITLE == "History Sidepanel API"
    
    def test_start_time(self):
        assert isinstance(start_time, datetime)
        assert start_time <= datetime.now()
    
    def test_settings_default_values(self):
        with patch('core.config.env_config') as mock_env:
            mock_env.return_value = "postgresql://postgres:postgres@db:5432/history_db"
            settings = Settings()
            assert settings.database_url.startswith("postgresql://")
    
    def test_database_url_validation_empty(self):
        with pytest.raises(ValidationError) as exc_info:
            Settings(database_url="")
        assert "DATABASE_URL cannot be empty" in str(exc_info.value)
    
    def test_database_url_validation_invalid_prefix(self):
        with pytest.raises(ValidationError) as exc_info:
            Settings(database_url="mysql://localhost/test")
        assert "must be a valid PostgreSQL connection string" in str(exc_info.value)
    
    def test_database_url_validation_whitespace(self):
        with pytest.raises(ValidationError) as exc_info:
            Settings(database_url="   ")
        assert "DATABASE_URL cannot be empty" in str(exc_info.value)
    
    def test_database_url_validation_valid_psycopg2(self):
        settings = Settings(database_url="postgresql+psycopg2://user:pass@localhost/db")
        assert settings.database_url == "postgresql+psycopg2://user:pass@localhost/db"
    
    def test_load_settings_validation_error(self):
        with patch('core.config.Settings') as mock_settings:
            mock_settings.side_effect = ValidationError.from_exception_data(
                "Settings",
                [{"type": "value_error", "loc": ("database_url",), "msg": "Invalid URL", "input": "", "ctx": {"error": ValueError("test")}}]
            )
            with pytest.raises(SystemExit) as exc_info:
                load_settings()
            assert exc_info.value.code == 1

