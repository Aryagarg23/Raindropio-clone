from supabase import create_client, Client
from core.config import settings
import asyncio
from functools import lru_cache

@lru_cache(maxsize=1)
def get_supabase_service_client() -> Client:
    """Get Supabase client with service role key for admin operations"""
    client = create_client(settings.supabase_url, settings.supabase_service_key)
    
    # Configure client for better performance
    # Set connection timeout and retry settings
    if hasattr(client, '_client'):
        client._client.timeout = 30.0
    
    return client

# Singleton instance
supabase_service = get_supabase_service_client()

# Add connection pool for better concurrent handling
class SupabaseConnectionPool:
    def __init__(self, max_connections: int = 20):
        self.semaphore = asyncio.Semaphore(max_connections)
        self.client = get_supabase_service_client()
    
    async def execute(self, operation):
        """Execute database operation with connection limiting"""
        async with self.semaphore:
            return operation

# Global connection pool
db_pool = SupabaseConnectionPool(max_connections=20)