from fastapi import APIRouter, Depends, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from api.response import success_response
from api.schemas import VisitCreate, VisitResponse, PaginatedVisitResponse
from db.session import get_db
from repositories.visit_repository import VisitRepository
from services.visit_service import VisitService

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


def get_visit_service(db: Session = Depends(get_db)) -> VisitService:
    repository = VisitRepository(db)
    return VisitService(repository)


def validate_url(url: str = Query(..., min_length=1)) -> str:
    return url.rstrip("/")


@router.post("")
@limiter.limit("30/minute")
def create_visit(
        request: Request,
        visit_data: VisitCreate,
        service: VisitService = Depends(get_visit_service)
):
    visit = service.record_visit(
        url=str(visit_data.url),
        title=visit_data.title,
        description=visit_data.description,
        link_count=visit_data.link_count,
        word_count=visit_data.word_count,
        image_count=visit_data.image_count
    )
    return success_response(
        data=VisitResponse.model_validate(visit).model_dump(),
        message="Visit created successfully",
        status_code=201
    )


@router.post("/batch")
@limiter.limit("10/minute")
def create_visits_batch(
        request: Request,
        visits: list[VisitCreate],
        service: VisitService = Depends(get_visit_service)
):
    visits_data = [
        {
            'url': str(visit.url),
            'title': visit.title,
            'description': visit.description,
            'link_count': visit.link_count,
            'word_count': visit.word_count,
            'image_count': visit.image_count
        }
        for visit in visits
    ]
    created_count = service.batch_record_visits(visits_data)
    return success_response(
        data={'created_count': created_count},
        message="Visits created successfully",
        status_code=201
    )


@router.get("/history")
@limiter.limit("60/minute")
def get_visit_history(
        request: Request,
        url: str = Depends(validate_url),
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        service: VisitService = Depends(get_visit_service)
):
    visits, total = service.get_history(url, page, page_size)
    has_more = (page * page_size) < total
    
    response_data = PaginatedVisitResponse(
        items=visits,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more
    )
    
    return success_response(
        data=response_data.model_dump(),
        message="History retrieved successfully"
    )


@router.get("/metrics")
@limiter.limit("60/minute")
def get_page_metrics(
        request: Request,
        url: str = Depends(validate_url),
        service: VisitService = Depends(get_visit_service)
):
    metrics = service.get_page_metrics(url)
    return success_response(
        data=metrics,
        message="Metrics retrieved successfully"
    )
