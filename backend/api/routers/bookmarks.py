from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from api.deps import get_current_user
from models.bookmark import Bookmark, CreateBookmarkRequest, BookmarkResponse
from services import bookmark_service

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])

@router.post("/test", response_model=BookmarkResponse)
async def create_bookmark_test(request: CreateBookmarkRequest):
    """
    Create a new bookmark with content extraction (test endpoint without auth)
    """
    # Mock user for testing
    user_id = "550e8400-e29b-41d4-a716-446655440001"

    try:
        bookmark = await bookmark_service.create_bookmark(request.team_id, user_id, request)
        return BookmarkResponse(bookmark=bookmark)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating bookmark: {str(e)}"
        )

@router.post("", response_model=BookmarkResponse)
async def create_bookmark(
    request: CreateBookmarkRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new bookmark with content extraction
    """
    user_id = current_user.get("id")
    user_role = current_user.get("role", "user")

    try:
        bookmark = await bookmark_service.create_bookmark(request.team_id, user_id, request)
        return BookmarkResponse(bookmark=bookmark)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating bookmark: {str(e)}"
        )

@router.get("/team/{team_id}")
async def get_team_bookmarks(
    team_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all bookmarks for a team
    """
    user_id = current_user.get("id")
    user_role = current_user.get("role", "user")

    # TODO: Validate user has access to this team

    try:
        bookmarks = await bookmark_service.get_bookmarks_by_team(team_id)
        return {"bookmarks": bookmarks, "team_id": team_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bookmarks: {str(e)}"
        )

@router.get("/{bookmark_id}")
async def get_bookmark(
    bookmark_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a specific bookmark by ID
    """
    try:
        bookmark = await bookmark_service.get_bookmark_by_id(bookmark_id)
        if not bookmark:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bookmark not found"
            )
        return {"bookmark": bookmark}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bookmark: {str(e)}"
        )