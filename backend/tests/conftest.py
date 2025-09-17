"""
Shared test fixtures and configuration for all tests
"""
import pytest
from unittest.mock import Mock, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from supabase import Client
import sys
import os
import asyncio

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing"""
    mock_client = Mock(spec=Client)

    # Mock table operations
    mock_table = Mock()
    mock_client.table.return_value = mock_table

    # Mock select operations
    mock_select = Mock()
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_select
    mock_select.in_.return_value = mock_select
    mock_select.execute.return_value = Mock(data=[], count=None)

    # Mock insert operations
    mock_insert = Mock()
    mock_table.insert.return_value = mock_insert
    mock_insert.execute.return_value = Mock(data=[{"id": "test-id"}])

    # Mock update operations
    mock_update = Mock()
    mock_table.update.return_value = mock_update
    mock_update.eq.return_value = mock_update
    mock_update.execute.return_value = Mock(data=[{"id": "test-id"}])

    # Mock delete operations
    mock_delete = Mock()
    mock_table.delete.return_value = mock_delete
    mock_delete.match.return_value = mock_delete
    mock_delete.execute.return_value = Mock(data=[{"id": "test-id"}])

    # Mock upsert operations
    mock_upsert = Mock()
    mock_table.upsert.return_value = mock_upsert
    mock_upsert.execute.return_value = Mock(data=[{"id": "test-id"}])

    # Mock storage operations
    mock_storage = Mock()
    mock_client.storage.from_.return_value = mock_storage
    mock_storage.upload.return_value = Mock()
    mock_storage.get_public_url.return_value = "https://test-url.com/file.jpg"

@pytest.fixture
def mock_user_repository(mock_supabase_client):
    """Mock user repository for testing"""
    from repositories.user_repository import UserRepository

    # Create a mock repository instance
    mock_repo = Mock(spec=UserRepository)
    mock_repo.supabase = mock_supabase_client

    # Mock methods with proper return values
    mock_repo.get_user_profile = AsyncMock(return_value=None)
    mock_repo.upsert_user_profile = AsyncMock()
    mock_repo.update_user_profile = AsyncMock()

    return mock_repo


@pytest.fixture
def mock_team_repository(mock_supabase_client):
    """Mock team repository for testing"""
    from repositories.team_repository import TeamRepository

    # Create a mock repository instance
    mock_repo = Mock(spec=TeamRepository)
    mock_repo.supabase = mock_supabase_client

    # Mock methods
    mock_repo.get_user_teams = AsyncMock(return_value=[])
    mock_repo.get_team_members = AsyncMock(return_value=[])
    mock_repo.create_team = AsyncMock(return_value={"id": "test-team-id"})
    mock_repo.update_team = AsyncMock(return_value={"id": "test-team-id"})
    mock_repo.delete_team = AsyncMock(return_value=True)
    mock_repo.add_team_member = AsyncMock(return_value={"id": "test-membership-id"})
    mock_repo.remove_team_member = AsyncMock(return_value=True)

    return mock_repo


@pytest.fixture
def mock_current_user():
    """Mock authenticated user data"""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "user_metadata": {
            "full_name": "Test User",
            "avatar_url": "https://example.com/avatar.jpg",
            "favorite_color": "blue"
        },
        "role": "user"
    }


@pytest.fixture
def mock_admin_user():
    """Mock admin user data"""
    return {
        "id": "admin-user-id",
        "email": "admin@example.com",
        "user_metadata": {
            "full_name": "Admin User",
            "avatar_url": "https://example.com/admin-avatar.jpg",
            "favorite_color": "red"
        },
        "role": "admin"
    }


@pytest.fixture
def test_app(mock_supabase_client, mock_user_repository, mock_team_repository, monkeypatch):
    """Create test FastAPI app with mocked dependencies"""
    # Mock the supabase client import
    monkeypatch.setattr("core.supabase_client.get_supabase_service_client", lambda: mock_supabase_client)
    monkeypatch.setattr("core.supabase_client.supabase_service", mock_supabase_client)

    # Mock repository instances in services
    monkeypatch.setattr("services.base_service.user_repository", mock_user_repository)
    monkeypatch.setattr("services.base_service.team_repository", mock_team_repository)
    monkeypatch.setattr("services.user_service.user_repository", mock_user_repository)
    monkeypatch.setattr("services.team_service.team_repository", mock_team_repository)
    monkeypatch.setattr("services.admin_service.user_repository", mock_user_repository)
    monkeypatch.setattr("services.admin_service.team_repository", mock_team_repository)

    # Mock the database health check
    async def mock_check_database_health():
        return {
            "status": "healthy",
            "response_time": 0.1,
            "connection_active": True,
            "stats": {"test": "data"}
        }
    
    monkeypatch.setattr("core.db_optimizer.check_database_health", mock_check_database_health)

    # Import app after mocking
    from main import app
    return app


@pytest.fixture
def client(test_app):
    """Test client for FastAPI app"""
    return TestClient(test_app)


@pytest.fixture
def auth_headers(mock_current_user):
    """Authorization headers for authenticated requests"""
    # Mock JWT token - in real tests this would be a proper JWT
    return {"Authorization": f"Bearer mock-jwt-token-{mock_current_user['id']}"}


@pytest.fixture
def admin_auth_headers(mock_admin_user):
    """Authorization headers for admin requests"""
    return {"Authorization": f"Bearer mock-jwt-token-{mock_admin_user['id']}"}


@pytest.fixture
def sample_user_profile():
    """Sample user profile data"""
    return {
        "user_id": "test-user-id",
        "email": "test@example.com",
        "full_name": "Test User",
        "avatar_url": "https://example.com/avatar.jpg",
        "favorite_color": "blue",
        "role": "user",
        "created_at": "2023-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_team():
    """Sample team data"""
    return {
        "id": "test-team-id",
        "name": "Test Team",
        "description": "A test team",
        "logo_url": "https://example.com/logo.jpg",
        "created_at": "2023-01-01T00:00:00Z",
        "created_by": "test-user-id"
    }


@pytest.fixture
def sample_team_membership():
    """Sample team membership data"""
    return {
        "id": "test-membership-id",
        "team_id": "test-team-id",
        "user_id": "test-user-id",
        "role": "member",
        "joined_at": "2023-01-01T00:00:00Z"
    }


@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()