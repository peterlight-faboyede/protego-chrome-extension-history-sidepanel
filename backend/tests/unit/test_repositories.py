import pytest

from repositories.visit_repository import VisitRepository


class TestVisitRepository:
    def test_create_visit(self, db_session):
        repo = VisitRepository(db_session)
        visit = repo.create_visit(
            url="https://example.com",
            title="Test",
            description="Test description",
            link_count=10,
            word_count=500,
            image_count=5
        )
        assert visit.id is not None
        assert visit.url == "https://example.com"
        assert visit.link_count == 10
    
    def test_get_visits_by_url(self, db_session):
        repo = VisitRepository(db_session)
        
        repo.create_visit("https://example.com", "Test 1", None, 10, 500, 5)
        repo.create_visit("https://example.com", "Test 2", None, 15, 600, 6)
        repo.create_visit("https://other.com", "Other", None, 5, 300, 3)
        
        visits, total = repo.get_visits_by_url("https://example.com", page=1, page_size=10)
        
        assert total == 2
        assert len(visits) == 2
        assert visits[0].title == "Test 2"
    
    def test_pagination(self, db_session):
        repo = VisitRepository(db_session)
        
        for i in range(25):
            repo.create_visit(f"https://example.com", f"Test {i}", None, 10, 500, 5)
        
        visits_page1, total = repo.get_visits_by_url("https://example.com", page=1, page_size=10)
        visits_page2, _ = repo.get_visits_by_url("https://example.com", page=2, page_size=10)
        
        assert total == 25
        assert len(visits_page1) == 10
        assert len(visits_page2) == 10
        assert visits_page1[0].id != visits_page2[0].id
    
    def test_get_latest_visit_by_url(self, db_session):
        repo = VisitRepository(db_session)
        
        repo.create_visit("https://example.com", "First", None, 10, 500, 5)
        repo.create_visit("https://example.com", "Latest", None, 15, 600, 6)
        
        latest = repo.get_latest_visit_by_url("https://example.com")
        
        assert latest is not None
        assert latest.title == "Latest"
    
    def test_get_metrics_by_url(self, db_session):
        repo = VisitRepository(db_session)
        
        repo.create_visit("https://example.com", "Test 1", None, 10, 500, 5)
        repo.create_visit("https://example.com", "Test 2", None, 15, 600, 6)
        repo.create_visit("https://example.com", "Test 3", None, 20, 700, 7)
        
        metrics = repo.get_metrics_by_url("https://example.com")
        
        assert metrics["total_visits"] == 3
    
    def test_bulk_create_visits(self, db_session):
        repo = VisitRepository(db_session)
        
        visits_data = [
            {"url": "https://example.com", "title": "Test 1", "description": None, 
             "link_count": 10, "word_count": 500, "image_count": 5},
            {"url": "https://example.org", "title": "Test 2", "description": None,
             "link_count": 15, "word_count": 600, "image_count": 6}
        ]
        
        count = repo.bulk_create_visits(visits_data)
        
        assert count == 2
        
        visits, total = repo.get_visits_by_url("https://example.com", page=1, page_size=10)
        assert total == 1

