"""Application configuration loaded from environment / .env file."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# backend/ directory (parent of app/)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env if it exists (does not override real env vars).
load_dotenv(BASE_DIR / ".env")


def _resolve_sqlite(url: str) -> str:
    """Make a relative SQLite path absolute so it works from any cwd."""
    prefix = "sqlite:///"
    if not url.startswith(prefix):
        return url
    raw = url[len(prefix):]
    if raw in (":memory:", "") or Path(raw).is_absolute():
        return url
    return prefix + str((BASE_DIR / raw).resolve())


def _split_origins(value: str) -> list[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "CampusSwap API"
    api_prefix: str = "/api/v1"

    database_url: str = field(
        default_factory=lambda: _resolve_sqlite(
            os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'campusswap.db'}")
        )
    )

    secret_key: str = field(
        default_factory=lambda: os.getenv("SECRET_KEY", "campusswap-dev-secret-change-me")
    )
    access_token_expire_minutes: int = field(
        default_factory=lambda: int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    )

    host: str = field(default_factory=lambda: os.getenv("HOST", "127.0.0.1"))
    port: int = field(default_factory=lambda: int(os.getenv("PORT", "8000")))

    cors_origins: list[str] = field(
        default_factory=lambda: _split_origins(
            os.getenv(
                "CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            )
        )
    )

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


settings = Settings()
