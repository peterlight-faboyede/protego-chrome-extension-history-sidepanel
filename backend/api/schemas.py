from datetime import datetime, timezone
from pydantic import BaseModel, HttpUrl, Field, field_validator, field_serializer
import html
import re


class VisitCreate(BaseModel):
    url: HttpUrl
    title: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=2000)
    link_count: int = Field(default=0, ge=0, le=100000)
    word_count: int = Field(default=0, ge=0, le=10000000)
    image_count: int = Field(default=0, ge=0, le=100000)

    @field_validator('url')
    @classmethod
    def normalize_url(cls, v):
        """Normalize URL: strip trailing slash, convert to lowercase domain, remove fragments"""
        if v is None:
            return v
        url_str = str(v).strip()
        # Remove trailing slash
        url_str = url_str.rstrip('/')
        # Remove fragments (but keep query params)
        url_str = re.sub(r'#.*$', '', url_str)
        return url_str
    
    @field_validator('title', 'description')
    @classmethod
    def sanitize_text(cls, v):
        """Sanitize text fields to prevent XSS attacks"""
        if v is None:
            return v
        # Escape HTML entities
        sanitized = html.escape(v.strip())
        # Remove null bytes
        sanitized = sanitized.replace('\x00', '')
        # Limit consecutive whitespace
        sanitized = re.sub(r'\s+', ' ', sanitized)
        return sanitized if sanitized else None


class VisitResponse(BaseModel):
    id: int
    url: str
    title: str | None
    description: str | None
    datetime_visited: datetime
    link_count: int
    word_count: int
    image_count: int

    @field_serializer('datetime_visited')
    def serialize_datetime(self, dt: datetime, _info):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    class Config:
        from_attributes = True


class PaginatedVisitResponse(BaseModel):
    items: list[VisitResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class MetricsResponse(BaseModel):
    total_visits: int


class BatchCreateResponse(BaseModel):
    created_count: int

