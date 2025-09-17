"""
Unit tests for users router endpoints
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException
import asyncio


class TestUserSync:
    """Test cases for user profile synchronization"""

    @pytest.mark.asyncio
    async def test_sync_user_profile_success(self, test_app, mock_user_repository, mock_current_user):
        """Test successful user profile sync"""
        from api.routers.users import sync_user_profile

        # Mock repository methods
        mock_user_repository.get_user_profile.return_value = None
        mock_user_repository.upsert_user_profile.return_value = {
            "user_id": mock_current_user["id"],
            "email": mock_current_user["email"],
            "full_name": mock_current_user["user_metadata"]["full_name"],
            "avatar_url": mock_current_user["user_metadata"]["avatar_url"],
            "favorite_color": mock_current_user["user_metadata"]["favorite_color"],
            "role": "user",
            "created_at": "2023-01-01T00:00:00Z"
        }

        response = await sync_user_profile(mock_current_user)

        assert response.profile.user_id == mock_current_user["id"]
        assert response.profile.email == mock_current_user["email"]
        assert response.message == "Profile synced successfully"

    @pytest.mark.asyncio
    async def test_sync_user_profile_existing(self, test_app, mock_user_repository, mock_current_user, sample_user_profile):
        """Test sync when profile already exists"""
        from api.routers.users import sync_user_profile

        # Mock existing profile found
        mock_user_repository.get_user_profile.return_value = sample_user_profile

        response = await sync_user_profile(mock_current_user)

        assert response.profile.user_id == sample_user_profile["user_id"]
        assert response.message == "Profile synced successfully"

    @pytest.mark.asyncio
    async def test_sync_user_profile_invalid_data(self, test_app, mock_current_user):
        """Test sync with invalid user data"""
        from api.routers.users import sync_user_profile

        invalid_user = {"id": None, "email": None}

        with pytest.raises(HTTPException) as exc_info:
            await sync_user_profile(invalid_user)

        assert exc_info.value.status_code == 400
        assert "Invalid user data" in exc_info.value.detail


class TestUserProfileUpdate:
    """Test cases for user profile updates"""

    @pytest.mark.asyncio
    async def test_update_profile_success(self, test_app, mock_user_repository, mock_current_user, sample_user_profile):
        """Test successful profile update"""
        from api.routers.users import update_profile

        # Mock repository methods
        updated_profile = {
            **sample_user_profile,
            "full_name": "Updated Name",
            "favorite_color": "green"
        }

        # Mock the sequence: get_user_profile (existing), update_user_profile, get_user_profile (verify)
        mock_user_repository.get_user_profile.side_effect = [sample_user_profile, updated_profile]
        mock_user_repository.update_user_profile.return_value = updated_profile

        response = await update_profile(
            full_name="Updated Name",
            favorite_color="green",
            avatar=None,
            current_user=mock_current_user
        )

        assert response.message == "Profile synced successfully"

    @pytest.mark.asyncio
    async def test_update_profile_not_found(self, mock_supabase_client, mock_current_user):
        """Test update when profile not found"""
        from api.routers.users import update_profile
        
    @pytest.mark.asyncio
    async def test_update_profile_not_found(self, test_app, mock_user_repository, mock_current_user):
        """Test update when profile not found"""
        from api.routers.users import update_profile

        # Mock profile not found
        mock_user_repository.get_user_profile.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await update_profile(
                full_name="Test Name",
                favorite_color="blue",
                avatar=None,
                current_user=mock_current_user
            )

        assert exc_info.value.status_code == 404
        assert "Profile not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_update_profile_with_avatar(self, test_app, mock_supabase_client, mock_user_repository, mock_current_user, sample_user_profile):
        """Test profile update with avatar upload"""
        from api.routers.users import update_profile

        # Mock file upload
        mock_file = Mock()
        mock_file.read = AsyncMock(return_value=b"fake image data")
        mock_file.filename = "test.jpg"

        # Mock profile operations
        updated_profile = {
            **sample_user_profile,
            "full_name": "Test Name",
            "avatar_url": "https://test-storage.com/avatars/test-user-id_test.jpg"
        }

        # Mock repository methods
        mock_user_repository.get_user_profile.side_effect = [sample_user_profile, updated_profile]
        mock_user_repository.update_user_profile.return_value = updated_profile

    @pytest.mark.asyncio
    async def test_update_profile_with_avatar(self, test_app, mock_user_repository, mock_current_user, sample_user_profile):
        """Test profile update with avatar upload"""
        from api.routers.users import update_profile

        # Mock file upload
        mock_file = Mock()
        mock_file.read = AsyncMock(return_value=b"fake image data")
        mock_file.filename = "test.jpg"

        # Mock profile operations
        updated_profile = {
            **sample_user_profile,
            "full_name": "Test Name",
            "avatar_url": "https://test-storage.com/avatars/test-user-id_test.jpg"
        }

        # Mock repository methods
        mock_user_repository.get_user_profile.side_effect = [sample_user_profile, updated_profile]
        mock_user_repository.update_user_profile.return_value = updated_profile

        # Create a mock supabase client for storage operations
        mock_storage_client = Mock()
        mock_storage_client.storage.from_.return_value.upload.return_value = Mock(error=None)
        mock_storage_client.storage.from_.return_value.get_public_url.return_value = "https://test-storage.com/avatars/test-user-id_test.jpg"

        # Patch the supabase client in the service for storage operations
        with patch("services.user_service.supabase", mock_storage_client):
            response = await update_profile(
                full_name="Test Name",
                favorite_color="blue",
                avatar=mock_file,
                current_user=mock_current_user
            )

        assert response.message == "Profile synced successfully"
        # Verify storage upload was called
        mock_storage_client.storage.from_.assert_called_with("nis")
        mock_storage_client.storage.from_().upload.assert_called_once()