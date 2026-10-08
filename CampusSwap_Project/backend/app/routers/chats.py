"""Chat & messaging endpoints, including structured price offers."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from .. import models
from ..db import get_db
from ..deps import get_current_user
from ..schemas import ChatCreate, ChatCreated, ChatSummary, MessageBase, MessageCreate
from ..serializers import chat_summary, message_out

router = APIRouter(prefix="/chats", tags=["chats"])


def _new_message(chat: "models.Chat", sender_id: int, *, type: str, text: str, amount=None):
    """Build a message with an explicit timestamp so it is available before flush."""
    message = models.Message(
        chat_id=chat.id,
        sender_id=sender_id,
        type=type,
        text=text,
        amount=amount,
        created_at=models.utcnow(),
    )
    chat.last_message_at = message.created_at
    return message


def _accessible_chat(db: Session, chat_id: int, user_id: int) -> models.Chat:
    chat = db.get(models.Chat, chat_id)
    if chat is None or user_id not in (chat.buyer_id, chat.seller_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat


def _maybe_auto_reply(db: Session, chat: models.Chat, listing: models.Listing) -> None:
    """Add a scripted seller reply so the single-user demo feels alive."""
    last = chat.messages[-1] if chat.messages else None
    if last is None or last.sender_id != chat.buyer_id:
        return

    if last.type == "offer" and last.amount:
        if last.amount >= listing.price * 0.85:
            text = (
                f"₹{last.amount:,} works — let's do it! 🎉 "
                f"When can you meet at {listing.seller.meetup or 'campus'}?"
            )
        else:
            counter = round(listing.price * 0.9)
            text = (
                "I can come down a little but not that low. "
                f"How about ₹{counter:,}?"
            )
    else:
        text = (
            f'Yes, "{listing.name}" is still available. '
            f"Happy to meet near {listing.seller.meetup or 'campus'}."
        )

    reply = _new_message(chat, chat.seller_id, type="text", text=text)
    db.add(reply)
    db.commit()
    db.refresh(chat)


@router.get("", response_model=list[ChatSummary])
def list_chats(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> list[ChatSummary]:
    stmt = (
        select(models.Chat)
        .options(
            joinedload(models.Chat.listing),
            joinedload(models.Chat.buyer),
            joinedload(models.Chat.seller),
            joinedload(models.Chat.messages),
        )
        .where(or_(models.Chat.buyer_id == user.id, models.Chat.seller_id == user.id))
        .order_by(models.Chat.last_message_at.desc())
    )
    chats = db.scalars(stmt).unique().all()
    return [chat_summary(chat, user.id) for chat in chats]


@router.post("", response_model=ChatCreated, status_code=status.HTTP_201_CREATED)
def start_chat(
    payload: ChatCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> ChatCreated:
    listing = db.get(models.Listing, payload.listing_id)
    if listing is None or listing.status == "removed":
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot chat on your own listing")

    chat = db.scalar(
        select(models.Chat).where(
            models.Chat.listing_id == listing.id,
            models.Chat.buyer_id == user.id,
            models.Chat.seller_id == listing.seller_id,
        )
    )
    if chat is None:
        chat = models.Chat(
            listing_id=listing.id,
            buyer_id=user.id,
            seller_id=listing.seller_id,
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)

    # Seed the conversation with a friendly seller greeting (once).
    if not chat.messages:
        greeting = models.Message(
            chat_id=chat.id,
            sender_id=listing.seller_id,
            type="text",
            text=(
                f'Hi! Yes, "{listing.name}" is still available. '
                f"Happy to meet near {listing.seller.meetup or 'campus'}."
            ),
        )
        db.add(greeting)
        chat.last_message_at = greeting.created_at
        db.commit()
        db.refresh(chat)

    return ChatCreated(chat_id=chat.id, messages=[message_out(m) for m in chat.messages])


@router.get("/{chat_id}/messages", response_model=list[MessageBase])
def get_messages(
    chat_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> list[MessageBase]:
    chat = _accessible_chat(db, chat_id, user.id)
    return [message_out(m) for m in chat.messages]


@router.post("/{chat_id}/messages", response_model=MessageBase, status_code=status.HTTP_201_CREATED)
def send_message(
    chat_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> MessageBase:
    chat = _accessible_chat(db, chat_id, user.id)
    text = (payload.text or "").strip()
    amount = payload.amount

    if not text and amount is None:
        raise HTTPException(status_code=422, detail="Message is empty")

    message = models.Message(
        chat_id=chat.id,
        sender_id=user.id,
        type="offer" if amount is not None else "text",
        text=text,
        amount=amount,
    )
    db.add(message)
    chat.last_message_at = message.created_at
    db.commit()
    db.refresh(message)
    db.refresh(chat)

    # Auto-reply only when the buyer is talking to a (different) seller.
    if chat.seller_id != user.id:
        _maybe_auto_reply(db, chat, chat.listing)

    return message_out(message)
