"""
Dual Database Service for PostgreSQL and Supabase
Handles data synchronization between primary Supabase and backup PostgreSQL databases
"""

import os
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import json
from flask import current_app

from .extensions import db, supabase

logger = logging.getLogger(__name__)

class DualDatabaseService:
    """Service for managing dual database operations"""

    def __init__(self):
        self.supabase_primary = True  # Supabase is primary, PostgreSQL is backup
        self.postgres_backup = True   # PostgreSQL serves as backup
        self.sync_enabled = os.getenv('DUAL_DB_SYNC_ENABLED', 'true').lower() == 'true'

    def is_supabase_available(self) -> bool:
        """Check if Supabase is available"""
        return supabase is not None

    def is_postgres_available(self) -> bool:
        """Check if PostgreSQL is available"""
        try:
            db.session.execute(db.text('SELECT 1'))
            return True
        except Exception as e:
            logger.error(f"PostgreSQL connection check failed: {e}")
            return False

    def get_table_mapping(self) -> Dict[str, str]:
        """Get mapping of model names to Supabase table names"""
        return {
            'User': 'users',
            'UserProgress': 'user_progress',
            'RiskPlan': 'risk_plans',
            'Signal': 'signals',
            'UserSignal': 'user_signals',
            'PropFirm': 'prop_firms',
            'Payment': 'payments',
            'Subscription': 'subscriptions'
        }

    def convert_sqlalchemy_to_supabase(self, model_instance) -> Dict[str, Any]:
        """Convert SQLAlchemy model instance to Supabase-compatible dict"""
        data = {}
        for column in model_instance.__table__.columns:
            value = getattr(model_instance, column.name)
            # Convert datetime objects to ISO strings
            if isinstance(value, datetime):
                value = value.isoformat()
            # Convert UUID objects to strings
            elif hasattr(value, '__class__') and 'UUID' in str(type(value)):
                value = str(value)
            # Convert JSON fields
            elif hasattr(value, '__dict__') or isinstance(value, (list, dict)):
                value = json.dumps(value) if isinstance(value, (list, dict)) else str(value)
            # Handle decimal/numeric types
            elif hasattr(value, '__class__') and 'Decimal' in str(type(value)):
                value = float(value)
            data[column.name] = value
        return data

    def convert_supabase_to_sqlalchemy(self, table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Supabase data to SQLAlchemy-compatible format"""
        # Convert ISO strings back to datetime if needed
        for key, value in data.items():
            if isinstance(value, str) and 'T' in value and 'Z' in value:
                try:
                    data[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass  # Keep as string if conversion fails
        return data

    async def write_to_supabase(self, table: str, data: Dict[str, Any], operation: str = 'insert') -> bool:
        """Write data to Supabase"""
        if not self.is_supabase_available():
            logger.warning("Supabase not available for write operation")
            return False

        try:
            if operation == 'insert':
                result = supabase.table(table).insert(data).execute()
            elif operation == 'update':
                # Assume data has an 'id' field for updates
                if 'id' in data:
                    result = supabase.table(table).update(data).eq('id', data['id']).execute()
                else:
                    logger.error("Update operation requires 'id' field")
                    return False
            elif operation == 'upsert':
                result = supabase.table(table).upsert(data).execute()
            else:
                logger.error(f"Unsupported operation: {operation}")
                return False

            logger.info(f"Successfully wrote to Supabase table '{table}' with operation '{operation}'")
            return True
        except Exception as e:
            logger.error(f"Failed to write to Supabase table '{table}': {e}")
            return False

    def write_to_postgres(self, model_instance, operation: str = 'insert') -> bool:
        """Write data to PostgreSQL"""
        if not self.is_postgres_available():
            logger.warning("PostgreSQL not available for write operation")
            return False

        try:
            if operation == 'insert':
                db.session.add(model_instance)
            elif operation == 'update':
                # Model instance should already be updated
                pass
            # Commit the changes
            db.session.commit()
            logger.info(f"Successfully wrote to PostgreSQL with operation '{operation}'")
            return True
        except Exception as e:
            logger.error(f"Failed to write to PostgreSQL: {e}")
            db.session.rollback()
            return False

    async def dual_write(self, model_instance, operation: str = 'insert') -> Dict[str, bool]:
        """
        Write to both databases with Supabase as primary
        Returns dict with success status for each database
        """
        results = {
            'supabase': False,
            'postgres': False,
            'overall': False
        }

        table_mapping = self.get_table_mapping()
        model_name = model_instance.__class__.__name__

        if model_name not in table_mapping:
            logger.warning(f"No table mapping found for model: {model_name}")
            return results

        supabase_table = table_mapping[model_name]
        supabase_data = self.convert_sqlalchemy_to_supabase(model_instance)

        # Write to Supabase first (primary)
        if self.supabase_primary:
            results['supabase'] = await self.write_to_supabase(supabase_table, supabase_data, operation)

        # Write to PostgreSQL (backup)
        if self.postgres_backup:
            results['postgres'] = self.write_to_postgres(model_instance, operation)

        # Overall success: Supabase success (since it's primary) OR both success
        results['overall'] = results['supabase'] or (results['supabase'] and results['postgres'])

        if results['overall']:
            logger.info(f"Dual write successful: Supabase={results['supabase']}, PostgreSQL={results['postgres']}")
        else:
            logger.error(f"Dual write failed: Supabase={results['supabase']}, PostgreSQL={results['postgres']}")

        return results

    async def read_from_supabase(self, table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Read data from Supabase"""
        if not self.is_supabase_available():
            logger.warning("Supabase not available for read operation")
            return []

        try:
            query = supabase.table(table).select('*')
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)

            result = query.execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to read from Supabase table '{table}': {e}")
            return []

    def read_from_postgres(self, model_class, filters: Optional[Dict[str, Any]] = None) -> List[Any]:
        """Read data from PostgreSQL"""
        if not self.is_postgres_available():
            logger.warning("PostgreSQL not available for read operation")
            return []

        try:
            query = model_class.query
            if filters:
                for key, value in filters.items():
                    query = query.filter(getattr(model_class, key) == value)

            return query.all()
        except Exception as e:
            logger.error(f"Failed to read from PostgreSQL: {e}")
            return []

    async def sync_databases(self) -> Dict[str, Any]:
        """Sync data between databases if needed"""
        if not self.sync_enabled:
            return {'status': 'disabled', 'message': 'Database sync is disabled'}

        sync_results = {
            'status': 'completed',
            'supabase_available': self.is_supabase_available(),
            'postgres_available': self.is_postgres_available(),
            'tables_synced': [],
            'errors': []
        }

        # Implement sync logic here if needed
        # For now, just return availability status

        return sync_results

# Global instance
dual_db = DualDatabaseService()

def init_dual_db():
    """Initialize the dual database service"""
    global dual_db
    dual_db = DualDatabaseService()
    logger.info("Dual database service initialized")
    logger.info(f"Supabase primary: {dual_db.supabase_primary}")
    logger.info(f"PostgreSQL backup: {dual_db.postgres_backup}")
    logger.info(f"Sync enabled: {dual_db.sync_enabled}")
