# CampusSwap Frontend — React + Vite

The CampusSwap user interface, rebuilt as a **React single-page app** with
**Vite** and **React Router**. It talks to the FastAPI backend over `/api/v1`.

---

## Quick start

Make sure the backend is running first (see `../backend/README.md`), then:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The Vite dev server **proxies `/api` to `http://127.0.0.1:8000`**, so there are
no CORS issues during development. To point at a different backend, copy
`.env.example` to `.env` and set `VITE_API_BASE`.

**Demo login:** `ananya@campus.edu` / `campus123`

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Produce a production build in `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Pages & routes

| Route | Page | Notes |
| --- | --- | --- |
| `/` | Home | Hero, live stats, featured deals, trust section |
| `/browse` | Browse | Search, category tabs, sorting (URL-driven) |
| `/listing/:id` | Listing detail | Seller card, watch, start chat |
| `/sell` | Sell | Auth required; validated listing form |
| `/inbox` | Inbox | Auth required; all conversations |
| `/chat/:id` | Chat | Auth required; live messaging + offers (polling) |
| `/profile` | Your profile | Auth required; edit profile, manage listings |
| `/profile/:id` | Public profile | Seller profile + their listings |
| `/login` | Log in | |
| `/register` | Sign up | |

---

## Architecture

```
frontend/
  index.html
  vite.config.js        Dev server + /api proxy
  src/
    main.jsx            App bootstrap (Router, providers)
    App.jsx             Route table
    api.js              fetch wrapper for the FastAPI backend
    styles.css          Design system (matches the original prototype)
    context/
      AuthContext.jsx   JWT session state (login/register/logout/me)
      ToastContext.jsx  Lightweight toast notifications
    components/
      Layout.jsx        Shell: navbar + outlet + footer
      Navbar.jsx        Top bar with nav + account area
      RequireAuth.jsx   Route guard for logged-in pages
      ListingCard.jsx   Listing card, empty state, section head
    pages/
      HomePage.jsx
      BrowsePage.jsx
      ListingDetailPage.jsx
      SellPage.jsx
      InboxPage.jsx
      ChatPage.jsx
      ProfilePage.jsx
      LoginPage.jsx
      RegisterPage.jsx
      NotFoundPage.jsx
    utils/
      format.js         money / timeAgo / initials helpers
```

## Notes

- **Auth** is a JWT stored in `localStorage` and sent as
  `Authorization: Bearer <token>` on every request.
- **Chat** currently polls every 3 seconds; this can later be replaced with
  WebSockets for realtime.
- The chat auto-reply is a backend convenience so the app feels alive with a
  single user.
