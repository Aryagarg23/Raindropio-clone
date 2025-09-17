from supabase import create_client, Client
from supabase.lib.client_options import SyncClientOptions
from core.config import settings
import asyncio
from functools import lru_cache
import httpx

@lru_cache(maxsize=1)
def get_supabase_service_client() -> Client:
    """Get Supabase client with service role key for admin operations

    Uses proper HTTP client configuration to avoid deprecation warnings.
    The httpx.Client is passed via SyncClientOptions to configure timeout and SSL verification.
    """
    # Create HTTP client with proper configuration
    http_client = httpx.Client(
        timeout=httpx.Timeout(30.0),
        verify=True
    )

    # Create client options with the configured HTTP client
    # This is the modern way to configure HTTP client in Supabase Python client
    options = SyncClientOptions(
        httpx_client=http_client,
        postgrest_client_timeout=30.0
    )

    client = create_client(
        settings.supabase_url,
        settings.supabase_service_key,
        options=options
    )

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