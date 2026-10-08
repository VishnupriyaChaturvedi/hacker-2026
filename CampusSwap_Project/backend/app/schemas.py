"""Pydantic request/response schemas (API contract)."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated, Optional

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints

# Lightweight email validation so we do not pull in the email-validator extra.
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _validate_email(value: str) -> str:
    value = str(value).strip().lower()
    if not _EMAIL_RE.match(value):
        raise ValueError("Enter a valid email address.")
    return value


Email = Annotated[
    str,
    StringConstraints(strip_whitespace=True, to_lower=True, max_length=255),
    AfterValidator(_validate_email),
]

# ---------------------------------------------------------------------------
# Enums / constants
# ---------------------------------------------------------------------------

CATEGORIES = ["Books", "Gadgets", "Hostel", "Cycles", "Stationery", "Other"]
CONDITIONS = ["Like new", "Good", "Used"]
LISTING_STATUSES = ["active", "sold", "removed"]


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class UserPublic(BaseModel):
    """User fields that are safe to send to the browser."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    campus: str
    course: str
    year: str
    bio: str
    meetup: str
    rating: float
    trades: int
    verified: bool
    created_at: datetime


class UserPrivate(UserPublic):
    email: Email


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    campus: Optional[str] = Field(default=None, min_length=2, max_length=160)
    course: Optional[str] = Field(default=None, max_length=120)
    year: Optional[str] = Field(default=None, max_length=40)
    bio: Optional[str] = Field(default=None, max_length=300)
    meetup: Optional[str] = Field(default=None, max_length=120)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: Email
    campus: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: Email
    password: str = Field(min_length=1, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPrivate


# ---------------------------------------------------------------------------
# Listings
# ---------------------------------------------------------------------------

class SellerSummary(BaseModel):
    id: int
    name: str
    initials: str
    rating: float
    trades: int
    verified: bool
    campus: str
    meetup: str


class ListingCreate(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    category: str
    condition: str
    price: int = Field(ge=1, le=1_000_000)
    description: str = Field(min_length=5, max_length=600)


class ListingUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=200)
    category: Optional[str] = None
    condition: Optional[str] = None
    price: Optional[int] = Field(default=None, ge=1, le=1_000_000)
    description: Optional[str] = Field(default=None, min_length=5, max_length=600)
    status: Optional[str] = None
    image: Optional[str] = Field(default=None, max_length=500)


class Listing(BaseModel):
    id: int
    name: str
    category: str
    price: int
    condition: str
    description: str
    image: str
    status: str
    watch: int
    created_at: datetime
    seller_id: int
    seller: SellerSummary


class ListingList(BaseModel):
    listings: list[Listing]
    count: int


class Stats(BaseModel):
    active_listings: int
    sellers: int
    watching: int
    sold: int


# ---------------------------------------------------------------------------
# Chats & messages
# ---------------------------------------------------------------------------


class MessageBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chat_id: int
    sender_id: int
    type: str
    text: str
    amount: Optional[int] = None
    created_at: datetime


class MessageCreate(BaseModel):
    text: str = Field(default="", max_length=1000)
    amount: Optional[int] = Field(default=None, ge=1, le=1_000_000)


class ChatSummary(BaseModel):
    id: int
    listing_id: int
    listing_name: str
    other: UserPublic
    role: str
    last_message: Optional[MessageBase]
    message_count: int
    last_message_at: datetime


class ChatCreate(BaseModel):
    listing_id: int


class ChatCreated(BaseModel):
    chat_id: int
    messages: list[MessageBase]


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------


class Meta(BaseModel):
    categories: list[str]
    conditions: list[str]


class UserProfile(BaseModel):
    user: UserPublic
    listings: list[Listing]
