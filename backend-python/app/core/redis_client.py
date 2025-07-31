"""
Redis client configuration for AXS360 API
Used for caching, sessions, and background tasks
"""

import redis.asyncio as redis
import json
import logging
from typing import Any, Optional, Union

from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    def __init__(self):
        self.redis_pool = None
        self.redis_client = None
    
    async def connect(self):
        """Initialize Redis connection"""
        try:
            self.redis_pool = redis.ConnectionPool.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                max_connections=20
            )
            self.redis_client = redis.Redis(connection_pool=self.redis_pool)
            await self.redis_client.ping()
            logger.info("Redis connection established successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed")
    
    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        try:
            if not self.redis_client:
                await self.connect()
            return await self.redis_client.get(key)
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Union[str, dict, list], 
        expire: Optional[int] = None
    ) -> bool:
        """Set value with optional expiration"""
        try:
            if not self.redis_client:
                await self.connect()
            
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            return await self.redis_client.set(key, value, ex=expire)
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
    
    async def setex(self, key: str, time: int, value: Union[str, dict, list]) -> bool:
        """Set value with expiration time"""
        try:
            if not self.redis_client:
                await self.connect()
            
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            return await self.redis_client.setex(key, time, value)
        except Exception as e:
            logger.error(f"Redis SETEX error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key"""
        try:
            if not self.redis_client:
                await self.connect()
            return bool(await self.redis_client.delete(key))
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            if not self.redis_client:
                await self.connect()
            return bool(await self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False
    
    async def incr(self, key: str) -> Optional[int]:
        """Increment key value"""
        try:
            if not self.redis_client:
                await self.connect()
            return await self.redis_client.incr(key)
        except Exception as e:
            logger.error(f"Redis INCR error for key {key}: {e}")
            return None
    
    async def expire(self, key: str, time: int) -> bool:
        """Set expiration time for key"""
        try:
            if not self.redis_client:
                await self.connect()
            return await self.redis_client.expire(key, time)
        except Exception as e:
            logger.error(f"Redis EXPIRE error for key {key}: {e}")
            return False
    
    async def ping(self) -> bool:
        """Test Redis connection"""
        try:
            if not self.redis_client:
                await self.connect()
            await self.redis_client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis PING error: {e}")
            return False
    
    async def get_json(self, key: str) -> Optional[dict]:
        """Get JSON value by key"""
        try:
            value = await self.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET_JSON error for key {key}: {e}")
            return None
    
    async def set_json(
        self, 
        key: str, 
        value: dict, 
        expire: Optional[int] = None
    ) -> bool:
        """Set JSON value with optional expiration"""
        return await self.set(key, value, expire)
    
    async def close(self):
        """Close Redis connection"""
        await self.disconnect()

# Global Redis client instance
redis_client = RedisClient()

# Cache decorators and utilities
class CacheManager:
    @staticmethod
    async def get_cached_user(user_id: int) -> Optional[dict]:
        """Get cached user data"""
        return await redis_client.get_json(f"user:{user_id}")
    
    @staticmethod
    async def cache_user(user_id: int, user_data: dict, expire: int = 3600):
        """Cache user data for 1 hour by default"""
        return await redis_client.set_json(f"user:{user_id}", user_data, expire)
    
    @staticmethod
    async def invalidate_user_cache(user_id: int):
        """Remove user from cache"""
        return await redis_client.delete(f"user:{user_id}")
    
    @staticmethod
    async def get_cached_vehicle(vehicle_id: int) -> Optional[dict]:
        """Get cached vehicle data"""
        return await redis_client.get_json(f"vehicle:{vehicle_id}")
    
    @staticmethod
    async def cache_vehicle(vehicle_id: int, vehicle_data: dict, expire: int = 3600):
        """Cache vehicle data"""
        return await redis_client.set_json(f"vehicle:{vehicle_id}", vehicle_data, expire)
    
    @staticmethod
    async def invalidate_vehicle_cache(vehicle_id: int):
        """Remove vehicle from cache"""
        return await redis_client.delete(f"vehicle:{vehicle_id}")

# Session management
class SessionManager:
    @staticmethod
    async def create_session(user_id: int, session_data: dict, expire: int = 86400):
        """Create user session (24 hours by default)"""
        session_key = f"session:{user_id}"
        return await redis_client.set_json(session_key, session_data, expire)
    
    @staticmethod
    async def get_session(user_id: int) -> Optional[dict]:
        """Get user session"""
        return await redis_client.get_json(f"session:{user_id}")
    
    @staticmethod
    async def delete_session(user_id: int):
        """Delete user session"""
        return await redis_client.delete(f"session:{user_id}")
    
    @staticmethod
    async def refresh_session(user_id: int, expire: int = 86400):
        """Refresh session expiration"""
        return await redis_client.expire(f"session:{user_id}", expire)
