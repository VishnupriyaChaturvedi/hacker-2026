import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ListingCard } from "../components/ListingCard";
import { initials } from "../utils/format";

export default function ProfilePage() {
  const { id } = useParams();
  const { user, setUser, refresh } = useAuth();
  const toast = useToast();

  const isSelf = !id || String(user?.id) === String(id);
  const profileId = id || user?.id;

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    let active = true;
    api
      .user(profileId)
      .then((res) => {
        if (!active) return;
        setProfile(res.user);
        setListings(res.listings);
      })
      .catch((err) => toast(err.message));
    return () => {
      active = false;
    };
  }, [profileId, toast]);

  useEffect(() => {
    if (profile) {
      setEdit({
        campus: profile.campus,
        course: profile.course,
        year: profile.year,
        meetup: profile.meetup,
        bio: profile.bio,
      });
    }
  }, [profile]);

  if (!profile) return <div className="loading-page">Loading…</div>;

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateMe(edit);
      setProfile(updated);
      setUser(updated);
      await refresh();
      toast("Profile updated.");
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleSold(listing) {
    try {
      const updated = await api.updateListing(listing.id, {
        status: listing.status === "sold" ? "active" : "sold",
      });
      setListings((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
      toast(updated.status === "sold" ? "Marked as sold. 🎉" : "Listing is active again.");
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <section className="profile-page">
      <aside className="profile-card">
        <div className="profile-hero">
          <div className="avatar xl">{initials(profile.name)}</div>
          <h1>{profile.name}</h1>
          <p>
            {profile.course} · {profile.year}
          </p>
          <span className="verified-pill">
            {profile.verified ? "✓ Verified student" : "⏳ Verification pending"}
          </span>
        </div>
        <div className="profile-stats">
          <div>
            <strong>{profile.rating ? profile.rating : "—"}</strong>
            <span>rating</span>
          </div>
          <div>
            <strong>{profile.trades}</strong>
            <span>trades</span>
          </div>
          <div>
            <strong>{listings.length}</strong>
            <span>listings</span>
          </div>
        </div>
        <div className="rating-row">
          <span>Campus</span>
          <b>{profile.campus}</b>
        </div>
        <div className="rating-row">
          <span>Email</span>
          <b>{isSelf ? profile.email || user?.email : "hidden"}</b>
        </div>
        <div className="rating-row">
          <span>Preferred meet-up</span>
          <b>{profile.meetup || "Main gate"}</b>
        </div>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        {isSelf && edit && (
          <form className="profile-edit" onSubmit={saveProfile}>
            <label>
              Campus
              <input
                value={edit.campus}
                onChange={(e) => setEdit({ ...edit, campus: e.target.value })}
              />
            </label>
            <label>
              Course
              <input
                value={edit.course}
                onChange={(e) => setEdit({ ...edit, course: e.target.value })}
              />
            </label>
            <label>
              Year
              <input
                value={edit.year}
                onChange={(e) => setEdit({ ...edit, year: e.target.value })}
              />
            </label>
            <label>
              Meet-up spot
              <input
                value={edit.meetup}
                onChange={(e) => setEdit({ ...edit, meetup: e.target.value })}
              />
            </label>
            <label>
              Bio
              <textarea
                maxLength={300}
                value={edit.bio}
                onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
              />
            </label>
            <button className="primary-btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        )}
      </aside>

      <div className="profile-listings">
        <div className="section-head">
          <div>
            <span className="eyebrow">{isSelf ? "YOUR LISTINGS" : "LISTINGS"}</span>
            <h2>{isSelf ? "Things you are selling" : `Items from ${profile.name}`}</h2>
          </div>
          {isSelf && (
            <div className="filters">
              <Link className="filter" to="/sell">
                + New listing
              </Link>
            </div>
          )}
        </div>
        <div className="listing-grid">
          {listings.length ? (
            listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                showManage={isSelf}
                onToggleSold={toggleSold}
              />
            ))
          ) : (
            <div className="empty-state">
              <h3>{isSelf ? "You have no listings" : "No listings"}</h3>
              <p>
                {isSelf
                  ? "Post your first item and it will show up here."
                  : "This seller has nothing up right now."}
              </p>
              {isSelf && (
                <Link className="primary-btn" to="/sell">
                  Post an item
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
