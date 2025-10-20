from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False, index=True)  # Separate index for metrics queries
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    datetime_visited = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    link_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    image_count = Column(Integer, default=0)

    __table_args__ = (
        Index("idx_url_datetime", "url", "datetime_visited"),  # Composite index for history queries
    )

