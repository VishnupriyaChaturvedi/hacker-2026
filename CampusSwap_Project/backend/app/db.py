"""SQLAlchemy engine and session setup.

Works with SQLite on localhost by default and with PostgreSQL by changing a
single ``DATABASE_URL`` value (see ``.env.example``).
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def _engine_kwargs() -> dict:
    if settings.is_sqlite:
        # Needed so the SQLite connection can be shared across FastAPI threads.
        return {"connect_args": {"check_same_thread": False}}
    return {"pool_pre_ping": True}


engine = create_engine(settings.database_url, **_engine_kwargs())

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
