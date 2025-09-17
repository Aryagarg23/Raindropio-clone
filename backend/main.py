from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from api.routers import users, teams, admin, content
from core.config import settings
from core.logging import setup_logging, get_logger
from core.rate_limiting import RateLimitMiddleware
from core.security_headers import SecurityHeadersMiddleware
from core.exceptions import BusinessLogicError
import asyncio

# Setup structured logging
setup_logging()
logger = get_logger(__name__)

app = FastAPI(
    title="Raindropio Clone API", 
    version="1.0.0",
    # Optimize for concurrent requests
    docs_url="/docs" if getattr(settings, 'DEBUG', False) else None,
    redoc_url="/redoc" if getattr(settings, 'DEBUG', False) else None,
)

# Configure allowed origins from environment
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",  # Local development fallback
    "https://localhost:3000",  # HTTPS local development
    "https://raindropio-clone.vercel.app",  # Production frontend
    "http://127.0.0.1:3000",  # Alternative local development
]

# Remove any empty strings from the list
allowed_origins = [origin for origin in allowed_origins if origin and origin.strip()]

print(f"🌐 CORS allowed origins: {allowed_origins}")

# Add CORS middleware with more specific configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "accept",
        "accept-encoding", 
        "authorization",
        "content-type",
        "dnt",
        "origin",
        "user-agent",
        "x-csrftoken",
        "x-requested-with",
    ],
    expose_headers=["*"],
)

# Add middleware for request timeout and concurrency control
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time

class TimeoutMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, timeout: float = 30.0):
        super().__init__(app)
        self.timeout = timeout

    async def dispatch(self, request: Request, call_next):
        try:
            return await asyncio.wait_for(call_next(request), timeout=self.timeout)
        except asyncio.TimeoutError:
            return Response("Request timeout", status_code=504)

# Add timeout middleware
app.add_middleware(TimeoutMiddleware, timeout=30.0)

# Add rate limiting middleware (60 requests per minute)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Custom exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with detailed information"""
    logger.warning("Validation error",
                 path=request.url.path,
                 method=request.method,
                 errors=exc.errors(),
                 body=exc.body if hasattr(exc, 'body') else None)

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "details": exc.errors()
            }
        }
    )

@app.exception_handler(BusinessLogicError)
async def business_logic_exception_handler(request: Request, exc: BusinessLogicError):
    """Handle business logic exceptions with structured error responses"""
    logger.warning("Business logic error",
                 path=request.url.path,
                 method=request.method,
                 error_code=exc.error_code,
                 status_code=exc.status_code,
                 details=exc.details)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "details": exc.details
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error("Unexpected error",
                extra={
                    "extra_fields": {
                        "path": request.url.path,
                        "method": request.method,
                        "error": str(exc)
                    }
                },
                exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        }
    )

# Include routers
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(admin.router)
app.include_router(content.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "API is running!"}

@app.get("/cors-test")
def cors_test():
    """Test endpoint for CORS debugging"""
    return {
        "status": "ok", 
        "message": "CORS is working!",
        "allowed_origins": allowed_origins
    }

@app.get("/health")
async def health():
    """Health check with performance metrics"""
    from core.db_optimizer import check_database_health
    
    try:
        # Check database health
        db_health = await check_database_health()
        
        logger.info("Health check performed", status="ok", database_status=db_health)
        
        return {
            "status": "ok",
            "timestamp": asyncio.get_event_loop().time(),
            "database": db_health,
            "api_version": "1.0.0"
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": asyncio.get_event_loop().time()
        }

@app.get("/metrics")
async def metrics():
    """Performance metrics endpoint"""
    from core.db_optimizer import db_optimizer
    from core.security import token_cache
    
    return {
        "database": db_optimizer.get_stats(),
        "auth_cache": {
            "cached_tokens": len(token_cache),
            "cache_hit_rate": "N/A"  # Could be implemented with more detailed tracking
        },
        "system": {
            "active_tasks": len(asyncio.all_tasks()),
        }
    }
