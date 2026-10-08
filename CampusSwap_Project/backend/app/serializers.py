"""Helpers that turn ORM objects into API response shapes."""

from __future__ import annotations

from . import models
from .schemas import ChatSummary, Listing, MessageBase, SellerSummary, UserPrivate, UserPublic


def user_public(user: models.User) -> UserPublic:
    return UserPublic.model_validate(user)


def user_private(user: models.User) -> UserPrivate:
    return UserPrivate.model_validate(user)


def seller_summary(user: models.User) -> SellerSummary:
    return SellerSummary(
        id=user.id,
        name=user.name,
        initials=models.initials(user.name),
        rating=user.rating,
        trades=user.trades,
        verified=user.verified,
        campus=user.campus,
        meetup=user.meetup,
    )


def listing_out(listing: models.Listing) -> Listing:
    return Listing(
        id=listing.id,
        name=listing.name,
        category=listing.category,
        price=listing.price,
        condition=listing.condition,
        description=listing.description,
        image=listing.image or "",
        status=listing.status,
        watch=listing.watch or 0,
        created_at=listing.created_at,
        seller_id=listing.seller_id,
        seller=seller_summary(listing.seller),
    )


def message_out(message: models.Message) -> MessageBase:
    return MessageBase.model_validate(message)


def chat_summary(chat: models.Chat, viewer_id: int) -> ChatSummary:
    other = chat.seller if chat.buyer_id == viewer_id else chat.buyer
    last = chat.messages[-1] if chat.messages else None
    return ChatSummary(
        id=chat.id,
        listing_id=chat.listing_id,
        listing_name=chat.listing.name if chat.listing else "Removed listing",
        other=user_public(other),
        role="buyer" if chat.buyer_id == viewer_id else "seller",
        last_message=message_out(last) if last else None,
        message_count=len(chat.messages),
        last_message_at=chat.last_message_at,
    )
