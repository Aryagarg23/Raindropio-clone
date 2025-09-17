"""
Unit tests for core modules
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from core.security import decode_jwt_token, get_user_from_token
from core.config import Settings
from core.db_optimizer import DatabaseOptimizer


class TestSecurity:
    """Test cases for security functions"""

    @pytest.mark.unit
    def test_decode_jwt_token_success(self):
        """Test successful JWT token decoding"""
        mock_user_data = {
            "id": "test-user-id",
            "email": "test@example.com",
            "user_metadata": {"full_name": "Test User"}
        }

        with patch("core.security.requests.get") as mock_get:
            # Mock successful response
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_user_data
            mock_get.return_value = mock_response

            with patch("core.security.token_cache", {}):  # Clear cache
                result = decode_jwt_token("mock-token")

        assert result["id"] == mock_user_data["id"]
        assert result["email"] == mock_user_data["email"]

    @pytest.mark.unit
    def test_decode_jwt_token_cached(self):
        """Test JWT token decoding with caching"""
        mock_user_data = {
            "id": "cached-user-id",
            "email": "cached@example.com"
        }

        # Pre-populate cache
        from core.security import token_cache
        token_hash = "mock-token-hash"
        token_cache[token_hash] = (mock_user_data, 9999999999)  # Future timestamp

        with patch("core.security.get_token_hash", return_value=token_hash):
            result = decode_jwt_token("mock-token")

        assert result["id"] == mock_user_data["id"]
        assert result["email"] == mock_user_data["email"]

    @pytest.mark.unit
    def test_decode_jwt_token_invalid(self):
        """Test JWT token decoding with invalid token"""
        with patch("core.security.requests.get") as mock_get:
            # Mock failed response
            mock_response = Mock()
            mock_response.status_code = 401
            mock_response.text = "Invalid token"
            mock_get.return_value = mock_response

            with pytest.raises(Exception):  # Should raise HTTPException
                decode_jwt_token("invalid-token")

    @pytest.mark.unit
    def test_get_user_from_token(self):
        """Test getting user data from token"""
        mock_user_data = {
            "id": "test-user-id",
            "email": "test@example.com"
        }

        with patch("core.security.decode_jwt_token", return_value=mock_user_data):
            result = get_user_from_token("mock-token")

        assert result["id"] == mock_user_data["id"]
        assert result["email"] == mock_user_data["email"]


class TestConfig:
    """Test cases for configuration"""

    @pytest.mark.unit
    def test_settings_with_env_vars(self, monkeypatch):
        """Test settings with environment variables"""
        # Clear existing env vars first
        monkeypatch.delenv("SUPABASE_URL", raising=False)
        monkeypatch.delenv("SUPABASE_KEY", raising=False)
        monkeypatch.delenv("FRONTEND_URL", raising=False)
        
        # Set test values
        monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
        monkeypatch.setenv("SUPABASE_KEY", "test-key")
        monkeypatch.setenv("FRONTEND_URL", "https://test.com")

        # Force reload of settings
        import importlib
        import core.config
        importlib.reload(core.config)
        from core.config import Settings
        
        settings = Settings()

        assert settings.SUPABASE_URL == "https://test.supabase.co"
        assert settings.supabase_service_key == "test-key"
        assert settings.FRONTEND_URL == "https://test.com"

    @pytest.mark.unit
    def test_settings_missing_required(self, monkeypatch):
        """Test settings with missing required variables"""
        # Mock os.getenv to return empty strings
        monkeypatch.setattr("os.getenv", lambda key, default="": "" if key in ["SUPABASE_URL", "SUPABASE_KEY"] else default)
        
        # Force reload of settings
        import importlib
        import core.config
        importlib.reload(core.config)
        from core.config import Settings
        
        settings = Settings()

        with pytest.raises(ValueError):
            _ = settings.supabase_url

        with pytest.raises(ValueError):
            _ = settings.supabase_service_key


class TestDatabaseOptimizer:
    """Test cases for database optimization"""

    @pytest.mark.unit
    def test_execute_with_limit_success(self):
        """Test successful database operation with optimization"""
        optimizer = DatabaseOptimizer()

        async def mock_operation():
            return "success"

        import asyncio
        result = asyncio.run(optimizer.execute_with_limit(mock_operation))

        assert result == "success"
        assert optimizer.stats["total_queries"] == 1
        assert optimizer.stats["successful_queries"] == 1

    @pytest.mark.unit
    def test_execute_with_limit_timeout(self):
        """Test database operation timeout"""
        optimizer = DatabaseOptimizer(query_timeout=0.1)

        async def slow_operation():
            await asyncio.sleep(0.2)  # Longer than timeout
            return "should not reach here"

        import asyncio
        with pytest.raises(asyncio.TimeoutError):
            asyncio.run(optimizer.execute_with_limit(slow_operation))

        assert optimizer.stats["timeout_queries"] == 1

    @pytest.mark.unit
    def test_get_stats(self):
        """Test getting optimizer statistics"""
        optimizer = DatabaseOptimizer()

        stats = optimizer.get_stats()

        assert "total_queries" in stats
        assert "successful_queries" in stats
        assert "failed_queries" in stats
        assert "success_rate" in stats
        assert "current_concurrent_queries" in stats
        assert "max_concurrent_queries" in stats