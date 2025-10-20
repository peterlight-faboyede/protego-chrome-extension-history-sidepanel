from typing import List, Optional
from repositories.visit_repository import VisitRepository
from models.visit import Visit


class VisitService:
    def __init__(self, repository: VisitRepository):
        self.repository = repository

    def record_visit(self, url: str, title: Optional[str], description: Optional[str],
                     link_count: int, word_count: int, image_count: int) -> Visit:
        return self.repository.create_visit(url, title, description, link_count, word_count, image_count)

    def get_history(self, url: str, page: int = 1, page_size: int = 10) -> tuple[List[Visit], int]:
        return self.repository.get_visits_by_url(url, page, page_size)

    def get_page_metrics(self, url: str) -> dict:
        return self.repository.get_metrics_by_url(url)

    def batch_record_visits(self, visits_data: List[dict]) -> int:
        return self.repository.bulk_create_visits(visits_data)

