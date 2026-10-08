"""Authentication endpoints: register and log in."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from ..db import get_db
from ..schemas import LoginRequest, RegisterRequest, Token
from ..security import create_access_token, hash_password, verify_password
from ..serializers import user_private

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_token(user: models.User) -> Token:
    token = create_access_token(
        user.id, settings.secret_key, settings.access_token_expire_minutes
    )
    return Token(access_token=token, user=user_private(user))


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> Token:
    email = payload.email.lower()
    exists = db.scalar(select(models.User).where(func.lower(models.User.email) == email))
    if exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = models.User(
        name=payload.name.strip(),
        email=email,
        campus=payload.campus.strip(),
        password_hash=hash_password(payload.password),
        verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_token(user)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    email = payload.email.lower()
    user = db.scalar(select(models.User).where(func.lower(models.User.email) == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    return _issue_token(user)
