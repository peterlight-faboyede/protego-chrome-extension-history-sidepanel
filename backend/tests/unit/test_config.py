from datetime import datetime

from core.config import APP_VERSION, APP_TITLE, start_time


class TestConfig:
    def test_app_version(self):
        assert APP_VERSION == "1.0.0"
    
    def test_app_title(self):
        assert APP_TITLE == "History Sidepanel API"
    
    def test_start_time(self):
        assert isinstance(start_time, datetime)
        assert start_time <= datetime.now()

