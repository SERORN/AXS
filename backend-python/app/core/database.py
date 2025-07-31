"""
Database configuration and session management for AXS360 API
PostgreSQL with SQLAlchemy and async support
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, MetaData
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=300
)

# Create sync engine for migrations
sync_engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=300
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create sync session factory for migrations
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine
)

# Create base class for models
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()

async def create_db_and_tables():
    """Create database tables"""
    try:
        async with engine.begin() as conn:
            # Import all models to ensure they are registered
            from app.models.user import User
            from app.models.vehicle import Vehicle
            from app.models.pass_model import Pass
            from app.models.plan import Plan
            from app.models.wallet import Wallet, WalletTransaction
            from app.models.payment import Payment
            from app.models.notification import Notification
            from app.models.qr_code import QRCode
            from app.models.audit_log import AuditLog
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

async def get_async_session() -> AsyncSession:
    """Dependency to get async database session"""
    async with async_session() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()

def get_sync_session():
    """Get sync database session for migrations"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Sync database session error: {e}")
        raise
    finally:
        db.close()

# Health check function
async def check_database_health():
    """Check database connectivity"""
    try:
        async with async_session() as session:
            await session.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
