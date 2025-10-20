from typing import Any, Optional
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Any = None
    errors: Optional[list[str]] = None
    error_codes: Optional[list[str]] = None


def success_response(data: Any, message: str = "Success", status_code: int = 200) -> JSONResponse:
    response_data = ApiResponse(
        success=True,
        message=message,
        data=data,
    ).model_dump(exclude_none=True)
    
    return JSONResponse(
        content=response_data,
        status_code=status_code
    )


def error_response(
    message: str,
    status_code: int = 400,
    errors: Optional[list[str]] = None,
    error_codes: Optional[list[str]] = None
) -> JSONResponse:
    response_data = ApiResponse(
        success=False,
        message=message,
        errors=errors,
        error_codes=error_codes
    ).model_dump(exclude_none=True)
    
    return JSONResponse(
        content=response_data,
        status_code=status_code
    )

