import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_KEY", "")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    
    @property
    def supabase_url(self) -> str:
        if not self.SUPABASE_URL:
            raise ValueError("SUPABASE_URL environment variable is required")
        return self.SUPABASE_URL
    
    @property
    def supabase_service_key(self) -> str:
        if not self.SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_KEY environment variable is required")
        return self.SUPABASE_SERVICE_KEY

settings = Settings()