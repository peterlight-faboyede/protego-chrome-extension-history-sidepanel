import pytest
from pydantic import ValidationError

from api.schemas import VisitCreate, VisitResponse, PaginatedVisitResponse, BatchCreateResponse


class TestVisitCreate:
    def test_valid_visit_create(self):
        data = {
            "url": "https://example.com",
            "title": "Test",
            "description": "Test description",
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        visit = VisitCreate(**data)
        assert visit.url == "https://example.com"
        assert visit.link_count == 10
    
    def test_url_trailing_slash_stripped(self):
        visit = VisitCreate(
            url="https://example.com/",
            link_count=10,
            word_count=500,
            image_count=5
        )
        assert str(visit.url) == "https://example.com"
    
    def test_invalid_url(self):
        with pytest.raises(ValidationError):
            VisitCreate(
                url="not-a-url",
                link_count=10,
                word_count=500,
                image_count=5
            )
    
    def test_negative_counts_rejected(self):
        with pytest.raises(ValidationError):
            VisitCreate(
                url="https://example.com",
                link_count=-1,
                word_count=500,
                image_count=5
            )
    
    def test_optional_fields(self):
        visit = VisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        assert visit.title is None
        assert visit.description is None


class TestPaginatedVisitResponse:
    def test_paginated_response(self):
        response = PaginatedVisitResponse(
            items=[],
            total=100,
            page=1,
            page_size=10,
            has_more=True
        )
        assert response.total == 100
        assert response.has_more is True


class TestBatchCreateResponse:
    def test_batch_response(self):
        response = BatchCreateResponse(created_count=5)
        assert response.created_count == 5

