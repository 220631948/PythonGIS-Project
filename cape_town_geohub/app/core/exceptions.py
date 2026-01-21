from fastapi.responses import JSONResponse
from starlette.requests import Request

class GeoHubException(Exception):
    """Base exception for Cape Town GeoHub."""
    def __init__(self, message: str, details: dict = None, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.details = details or {}
        self.status_code = status_code

class DataNotFoundError(GeoHubException):
    """Raised when a dataset is not found."""
    pass

class DataValidationError(GeoHubException):
    """Raised when data validation fails."""
    pass

class InvalidGeometryError(GeoHubException):
    """Raised when geometry operations fail."""
    pass

class AnalysisError(GeoHubException):
    """Raised when spatial analysis fails."""
    pass

class CacheError(GeoHubException):
    """Raised when cache operations fail."""
    pass

# FastAPI exception handlers
async def geohub_exception_handler(request: Request, exc: GeoHubException) -> JSONResponse:
    """
    Handle GeoHub exceptions and return a properly formatted JSON response.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details
        }
    )
