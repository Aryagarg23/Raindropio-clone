# Repositories package

from .base_repository import BaseRepository
from .user_repository import UserRepository
from .team_repository import TeamRepository

# Create repository instances
user_repository = UserRepository()
team_repository = TeamRepository()

__all__ = ["BaseRepository", "UserRepository", "TeamRepository", "user_repository", "team_repository"]