"""Listing endpoints: browse, detail, create, edit, watch, stats."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from .. import models
from ..db import get_db
from ..deps import get_current_user
from ..schemas import (
    CATEGORIES,
    CONDITIONS,
    LISTING_STATUSES,
    Listing,
    ListingCreate,
    ListingList,
    ListingUpdate,
    Stats,
)
from ..serializers import listing_out

router = APIRouter(prefix="/listings", tags=["listings"])


def _get_listing_or_404(db: Session, listing_id: int) -> models.Listing:
    listing = db.get(models.Listing, listing_id)
    if listing is None or listing.status == "removed":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return listing


@router.get("", response_model=ListingList)
def list_listings(
    q: Optional[str] = Query(default=None, max_length=120),
    category: Optional[str] = Query(default=None, max_length=60),
    sort: str = Query(default="newest", pattern="^(newest|price-asc|price-desc)$"),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> ListingList:
    stmt = (
        select(models.Listing)
        .options(joinedload(models.Listing.seller))
        .where(models.Listing.status != "removed")
    )

    if status_filter:
        stmt = stmt.where(models.Listing.status == status_filter)

    if category and category != "All":
        stmt = stmt.where(models.Listing.category == category)

    if q:
        needle = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(models.Listing.name).like(needle),
                func.lower(models.Listing.description).like(needle),
                func.lower(models.Listing.category).like(needle),
            )
        )

    if sort == "price-asc":
        stmt = stmt.order_by(models.Listing.price.asc())
    elif sort == "price-desc":
        stmt = stmt.order_by(models.Listing.price.desc())
    else:
        stmt = stmt.order_by(models.Listing.created_at.desc())

    rows = db.scalars(stmt).unique().all()
    listings = [listing_out(row) for row in rows]
    return ListingList(listings=listings, count=len(listings))


@router.get("/stats", response_model=Stats)
def listing_stats(db: Session = Depends(get_db)) -> Stats:
    active = db.scalars(
        select(models.Listing).where(models.Listing.status == "active")
    ).all()
    sellers = {row.seller_id for row in active}
    watching = sum(row.watch or 0 for row in active)
    sold = db.scalar(
        select(func.count()).select_from(models.Listing).where(models.Listing.status == "sold")
    )
    return Stats(
        active_listings=len(active),
        sellers=len(sellers),
        watching=watching,
        sold=int(sold or 0),
    )


@router.get("/{listing_id}", response_model=Listing)
def get_listing(listing_id: int, db: Session = Depends(get_db)) -> Listing:
    listing = _get_listing_or_404(db, listing_id)
    return listing_out(listing)


@router.post("", response_model=Listing, status_code=status.HTTP_201_CREATED)
def create_listing(
    payload: ListingCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> Listing:
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=422, detail="Choose a valid category.")
    if payload.condition not in CONDITIONS:
        raise HTTPException(status_code=422, detail="Choose a valid condition.")

    listing = models.Listing(
        seller_id=user.id,
        name=payload.name.strip(),
        category=payload.category,
        condition=payload.condition,
        price=payload.price,
        description=payload.description.strip(),
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing_out(listing)


@router.patch("/{listing_id}", response_model=Listing)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> Listing:
    listing = db.get(models.Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own listings.")

    if payload.category is not None and payload.category not in CATEGORIES:
        raise HTTPException(status_code=422, detail="Choose a valid category.")
    if payload.condition is not None and payload.condition not in CONDITIONS:
        raise HTTPException(status_code=422, detail="Choose a valid condition.")
    if payload.status is not None and payload.status not in LISTING_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid status.")

    for field in ("name", "category", "condition", "price", "description", "status", "image"):
        value = getattr(payload, field)
        if value is not None:
            setattr(listing, field, value)

    db.commit()
    db.refresh(listing)
    return listing_out(listing)


@router.post("/{listing_id}/watch", response_model=Listing)
def watch_listing(
    listing_id: int,
    db: Session = Depends(get_db),
) -> Listing:
    listing = _get_listing_or_404(db, listing_id)
    listing.watch = (listing.watch or 0) + 1
    db.commit()
    db.refresh(listing)
    return listing_out(listing)
