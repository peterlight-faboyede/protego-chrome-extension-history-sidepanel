from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Index, ForeignKey
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Url(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False, unique=True, index=True)
    
    visits = relationship("Visit", back_populates="url_ref")


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    url_id = Column(Integer, ForeignKey("urls.id"), nullable=False, index=True)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    datetime_visited = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    link_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    image_count = Column(Integer, default=0)

    url_ref = relationship("Url", back_populates="visits", lazy="joined")

    @property
    def url(self) -> str:
        return self.url_ref.url

    __table_args__ = (
        Index("idx_url_id_datetime", "url_id", "datetime_visited"),
    )

