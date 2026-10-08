import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { ListingCard, SectionHead } from "../components/ListingCard";
import { money } from "../utils/format";

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    Promise.all([api.stats(), api.listings({ sort: "newest" })])
      .then(([s, res]) => {
        setStats(s);
        setFeatured(res.listings);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">THE CAMPUS MARKETPLACE</span>
          <h1>
            Your campus.
            <br />
            <span>One smarter bazaar.</span>
          </h1>
          <p>
            Stop scrolling through buried WhatsApp messages. Discover student deals, verify
            who you're buying from, and bargain in one clean place.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn big" to="/browse">
              Explore deals <span>→</span>
            </Link>
            <Link className="ghost-btn" to="/sell">
              Post an item
            </Link>
          </div>
          <div className="trust-row">
            <span>✓ Campus-only profiles</span>
            <span>✓ Chat &amp; bargain</span>
            <span>✓ Meet-up friendly</span>
          </div>
        </div>
        <div className="hero-card-wrap">
          <div className="floating-note note-one">
            🔥 {stats ? stats.watching : 0} students watching
          </div>
          <div className="phone-card">
            <div className="phone-top">
              <span>CampusSwap</span>
              <span className="online-dot" />
            </div>
            <div className="mini-search">⌕ Search textbooks, calculators...</div>
            {featured.slice(0, 2).map((l) => (
              <div className="mini-item" key={l.id}>
                <div className={`mini-img ${l.category.toLowerCase()}`}>
                  {l.category.slice(0, 5).toUpperCase()}
                </div>
                <div>
                  <b>{l.name}</b>
                  <small>
                    {money(l.price)} · {l.condition}
                  </small>
                </div>
                <span>♡</span>
              </div>
            ))}
            <div className="mini-chat">
              <b>Buyer</b>
              <span>Can you do the last price?</span>
              <strong>Deal</strong>
            </div>
            <Link className="mini-btn" to="/browse">
              Make an offer
            </Link>
          </div>
          <div className="floating-note note-two">✓ Verified student</div>
        </div>
      </section>

      <section className="stats-strip">
        <div>
          <strong>{stats ? stats.active_listings : "—"}</strong>
          <span>active listings</span>
        </div>
        <div>
          <strong>{stats ? stats.sellers : "—"}</strong>
          <span>campus sellers</span>
        </div>
        <div>
          <strong>{stats ? stats.sold : "—"}</strong>
          <span>trades completed</span>
        </div>
        <div>
          <strong>{stats ? stats.watching : "—"}</strong>
          <span>item watches</span>
        </div>
      </section>

      <section className="section">
        <SectionHead
          eyebrow="FRESH ON CAMPUS"
          title="Deals students actually want."
        >
          <Link className="filter" to="/browse">
            View all →
          </Link>
        </SectionHead>
        <div className="listing-grid">
          {featured.slice(0, 4).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      <section className="how-section">
        <div className="section-head centered">
          <span className="eyebrow">NO MORE “IS THIS AVAILABLE?”</span>
          <h2>
            WhatsApp made the community.
            <br />
            CampusSwap fixes the chaos.
          </h2>
        </div>
        <div className="steps">
          <div className="step">
            <span>01</span>
            <div className="step-icon">✦</div>
            <h3>Post once</h3>
            <p>Seller adds condition, price and a preferred campus meet-up spot.</p>
          </div>
          <div className="step">
            <span>02</span>
            <div className="step-icon">⌕</div>
            <h3>Browse clearly</h3>
            <p>Buyers filter real listings instead of hunting through hundreds of messages.</p>
          </div>
          <div className="step">
            <span>03</span>
            <div className="step-icon">↗</div>
            <h3>Bargain in chat</h3>
            <p>Make an offer, counter, accept or decline — with the item always visible.</p>
          </div>
          <div className="step">
            <span>04</span>
            <div className="step-icon">✓</div>
            <h3>Meet with trust</h3>
            <p>Verified campus profiles, ratings and public meet-up spots reduce awkwardness.</p>
          </div>
        </div>
      </section>

      <section className="owner-section">
        <div className="owner-card">
          <span className="eyebrow">THE REAL OWNER</span>
          <h2>Meet Riya — the student behind the WhatsApp chaos.</h2>
          <p>
            Riya runs a tiny student resale hustle from her hostel floor. She sells used
            textbooks, calculators and lab gear to juniors.
          </p>
          <div className="quote">
            “I don’t hate WhatsApp. I hate answering the same question 20 times after my post
            is buried.”
          </div>
          <small>— Riya, 3rd-year student seller · fictional persona for the prototype</small>
        </div>
        <div className="pain-points">
          <div>
            <span>01</span>
            <b>Posts disappear</b>
            <p>A great deal gets buried under memes and exam reminders.</p>
          </div>
          <div>
            <span>02</span>
            <b>Prices get lost</b>
            <p>Buyers ask “how much?” even when the price was in yesterday’s message.</p>
          </div>
          <div>
            <span>03</span>
            <b>No buyer confidence</b>
            <p>New students don't know who is genuine, active or reliable.</p>
          </div>
        </div>
      </section>

      {!user && (
        <section className="cta-band">
          <div>
            <h2>Ready to trade smarter?</h2>
            <p>Create a campus profile to post listings and bargain in chat.</p>
          </div>
          <div className="cta-actions">
            <Link className="primary-btn big" to="/register">
              Create account
            </Link>
            <Link className="ghost-btn" to="/login">
              Log in
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
