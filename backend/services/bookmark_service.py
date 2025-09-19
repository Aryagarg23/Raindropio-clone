"""
Bookmark service for creating and managing bookmarks with content extraction
"""
import asyncio
import datetime
import logging
from typing import Dict, Any, Optional
from urllib.parse import urlparse

import newspaper
from newspaper import Article

from services.base_service import BaseService
from repositories.bookmark_repository import BookmarkRepository
from models.bookmark import CreateBookmarkRequest, Bookmark

logger = logging.getLogger(__name__)


class BookmarkService(BaseService):
    """
    Service for bookmark operations including content extraction
    """

    def __init__(self):
        super().__init__()
        self.bookmark_repository = BookmarkRepository()

    async def extract_content_from_url(self, url: str) -> Dict[str, Any]:
        """
        Extract title, description, and preview image from a URL

        Args:
            url: The URL to extract content from

        Returns:
            Dict containing title, description, and preview_image
        """
        try:
            logger.info(f"Extracting content from {url}")

            # Add a small delay to avoid hitting rate limits
            await asyncio.sleep(0.5)

            # Use newspaper3k for content extraction
            article = Article(url)
            article.download()
            article.parse()

            # Extract basic info
            title = article.title or "Untitled"
            description = article.meta_description or ""

            # Extract preview image
            preview_image = None
            if article.top_image:
                preview_image = article.top_image

            # Try to get favicon
            favicon_url = None
            try:
                parsed_url = urlparse(url)
                favicon_url = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"
            except:
                pass

            return {
                "title": title,
                "description": description,
                "preview_image": preview_image,
                "favicon_url": favicon_url,
                "success": True
            }

        except Exception as e:
            logger.warning(f"Content extraction failed for {url}: {str(e)}")
            # Return basic fallback data
            try:
                parsed_url = urlparse(url)
                domain = parsed_url.netloc
                return {
                    "title": f"Bookmark from {domain}",
                    "description": "",
                    "preview_image": None,
                    "favicon_url": f"{parsed_url.scheme}://{domain}/favicon.ico",
                    "success": False
                }
            except:
                return {
                    "title": "Untitled Bookmark",
                    "description": "",
                    "preview_image": None,
                    "favicon_url": None,
                    "success": False
                }

    async def create_bookmark(self, team_id: str, user_id: str, request: CreateBookmarkRequest) -> Bookmark:
        """
        Create a new bookmark with content extraction

        Args:
            team_id: The team ID
            user_id: The user ID creating the bookmark
            request: The bookmark creation request

        Returns:
            The created bookmark
        """
        # Extract content from the URL
        extracted_content = await self.extract_content_from_url(request.url)

        # Prepare bookmark data
        bookmark_data = {
            "team_id": team_id,
            "collection_id": request.collection_id,
            "url": request.url,
            "title": extracted_content["title"],
            "description": extracted_content["description"],
            "favicon_url": extracted_content["favicon_url"],
            "preview_image": extracted_content["preview_image"],
            "tags": request.tags,
            "created_by": user_id
            # Let Supabase handle created_at and updated_at timestamps
        }

        # Create the bookmark in the database
        created_record = await self.bookmark_repository.create_bookmark(bookmark_data)

        # Convert to Bookmark model
        bookmark = Bookmark(**created_record)

        logger.info(f"Created bookmark {bookmark.id} for team {team_id} by user {user_id}")
        return bookmark

    async def get_bookmarks_by_team(self, team_id: str) -> list:
        """
        Get all bookmarks for a team

        Args:
            team_id: The team ID

        Returns:
            List of bookmarks
        """
        records = await self.bookmark_repository.get_bookmarks_by_team(team_id)
        return [Bookmark(**record) for record in records]

    async def get_bookmark_by_id(self, bookmark_id: str) -> Optional[Bookmark]:
        """
        Get a bookmark by ID

        Args:
            bookmark_id: The bookmark ID

        Returns:
            The bookmark if found, None otherwise
        """
        record = await self.bookmark_repository.get_bookmark_by_id(bookmark_id)
        return Bookmark(**record) if record else None