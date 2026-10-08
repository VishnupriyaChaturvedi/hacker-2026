"""Demo data so the app looks alive on first boot.

Users are seeded with verified ratings/trades to mirror the prototype; the demo
password is shared for convenience.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .security import hash_password

DEMO_PASSWORD = "campus123"

DEMO_USERS = [
    {
        "name": "Ananya Rao",
        "email": "ananya@campus.edu",
        "campus": "Sunrise Institute of Technology",
        "course": "Computer Science",
        "year": "3rd year",
        "bio": "Selling my senior-year books and gadgets. Responsive, meet at the Main Library.",
        "rating": 4.9,
        "trades": 18,
        "verified": True,
        "meetup": "Main Library",
    },
    {
        "name": "Rahul Mehta",
        "email": "rahul@campus.edu",
        "campus": "Sunrise Institute of Technology",
        "course": "Electronics",
        "year": "2nd year",
        "bio": "Calculator and lab gear. Quick to reply between lectures.",
        "rating": 4.6,
        "trades": 7,
        "verified": True,
        "meetup": "Canteen Block B",
    },
    {
        "name": "Meera Shah",
        "email": "meera@campus.edu",
        "campus": "Sunrise Institute of Technology",
        "course": "Architecture",
        "year": "4th year",
        "bio": "Hostel essentials as I graduate. Everything works, prices negotiable.",
        "rating": 4.8,
        "trades": 11,
        "verified": True,
        "meetup": "Hostel Reception",
    },
    {
        "name": "Arjun Nair",
        "email": "arjun@campus.edu",
        "campus": "Sunrise Institute of Technology",
        "course": "Mechanical",
        "year": "3rd year",
        "bio": "Cycles and sports gear. You can test-ride before you buy.",
        "rating": 4.5,
        "trades": 9,
        "verified": True,
        "meetup": "Sports Complex",
    },
]

# (seller email, listing payload), ordered newest-first by index.
DEMO_LISTINGS = [
    ("ananya@campus.edu", "DSA Made Easy — 2nd Edition", "Books", 280, "Like new", 6,
     "Clean pages, no highlights. Perfect for DSA semester prep."),
    ("rahul@campus.edu", "Casio FX-991ES Plus", "Gadgets", 650, "Good", 3,
     "Fully working scientific calculator with cover."),
    ("meera@campus.edu", "Study Lamp + Extension Board", "Hostel", 420, "Good", 4,
     "Warm LED lamp and 4-socket extension board."),
    ("arjun@campus.edu", "Single-Speed Campus Cycle", "Cycles", 3200, "Used", 8,
     "Recently serviced. Great for hostel-to-class commuting."),
    ("ananya@campus.edu", "DBMS Complete Notes", "Books", 150, "Good", 2,
     "Handwritten + printed notes, unit-wise."),
    ("meera@campus.edu", "USB-C Hub 6-in-1", "Gadgets", 700, "Like new", 5,
     "HDMI, USB 3.0, SD and PD charging."),
    ("arjun@campus.edu", "Hostel Storage Rack", "Hostel", 550, "Used", 1,
     "Compact 3-layer rack. Easy to carry."),
    ("rahul@campus.edu", "Helmet — ISI Certified", "Cycles", 900, "Good", 2,
     "Lightly used, adjustable fit."),
]


def seed(db: Session) -> bool:
    """Insert demo data if the database is empty. Returns True if it seeded."""
    if db.execute(select(models.User.id).limit(1)).first() is not None:
        return False

    now = datetime.now(timezone.utc)
    email_to_user: dict[str, models.User] = {}

    for demo in DEMO_USERS:
        user = models.User(
            **demo,
            password_hash=hash_password(DEMO_PASSWORD),
        )
        db.add(user)
        email_to_user[demo["email"]] = user

    db.flush()  # assign user ids

    for index, (email, name, category, price, condition, watch, desc) in enumerate(DEMO_LISTINGS):
        listing = models.Listing(
            seller_id=email_to_user[email].id,
            name=name,
            category=category,
            price=price,
            condition=condition,
            description=desc,
            watch=watch,
            status="active",
            created_at=now - timedelta(hours=index),
        )
        db.add(listing)

    db.commit()
    return True
