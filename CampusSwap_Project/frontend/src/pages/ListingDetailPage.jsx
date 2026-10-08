import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { money, timeAgo } from "../utils/format";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .listing(id)
      .then((l) => active && setListing(l))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <section className="error-page">
        <span className="error-code">404</span>
        <h1>{error}</h1>
        <div className="hero-actions">
          <Link className="primary-btn big" to="/browse">
            Browse listings
          </Link>
        </div>
      </section>
    );
  }

  if (!listing) return <div className="loading-page">Loading…</div>;

  const isOwner = user && user.id === listing.seller_id;

  async function startChat() {
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await api.startChat(listing.id);
      navigate(`/chat/${res.chat_id}`);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function watch() {
    try {
      const updated = await api.watchListing(listing.id);
      setListing(updated);
      toast(`You are now watching “${updated.name}”.`);
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <>
      <nav className="crumbs">
        <Link to="/browse">Browse</Link> <span>›</span>{" "}
        <Link to={`/browse?category=${encodeURIComponent(listing.category)}`}>
          {listing.category}
        </Link>{" "}
        <span>›</span> <span>{listing.name}</span>
      </nav>

      <section className="detail">
        <div className="detail-media">
          <div className={`listing-image large ${listing.category.toLowerCase()}`}>
            {listing.category.toUpperCase()} · {listing.seller.initials}
          </div>
          <div className="detail-badges">
            <span className="tag">{listing.category}</span>
            <span className="condition">{listing.condition}</span>
            {listing.status === "sold" && <span className="status-badge sold">Sold</span>}
          </div>
        </div>

        <div className="detail-info">
          <h1>{listing.name}</h1>
          <div className="detail-price-row">
            <span className="price big">{money(listing.price)}</span>
            <span className="watch-count">👀 {listing.watch} watching</span>
          </div>
          <p className="detail-desc">{listing.description}</p>
          <div className="detail-meta">
            <div>
              <span>Posted</span>
              <b>{timeAgo(listing.created_at)}</b>
            </div>
            <div>
              <span>Meet-up</span>
              <b>{listing.seller.meetup || "Main gate"}</b>
            </div>
            <div>
              <span>Category</span>
              <b>{listing.category}</b>
            </div>
          </div>
          <div className="detail-actions">
            {isOwner ? (
              <Link className="ghost-btn" to="/profile">
                Manage in profile
              </Link>
            ) : (
              <button className="primary-btn big" onClick={startChat} disabled={busy}>
                💬 Chat with seller
              </button>
            )}
            <button className="ghost-btn" onClick={watch}>
              ♡ Watch this item
            </button>
          </div>
        </div>

        <aside className="seller-card">
          <div className="profile-top">
            <div className="avatar">{listing.seller.initials}</div>
            <div>
              <b>
                <Link to={`/profile/${listing.seller.id}`}>{listing.seller.name}</Link>
              </b>
              <span>{listing.seller.campus || "Campus member"}</span>
            </div>
            <strong>{listing.seller.rating ? `${listing.seller.rating} ★` : "New"}</strong>
          </div>
          <div className="rating-row">
            <span>Trades completed</span>
            <b>{listing.seller.trades}</b>
          </div>
          <div className="rating-row">
            <span>Preferred meet-up</span>
            <b>{listing.seller.meetup || "Main gate"}</b>
          </div>
          <div className="safe-banner">
            {listing.seller.verified ? "🛡 Campus verified seller" : "⏳ Verification pending"}
          </div>
        </aside>
      </section>
    </>
  );
}
