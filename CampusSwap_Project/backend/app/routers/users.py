"""User endpoints: current user, profile updates, public profiles."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models
from ..db import get_db
from ..deps import get_current_user
from ..schemas import UserPrivate, UserProfile, UserPublic, UserUpdate
from ..serializers import listing_out, user_private, user_public

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPrivate)
def read_me(user: models.User = Depends(get_current_user)) -> UserPrivate:
    return user_private(user)


@router.patch("/me", response_model=UserPrivate)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> UserPrivate:
    for field in ("name", "campus", "course", "year", "bio", "meetup"):
        value = getattr(payload, field)
        if value is not None and value.strip() != "":
            setattr(user, field, value.strip())
    db.commit()
    db.refresh(user)
    return user_private(user)


@router.get("/{user_id}", response_model=UserProfile)
def read_user(user_id: int, db: Session = Depends(get_db)) -> UserProfile:
    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    listings = db.scalars(
        select(models.Listing)
        .options(joinedload(models.Listing.seller))
        .where(
            models.Listing.seller_id == user.id,
            models.Listing.status != "removed",
        )
        .order_by(models.Listing.created_at.desc())
    ).unique().all()

    return UserProfile(
        user=user_public(user),
        listings=[listing_out(row) for row in listings],
    )
