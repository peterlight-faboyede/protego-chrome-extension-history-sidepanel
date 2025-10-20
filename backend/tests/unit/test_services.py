import pytest

from repositories.visit_repository import VisitRepository
from services.visit_service import VisitService


class TestVisitService:
    def test_record_visit(self, db_session):
        repo = VisitRepository(db_session)
        service = VisitService(repo)
        
        visit = service.record_visit(
            url="https://example.com",
            title="Test",
            description="Test description",
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        assert visit.id is not None
        assert visit.url == "https://example.com"
    
    def test_get_history(self, db_session):
        repo = VisitRepository(db_session)
        service = VisitService(repo)
        
        service.record_visit("https://example.com", "Test 1", None, 10, 500, 5)
        service.record_visit("https://example.com", "Test 2", None, 15, 600, 6)
        
        visits, total = service.get_history("https://example.com", page=1, page_size=10)
        
        assert total == 2
        assert len(visits) == 2
    
    def test_get_page_metrics(self, db_session):
        repo = VisitRepository(db_session)
        service = VisitService(repo)
        
        service.record_visit("https://example.com", "Test 1", None, 10, 500, 5)
        service.record_visit("https://example.com", "Test 2", None, 15, 600, 6)
        
        metrics = service.get_page_metrics("https://example.com")
        
        assert metrics["total_visits"] == 2
    
    def test_batch_record_visits(self, db_session):
        repo = VisitRepository(db_session)
        service = VisitService(repo)
        
        visits_data = [
            {"url": "https://example.com", "title": "Test 1", "description": None,
             "link_count": 10, "word_count": 500, "image_count": 5},
            {"url": "https://example.org", "title": "Test 2", "description": None,
             "link_count": 15, "word_count": 600, "image_count": 6}
        ]
        
        count = service.batch_record_visits(visits_data)
        
        assert count == 2

