# CampusSwap Backend

A real multipage backend for the CampusSwap prototype: **Node.js + Express**,
server-rendered HTML pages, cookie sessions, CSRF protection and a JSON API.
No build step and no external database — data is stored in a single JSON file
that is created and seeded automatically on first run.

---

## Quick start

```bash
cd server
npm install
npm start
```

Then open **http://127.0.0.1:4000**.

Demo login: **ananya@campus.edu** / **campus123**
(other demo users: rahul@campus.edu, meera@campus.edu, arjun@campus.edu — same password)

- `npm run dev` — auto-restart on file changes (`node --watch`).
- `npm run seed:reset` — wipe the database and re-seed demo data.

---

## Pages (click-through navigation)

| Page | URL | Notes |
| --- | --- | --- |
| Home | `/` | Hero, live stats, featured deals |
| Browse | `/browse` | Search, category filters, sorting |
| Listing detail | `/listing/:id` | Seller card, watch, start chat |
| Sell | `/sell` | Auth required; validated listing form |
| Inbox | `/inbox` | Auth required; all conversations |
| Chat | `/chat/:id` | Auth required; live messaging + offers |
| Profile (self) | `/profile` | Auth required; manage + edit |
| Profile (public) | `/profile/:id` | Public seller profile |
| Log in | `/login` | |
| Sign up | `/register` | |

Every navigation link is a normal hyperlink, so the browser moves between pages
with real history (back/forward work) and each page has its own URL.

---

## Architecture

```
server/
  server.js               Express app, security headers, error handling, boot
  src/
    config.js             Env loading + config (port, secret, data file)
    store.js              Dependency-free atomic JSON datastore
    security.js           scrypt password hashing, signed session tokens, ids
    models.js             Users, listings, chats, messages + validation
    seed.js               Demo users and listings
    middleware.js         Cookies, sessions, CSRF, flash, auth guards
    routes/
      pages.js            HTML page routes (the multipage app)
      api.js              JSON REST API under /api/v1
    views/
      layout.js           HTML document shell + escaping helpers
      components.js       Reusable listing card / empty state
      pages.js            One render function per page
  public/
    styles.css            Design system (matches the original prototype)
    js/common.js          fetch + CSRF helper, toasts
    js/chat.js            Live chat (poll + send)
    js/browse.js          Small enhancements
    js/listing.js         Small enhancements
  scripts/reset.js        Re-seed helper
```

### Data model

- **users** — id, name, email, campus, course, year, bio, meetup, rating,
  trades, verified, `passwordHash`, createdAt.
- **listings** — id, sellerId, name, category, price, condition, desc,
  status (`active` / `sold` / `removed`), watch, createdAt.
- **chats** — id, listingId, buyerId, sellerId, timestamps.
- **messages** — id, chatId, senderId, type (`text` / `offer`), text, amount,
  createdAt.
- **sessions** — id, userId, expiresAt.

---

## REST API (`/api/v1`)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/meta` | – | Categories & conditions |
| GET | `/listings` | – | List/search (`q`, `category`, `sort`, `status`) |
| GET | `/listings/:id` | – | One listing |
| POST | `/listings` | ✓ | Create a listing |
| PATCH | `/listings/:id` | ✓ | Edit your own listing |
| GET | `/chats` | ✓ | Your conversations |
| POST | `/chats` | ✓ | Start/find a chat (`listingId`) |
| GET | `/chats/:id/messages` | ✓ | Messages in a chat |
| POST | `/chats/:id/messages` | ✓ | Send text or an offer |
| GET | `/me` | ✓ | Current user |
| GET | `/users/:id` | – | Public profile + listings |

### Example

```bash
# Log in and keep the session cookie
curl -c jar.txt http://127.0.0.1:4000/login
CSRF=$(grep csrf_token jar.txt | awk '{print $7}')
curl -b jar.txt -c jar.txt -X POST http://127.0.0.1:4000/login \
  -d "email=ananya@campus.edu&password=campus123&_csrf=$CSRF"

# List listings
curl http://127.0.0.1:4000/api/v1/listings?category=Books

# Send an offer (reuse the csrf_token cookie)
curl -b jar.txt -H "x-csrf-token: $CSRF" -H "Content-Type: application/json" \
  -X POST http://127.0.0.1:4000/api/v1/chats/<chatId>/messages \
  -d '{"amount":600}'
```

---

## Security

- Passwords hashed with **scrypt** + per-user salt (`crypto.scryptSync`).
- Sessions are **signed, HTTP-only cookies** (`SameSite=Lax`, `Secure` in prod);
  stored server-side and expired after 7 days.
- **CSRF**: state-changing requests (HTML forms via `_csrf`, API via
  `x-csrf-token`) must match the per-session token, checked with a timing-safe
  compare.
- **Authorization**: listing edits and chat access are checked server-side.
- **Output escaping**: all user content is HTML-escaped before rendering.
- **Input validation**: registration and listings validated on the server.
- **Security headers** + a restrictive **Content-Security-Policy**.
- **Body size limits** (64 KB) and JSON-only API payloads.
- Basic **rate limiting is not included** — see “Next steps” below.

### Production checklist

- Set `SESSION_SECRET` to a long random value.
- Set `NODE_ENV=production` (enables `Secure` cookies; put it behind HTTPS).
- Replace the JSON store in `src/store.js` with Postgres/SQLite for writes at
  scale, and move sessions to a shared store (Redis) if you run multiple
  instances.
- Add rate limiting (e.g. `express-rate-limit`) on auth and messaging endpoints.
- Add real campus-email/SSO verification instead of the demo `verified` flag.

---

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | |
| `HOST` | `127.0.0.1` | Use `0.0.0.0` to expose on LAN |
| `SESSION_SECRET` | dev default | **Change in production** |
| `DATA_FILE` | `./data/db.json` | Where data is stored |
| `NODE_ENV` | `development` | `production` enables Secure cookies |
