# CampusSwap Backend — Python / FastAPI

REST API for the CampusSwap campus marketplace. Built with **FastAPI**,
**SQLAlchemy 2.0** and **Pydantic v2**, with JWT auth.

The default database is **SQLite on localhost** (a single file, zero setup), and
switching to **PostgreSQL** later is a one-line change (see below).

---

## Quick start

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv .venv
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. (optional) copy env file
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux

# 4. Run the API
uvicorn app.main:app --reload
```

- API root: <http://127.0.0.1:8000>
- Interactive docs (Swagger UI): <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

The database file (`campusswap.db`) and demo data are created automatically on
first boot.

**Demo login:** `ananya@campus.edu` / `campus123`
(other demo users: `rahul@campus.edu`, `meera@campus.edu`, `arjun@campus.edu` —
same password).

---

## Switching to PostgreSQL later

1. Install the Postgres driver:

   ```bash
   pip install -r requirements-postgres.txt
   ```

2. Change one line in `.env`:

   ```env
   DATABASE_URL=postgresql+psycopg2://campusswap:campusswap@localhost:5432/campusswap
   ```

3. Restart the API. SQLAlchemy creates the tables on boot.

No application code changes are required — the models and queries are
database-agnostic.

---

## Architecture

```
backend/
  requirements.txt           Core dependencies (SQLite-ready)
  requirements-postgres.txt  Adds the PostgreSQL driver
  .env.example               Configuration template
  app/
    main.py        FastAPI app, CORS, table creation + seeding on startup
    config.py      Settings loaded from environment / .env
    db.py          SQLAlchemy engine + session factory (SQLite or Postgres)
    models.py      ORM models: User, Listing, Chat, Message
    schemas.py     Pydantic request/response models
    security.py    PBKDF2 password hashing + HS256 JWT
    deps.py        Auth dependencies (current user, optional user)
    serializers.py ORM -> API response shaping
    seed.py        Demo users + listings
    routers/
      auth.py      POST /auth/register, /auth/login
      meta.py      GET /meta
      listings.py  Listings CRUD, search, watch, stats
      chats.py     Chats, messages, structured offers
      users.py     /users/me, profile update, public profile
```

### Data model

- **users** — id, name, email (unique), campus, course, year, bio, meetup,
  rating, trades, verified, password_hash, created_at.
- **listings** — id, seller_id → users, name, category, price, condition,
  description, image, status (`active` / `sold` / `removed`), watch, created_at.
- **chats** — id, listing_id → listings, buyer_id, seller_id, timestamps.
- **messages** — id, chat_id → chats, sender_id, type (`text` / `offer`),
  text, amount, created_at.

---

## API reference (`/api/v1`)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/meta` | – | Categories & conditions |
| POST | `/auth/register` | – | Create an account, returns a JWT |
| POST | `/auth/login` | – | Log in, returns a JWT |
| GET | `/listings` | – | List/search (`q`, `category`, `sort`, `status`) |
| GET | `/listings/stats` | – | Home-page statistics |
| GET | `/listings/{id}` | – | One listing |
| POST | `/listings` | ✓ | Create a listing |
| PATCH | `/listings/{id}` | ✓ | Edit your own listing |
| POST | `/listings/{id}/watch` | – | Increment the watch counter |
| GET | `/chats` | ✓ | Your conversations |
| POST | `/chats` | ✓ | Start/find a chat (`listing_id`) |
| GET | `/chats/{id}/messages` | ✓ | Messages in a chat |
| POST | `/chats/{id}/messages` | ✓ | Send text or an offer (`{text}` or `{amount}`) |
| GET | `/users/me` | ✓ | Current user |
| PATCH | `/users/me` | ✓ | Update your profile |
| GET | `/users/{id}` | – | Public profile + listings |

### Example

```bash
# Log in and capture the token
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ananya@campus.edu","password":"campus123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# Browse books
curl "http://127.0.0.1:8000/api/v1/listings?category=Books"

# List your chats (authenticated)
curl http://127.0.0.1:8000/api/v1/chats -H "Authorization: Bearer $TOKEN"
```

---

## Security

- Passwords hashed with **PBKDF2-HMAC-SHA256** (200k iterations, per-user salt).
- **JWT (HS256)** access tokens signed with `SECRET_KEY`, 7-day expiry by default.
- **Authorization** checks server-side: only a listing's owner can edit it, and
  only chat participants can read or post messages.
- **Input validation** via Pydantic on every request body.
- **CORS** restricted to the configured frontend origins.

### Production checklist

- Set a long random `SECRET_KEY`.
- Use PostgreSQL (`DATABASE_URL`) and run behind HTTPS.
- Add rate limiting (e.g. `slowapi`) on auth and messaging endpoints.
- Restrict `CORS_ORIGINS` to your real frontend domain.
- Replace the demo `verified` flag with real campus-email/SSO verification.
