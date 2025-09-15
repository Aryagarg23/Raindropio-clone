"""
Database optimization utilities for handling concurrent requests
"""

import asyncio
from typing import Any, Callable, Optional
from functools import wraps
import time
import logging

logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    """Utility class for optimizing database operations"""
    
    def __init__(self, max_concurrent_queries: int = 20, query_timeout: float = 30.0):
        self.semaphore = asyncio.Semaphore(max_concurrent_queries)
        self.query_timeout = query_timeout
        self.stats = {
            'total_queries': 0,
            'successful_queries': 0,
            'failed_queries': 0,
            'timeout_queries': 0,
            'avg_response_time': 0.0
        }
        self.response_times = []
    
    async def execute_with_limit(self, operation: Callable, *args, **kwargs) -> Any:
        """Execute database operation with concurrency limiting and timeout"""
        start_time = time.time()
        self.stats['total_queries'] += 1
        
        try:
            async with self.semaphore:
                # Execute with timeout
                result = await asyncio.wait_for(
                    operation(*args, **kwargs), 
                    timeout=self.query_timeout
                )
                
                # Track success
                self.stats['successful_queries'] += 1
                response_time = time.time() - start_time
                self.response_times.append(response_time)
                
                # Keep only last 100 response times for average calculation
                if len(self.response_times) > 100:
                    self.response_times = self.response_times[-100:]
                
                self.stats['avg_response_time'] = sum(self.response_times) / len(self.response_times)
                
                logger.debug(f"Database query completed in {response_time:.3f}s")
                return result
                
        except asyncio.TimeoutError:
            self.stats['timeout_queries'] += 1
            logger.error(f"Database query timed out after {self.query_timeout}s")
            raise
        except Exception as e:
            self.stats['failed_queries'] += 1
            logger.error(f"Database query failed: {str(e)}")
            raise
    
    def get_stats(self) -> dict:
        """Get current performance statistics"""
        return {
            **self.stats,
            'success_rate': (self.stats['successful_queries'] / max(self.stats['total_queries'], 1)) * 100,
            'current_concurrent_queries': self.semaphore._value,
            'max_concurrent_queries': self.semaphore._bound_value
        }

# Global database optimizer instance
db_optimizer = DatabaseOptimizer()

def with_db_optimization(func):
    """Decorator to apply database optimization to async functions"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        return await db_optimizer.execute_with_limit(func, *args, **kwargs)
    return wrapper

# Health check for database performance
async def check_database_health() -> dict:
    """Check database connection health and performance"""
    try:
        from core.supabase_client import supabase_service
        
        start_time = time.time()
        # Simple query to check connection
        result = supabase_service.table("profiles").select("count", count="exact").limit(1).execute()
        response_time = time.time() - start_time
        
        return {
            "status": "healthy",
            "response_time": response_time,
            "connection_active": True,
            "stats": db_optimizer.get_stats()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "connection_active": False,
            "stats": db_optimizer.get_stats()
        }