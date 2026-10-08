"""SQLAlchemy ORM models mirroring the CampusSwap domain.

Data model (matches the original prototype):

- ``User``     — campus member, seller/buyer profile.
- ``Listing``  — an item for sale.
- ``Chat``     — a conversation between a buyer and a seller about a listing.
- ``Message``  — a text message or a structured price offer within a chat.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    campus: Mapped[str] = mapped_column(String(160), nullable=False)
    course: Mapped[str] = mapped_column(String(120), default="Not specified")
    year: Mapped[str] = mapped_column(String(40), default="Not specified")
    bio: Mapped[str] = mapped_column(Text, default="")
    meetup: Mapped[str] = mapped_column(String(120), default="Main gate")
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    trades: Mapped[int] = mapped_column(Integer, default=0)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    listings: Mapped[list["Listing"]] = relationship(
        back_populates="seller", cascade="all, delete-orphan"
    )


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    condition: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image: Mapped[str] = mapped_column(String(500), default="")
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    watch: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    seller: Mapped["User"] = relationship(back_populates="listings")

    @property
    def seller_initials(self) -> str:
        return initials(self.seller.name if self.seller else "")


class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id"), index=True, nullable=False)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_message_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )

    listing: Mapped["Listing"] = relationship()
    buyer: Mapped["User"] = relationship(foreign_keys=[buyer_id])
    seller: Mapped["User"] = relationship(foreign_keys=[seller_id])
    messages: Mapped[list["Message"]] = relationship(
        back_populates="chat",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey("chats.id"), index=True, nullable=False)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), default="text")  # "text" | "offer"
    text: Mapped[str] = mapped_column(Text, default="")
    amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    chat: Mapped["Chat"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship()


def initials(name: str | None) -> str:
    parts = [p for p in (name or "").split() if p]
    if not parts:
        return "CS"
    first = parts[0][0]
    last = parts[-1][0] if len(parts) > 1 else ""
    return (first + last).upper()
