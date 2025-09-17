"""
Services package for business logic layer
"""
from .base_service import BaseService
from .user_service import UserService
from .team_service import TeamService
from .admin_service import AdminService

# Service instances (singletons)
user_service = UserService()
team_service = TeamService()
admin_service = AdminService()

__all__ = ["BaseService", "UserService", "TeamService", "AdminService", "user_service", "team_service", "admin_service"]