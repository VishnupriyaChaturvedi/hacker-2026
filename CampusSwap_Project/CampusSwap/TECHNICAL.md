# Technical Notes

## Two implementations

### 1. Full-stack app (`server/`) — recommended
A real multipage backend:

- **Runtime:** Node.js 18+ with Express.
- **Rendering:** server-rendered HTML pages (one URL per page), enhanced with
  small vanilla-JS scripts.
- **Data:** a dependency-free atomic JSON datastore (`src/store.js`); swap for
  Postgres/SQLite in production.
- **Auth:** email + password (scrypt hashing), signed HTTP-only cookie sessions.
- **Chat:** REST API under `/api/v1`, polled by the browser for the prototype.
- **Validation & security:** server-side validation, CSRF tokens, authorization
  checks, HTML escaping, CSP and security headers.

Full details, the API reference and the production checklist live in
[`server/README.md`](server/README.md).

### 2. Static prototype (`index.html`, `styles.css`, `app.js`)
A single-page demo with no server. All state lives in memory and disappears on
reload. Useful for a quick visual pitch, but it cannot persist data or secure
anything.

## Production architecture suggestion
- Frontend: React / Next.js (or keep the server-rendered pages).
- Backend: Node.js + Express or Supabase.
- Database: PostgreSQL.
- Auth: Campus email / university SSO.
- Storage: object storage for listing photos.
- Realtime: WebSocket / Supabase Realtime (replace polling).
- Moderation: report/block workflow + admin queue.

## Trust model
A production app should never rely on a “verified” label without actual
verification. Connect the label to a real university email/SSO process, store
minimal identity data, and allow users to report/block accounts. The demo
`verified` flag is illustrative only.

## Security checklist
- [x] Authenticate every seller/buyer (sessions).
- [x] Authorize listing edits and chat access server-side.
- [x] Validate listing and registration input on the server.
- [x] Sanitize (HTML-escape) user-generated content.
- [x] CSRF protection on state-changing requests.
- [x] Password hashing (scrypt) and HTTP-only signed cookies.
- [ ] Validate uploaded image types and sizes (image upload not yet built).
- [ ] Rate-limit messages and listing creation.
- [ ] Report/block functionality.
- [ ] Never expose private student data publicly (only email is hidden; review
      all fields before real deployment).
