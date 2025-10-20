from fastapi import Request
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded

from api.response import error_response
from utils.logger import logger


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(
        "Rate limit exceeded",
        extra={
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None
        }
    )
    return error_response(
        message="Too many requests. Please try again later.",
        status_code=429,
        error_codes=["rate_limit_exceeded"]
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    error_codes = []
    
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"][1:])
        message = error["msg"]
        errors.append(f"{field}: {message}" if field else message)
        error_codes.append(error["type"])
    
    logger.error(
        "Validation error",
        extra={
            "path": request.url.path,
            "errors": errors
        }
    )
    
    return error_response(
        message="Validation error",
        status_code=422,
        errors=errors,
        error_codes=error_codes
    )


async def general_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception",
        extra={
            "path": request.url.path,
            "error": str(exc),
            "type": type(exc).__name__
        },
        exc_info=True
    )
    return error_response(
        message=str(exc),
        status_code=500
    )

