import os

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


db_path = settings.DATABASE_URL
if db_path.startswith("sqlite"):
    db_path = db_path.replace("sqlite+aiosqlite:///", "")
    db_dir = os.path.dirname(os.path.abspath(db_path))
    os.makedirs(db_dir, exist_ok=True)

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)


@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if settings.DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_sync_db_url = settings.DATABASE_URL.replace("+aiosqlite", "")
_sync_engine = create_engine(_sync_db_url, echo=False)
SyncSession = sessionmaker(bind=_sync_engine)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
