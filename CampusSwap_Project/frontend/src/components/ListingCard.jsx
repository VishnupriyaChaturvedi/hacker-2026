import { Link } from "react-router-dom";
import { initials, money, timeAgo } from "../utils/format";

export function ListingCard({ listing, showManage = false, onWatch, onToggleSold }) {
  const href = `/listing/${listing.id}`;
  const sold = listing.status === "sold";

  return (
    <article className="listing">
      <Link className="listing-media" to={href} aria-label={listing.name}>
        <div className={`listing-image ${listing.category.toLowerCase()}`}>
          {listing.category.toUpperCase()} · {listing.seller.initials || initials(listing.seller.name)}
        </div>
        {sold && <span className="status-badge sold">Sold</span>}
      </Link>
      <div className="listing-body">
        <span className="tag">{listing.category}</span>
        <h3>
          <Link to={href}>{listing.name}</Link>
        </h3>
        <p className="listing-desc">{listing.description}</p>
        <div className="price-row">
          <span className="price">{money(listing.price)}</span>
          <span className="condition">{listing.condition}</span>
        </div>
        <div className="seller">
          <span className="avatar">{listing.seller.initials || initials(listing.seller.name)}</span>
          <div className="seller-meta">
            <b>{listing.seller.name}</b>
            <small>
              {listing.seller.verified ? "✓ verified" : "pending"} ·{" "}
              {listing.seller.rating ? `${listing.seller.rating} ★` : "new seller"}
            </small>
          </div>
          {showManage ? (
            <div className="card-manage">
              <Link className="ghost-btn small" to={href}>
                View
              </Link>
              <button
                className="ghost-btn small"
                type="button"
                onClick={() => onToggleSold && onToggleSold(listing)}
              >
                {sold ? "Relist" : "Mark sold"}
              </button>
            </div>
          ) : (
            <Link className="chat-btn" to={href}>
              View &amp; chat
            </Link>
          )}
        </div>
        <div className="card-foot">
          <span>👀 {listing.watch} watching</span>
          <span>{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </article>
  );
}

export function EmptyState({ title, message, to, actionLabel }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
      {to && (
        <Link className="primary-btn" to={to}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SectionHead({ eyebrow, title, children }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children ? <div className="filters">{children}</div> : null}
    </div>
  );
}
