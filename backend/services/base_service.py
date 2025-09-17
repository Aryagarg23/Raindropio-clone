"""
Base service class and common service functionality
"""
import asyncio
from typing import Any, Dict, List, Optional, TypeVar, Generic
from abc import ABC, abstractmethod
from core.supabase_client import supabase_service
from core.db_optimizer import with_db_optimization
from repositories import user_repository, team_repository

T = TypeVar('T')

class BaseService(ABC):
    """
    Base service class providing common database operations and patterns
    """

    def __init__(self):
        self.supabase = supabase_service
        # Repository instances for data access abstraction
        self.user_repository = user_repository
        self.team_repository = team_repository

    @with_db_optimization
    async def _execute_query(self, query_func, *args, **kwargs):
        """
        Execute a database query with optimization
        """
        # Run sync Supabase query in thread pool to avoid blocking
        return await asyncio.to_thread(query_func, *args, **kwargs)

    async def _select_one(self, table: str, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Select a single record from a table
        """
        query = self.supabase.table(table).select("*")
        for key, value in filters.items():
            query = query.eq(key, value)

        result = await self._execute_query(query.execute)
        return result.data[0] if result.data else None

    async def _select_many(self, table: str, filters: Optional[Dict[str, Any]] = None,
                          limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Select multiple records from a table
        """
        query = self.supabase.table(table).select("*")
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        if limit:
            query = query.limit(limit)

        result = await self._execute_query(query.execute)
        return result.data or []

    async def _insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert a record into a table
        """
        result = await self._execute_query(
            self.supabase.table(table).insert(data).execute
        )
        return result.data[0] if result.data else {}

    async def _update(self, table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update records in a table
        """
        query = self.supabase.table(table).update(data)
        for key, value in filters.items():
            query = query.eq(key, value)

        result = await self._execute_query(query.execute)
        return result.data[0] if result.data else {}

    async def _upsert(self, table: str, data: Dict[str, Any], on_conflict: str) -> Dict[str, Any]:
        """
        Upsert a record in a table
        """
        result = await self._execute_query(
            self.supabase.table(table).upsert(data, on_conflict=on_conflict).execute
        )
        return result.data[0] if result.data else {}

    async def _delete(self, table: str, filters: Dict[str, Any]) -> bool:
        """
        Delete records from a table
        """
    async def _delete(self, table: str, filters: Dict[str, Any]) -> bool:
        """
        Delete records from a table
        """
        query = self.supabase.table(table).delete()
        for key, value in filters.items():
            query = query.eq(key, value)

        result = await self._execute_query(query.execute)
        return len(result.data) > 0 if result.data else False