import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    # Token cache TTL in seconds (default 300 = 5 minutes)
    TOKEN_CACHE_TTL: int = int(os.getenv("TOKEN_CACHE_TTL", "300"))
    
    @property
    def supabase_url(self) -> str:
        if not self.SUPABASE_URL:
            raise ValueError("SUPABASE_URL environment variable is required")
        return self.SUPABASE_URL
    
    @property
    def supabase_key(self) -> str:
        if not self.SUPABASE_ANON_KEY:
            raise ValueError("SUPABASE_ANON_KEY environment variable is required")
        return self.SUPABASE_ANON_KEY
    
    @property
    def supabase_service_key(self) -> str:
        if not self.SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_SERVICE_KEY environment variable is required")
        return self.SUPABASE_SERVICE_KEY

    @property
    def token_cache_ttl(self) -> int:
        """Return configured token cache TTL in seconds."""
        return int(self.TOKEN_CACHE_TTL)

settings = Settings()