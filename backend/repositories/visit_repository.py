from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from models.visit import Visit


class VisitRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_visit(self, url: str, title: Optional[str], description: Optional[str], 
                     link_count: int, word_count: int, image_count: int) -> Visit:
        visit = Visit(
            url=url,
            title=title,
            description=description,
            link_count=link_count,
            word_count=word_count,
            image_count=image_count
        )
        self.db.add(visit)
        self.db.commit()
        self.db.refresh(visit)
        return visit

    def get_visits_by_url(self, url: str, page: int = 1, page_size: int = 10) -> tuple[List[Visit], int]:
        query = self.db.query(Visit).filter(Visit.url == url)
        total = query.count()
        
        offset = (page - 1) * page_size
        visits = query.order_by(desc(Visit.datetime_visited)).offset(offset).limit(page_size).all()
        
        return visits, total

    def get_latest_visit_by_url(self, url: str) -> Optional[Visit]:
        return self.db.query(Visit).filter(Visit.url == url).order_by(desc(Visit.datetime_visited)).first()

    def get_metrics_by_url(self, url: str) -> dict:
        stats = self.db.query(
            func.count(Visit.id).label("total_visits")
        ).filter(Visit.url == url).first()

        return {
            "total_visits": stats.total_visits or 0
        }

    def bulk_create_visits(self, visits_data: List[dict]) -> int:
        visits = [
            Visit(
                url=data['url'],
                title=data.get('title'),
                description=data.get('description'),
                link_count=data.get('link_count', 0),
                word_count=data.get('word_count', 0),
                image_count=data.get('image_count', 0)
            )
            for data in visits_data
        ]
        self.db.bulk_save_objects(visits)
        self.db.commit()
        return len(visits)

