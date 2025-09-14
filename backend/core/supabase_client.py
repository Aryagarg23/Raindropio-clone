from supabase import create_client, Client
from core.config import settings

def get_supabase_service_client() -> Client:
    """Get Supabase client with service role key for admin operations"""
    return create_client(settings.supabase_url, settings.supabase_service_key)

# Singleton instance
supabase_service = get_supabase_service_client()