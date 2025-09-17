from typing import Any, Dict, List, Optional
from core.supabase_client import supabase_service


class BaseRepository:
    """
    Base repository class providing common database operations.
    Abstracts data access patterns for better maintainability and testability.
    """

    def __init__(self):
        self.supabase = supabase_service

    async def execute_query(self, table: str, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Execute a query on the specified table.

        Args:
            table: The table name to query
            query: Query parameters (select, filter, etc.)

        Returns:
            List of records matching the query
        """
        try:
            response = self.supabase.table(table).select("*").match(query).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Database query failed: {str(e)}")

    async def get_by_id(self, table: str, id: str) -> Optional[Dict[str, Any]]:
        """
        Get a record by its ID.

        Args:
            table: The table name
            id: The record ID

        Returns:
            The record if found, None otherwise
        """
        try:
            response = self.supabase.table(table).select("*").eq("id", id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Database query failed: {str(e)}")

    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert a new record into the table.

        Args:
            table: The table name
            data: The data to insert

        Returns:
            The inserted record
        """
        try:
            response = self.supabase.table(table).insert(data).execute()
            return response.data[0]
        except Exception as e:
            raise Exception(f"Database insert failed: {str(e)}")

    async def update(self, table: str, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a record by its ID.

        Args:
            table: The table name
            id: The record ID
            data: The data to update

        Returns:
            The updated record
        """
        try:
            response = self.supabase.table(table).update(data).eq("id", id).execute()
            return response.data[0]
        except Exception as e:
            # Include full exception representation to help with debugging PostgREST errors
            err_repr = repr(e)
            err_str = str(e)
            # Log to stdout/stderr via print so it appears in container logs
            print(f"[BaseRepository.update] Error updating table={table} id={id} data={data}: {err_repr}")
            raise Exception(f"Database update failed: {err_str}. Full error: {err_repr}")

    async def delete(self, table: str, id: str) -> bool:
        """
        Delete a record by its ID.

        Args:
            table: The table name
            id: The record ID

        Returns:
            True if deleted, False otherwise
        """
        try:
            response = self.supabase.table(table).delete().eq("id", id).execute()
            return len(response.data) > 0
        except Exception as e:
            raise Exception(f"Database delete failed: {str(e)}")

    async def get_all(self, table: str) -> List[Dict[str, Any]]:
        """
        Get all records from a table.

        Args:
            table: The table name

        Returns:
            List of all records
        """
        try:
            response = self.supabase.table(table).select("*").execute()
            return response.data
        except Exception as e:
            raise Exception(f"Database query failed: {str(e)}")