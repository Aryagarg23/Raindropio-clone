from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from api.deps import get_current_user
from models.bookmark import Bookmark, CreateBookmarkRequest, BookmarkResponse
from services import bookmark_service
import uuid

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

@router.put("/{bookmark_id}", response_model=BookmarkResponse)
async def update_bookmark(
    bookmark_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    preview_image: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update a bookmark with optional image upload
    """
    user_id = current_user.get("id")
    user_role = current_user.get("role", "user")

    try:
        # If image_file is provided, upload it to storage and get URL
        final_preview_image = preview_image
        if image_file:
            # Upload file to Supabase storage
            contents = await image_file.read()
            unique_suffix = str(uuid.uuid4())
            filename = f"bookmarks/{bookmark_id}_{unique_suffix}_{image_file.filename}"

            # Upload to Supabase Storage (bucket 'nis', subfolder 'bookmarks')
            from core.supabase_client import supabase_service
            supabase = supabase_service

            try:
                upload_response = supabase.storage.from_("nis").upload(filename, contents)
                if hasattr(upload_response, 'error') and upload_response.error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Image upload failed: {upload_response.error}"
                    )

                # Get public URL
                public_url = supabase.storage.from_("nis").get_public_url(filename)
                if public_url:
                    final_preview_image = public_url.rstrip('?')

            except Exception as storage_exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Image upload failed: {str(storage_exc)}"
                )

        # Update bookmark
        bookmark = await bookmark_service.update_bookmark(
            bookmark_id=bookmark_id,
            user_id=user_id,
            title=title,
            description=description,
            preview_image=final_preview_image,
            color=color
        )

        return BookmarkResponse(bookmark=bookmark)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating bookmark: {str(e)}"
        )