# CampusSwap — Campus Hustle Prototype

**One-line pitch:** CampusSwap turns chaotic campus WhatsApp selling into a searchable, trusted marketplace with built-in bargaining chat.

> **Two versions live in this repo:**
> 1. **Full-stack app (recommended)** — `server/` — Node.js + Express backend with
>    multiple real pages, login, listings, chat and offers. See
>    [`server/README.md`](server/README.md) to run it (`cd server && npm install && npm start`).
> 2. **Original static prototype** — `index.html` + `styles.css` + `app.js` — a
>    single-page demo that opens directly in a browser with no server.

## What this prototype solves
Students already buy/sell through WhatsApp groups, but listings disappear, prices are hard to find, seller trust is unclear, and bargaining creates repetitive messages. CampusSwap gives the same community a proper home.

## Core features
- Seller listing flow: item, category, price, condition and description.
- Buyer browsing with search and category filters.
- Seller verification and trust signals.
- Buyer/seller chat for each item, with structured price negotiation.
- Wishlist/watch interaction.
- Responsive mobile/desktop design.
- Demo data so the app looks alive immediately.

## Run the full-stack app
```bash
cd server
npm install
npm start
```
Open http://127.0.0.1:4000 — demo login **ananya@campus.edu / campus123**.

Pages: Home → Browse → Listing → Chat → Sell → Inbox → Profile, each with its own URL.

## Run the static prototype
1. Open `index.html` in Chrome/Edge.
2. For the best demo, use a local server (VS Code Live Server is ideal).
3. Click **Explore deals**, open a listing, and demonstrate chat + Make Offer.
4. Click **Sell something** to demonstrate the seller flow.

## Suggested 3-minute demo
1. Start on the hero: explain the WhatsApp problem.
2. Filter to Books and search for “DSA”.
3. Open the DSA listing and make an offer below asking price.
4. Show the seller reply in the chat.
5. Return to Browse and click Sell something.
6. Add a sample listing live.
7. End on the Trust section: verified campus identity + ratings + safe meet-up spots.

## Important prototype note
The seller persona “Riya” is explicitly marked fictional. Before claiming real user research in a submission, interview at least one real campus student and replace the prototype assumptions with their exact pain points/quotes.

## Tech
- Full-stack: Node.js 18+, Express, server-rendered HTML, cookie sessions, JSON datastore, vanilla JS on the client. No build step.
- Static prototype: HTML5 + CSS3 + vanilla JavaScript.
