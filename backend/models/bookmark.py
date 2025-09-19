from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Bookmark(BaseModel):
    id: Optional[str] = None
    team_id: str
    collection_id: Optional[str] = None
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    favicon_url: Optional[str] = None
    preview_image: Optional[str] = None
    tags: List[str] = []
    color: Optional[str] = None
    created_by: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateBookmarkRequest(BaseModel):
    team_id: str
    url: str
    collection_id: Optional[str] = None
    tags: List[str] = []
    color: Optional[str] = None

class BookmarkResponse(BaseModel):
    bookmark: Bookmark
    message: str = "Bookmark created successfully"