"""Shared FastAPI dependencies: current user, optional user, ownership checks."""

from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .config import settings
from .db import get_db
from .security import decode_access_token

# auto_error=False so we can support optional auth on public endpoints too.
_bearer = HTTPBearer(auto_error=False)


def _user_from_token(token: str, db: Session) -> Optional[models.User]:
    payload = decode_access_token(token, settings.secret_key)
    if not payload:
        return None
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        return None
    return db.get(models.User, user_id)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = _user_from_token(credentials.credentials, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if credentials is None:
        return None
    return _user_from_token(credentials.credentials, db)
