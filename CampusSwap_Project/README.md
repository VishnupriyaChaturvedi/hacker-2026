# CampusSwap — Full-Stack (FastAPI + React)

CampusSwap turns chaotic campus WhatsApp selling into a searchable, trusted
marketplace with built-in bargaining chat.

This workspace contains the **new full-stack implementation**:

| Folder | Stack | Purpose |
| --- | --- | --- |
| `backend/` | Python · FastAPI · SQLAlchemy · SQLite (→ Postgres) | REST API |
| `frontend/` | React · Vite · React Router | Single-page UI |
| `CampusSwap/` | Original prototype (static page + Node/Express server) | Reference |

The original prototype is kept untouched for comparison. The React frontend
reproduces its design and features on top of a clean Python backend.

---

## Run it locally (two terminals)

### 1. Backend — FastAPI on port 8000

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows PowerShell
# source .venv/bin/activate         # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: <http://127.0.0.1:8000>
- Docs: <http://127.0.0.1:8000/docs>

The SQLite database and demo data are created automatically. Demo login:
**ananya@campus.edu / campus123**.

### 2. Frontend — React on port 5173

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The dev server proxies `/api` to the backend.

---

## Switching the database to PostgreSQL later

The backend uses SQLAlchemy, so it is database-agnostic. Just:

```bash
cd backend
pip install -r requirements-postgres.txt
```

Then set in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://campusswap:campusswap@localhost:5432/campusswap
```

Restart the API — no code changes needed.

---

## Features

- Seller listing flow: item, category, price, condition, description.
- Buyer browsing with search, category filters and sorting.
- JWT authentication (register / login) with hashed passwords.
- Buyer/seller chat per item, with structured price offers.
- Seller auto-reply so a single-user demo feels alive.
- Wishlist / watch counter.
- Verified seller trust signals, ratings and meet-up spots.
- Responsive design matching the original prototype.
- Seed data so the app looks alive immediately.

See `backend/README.md` and `frontend/README.md` for details.
