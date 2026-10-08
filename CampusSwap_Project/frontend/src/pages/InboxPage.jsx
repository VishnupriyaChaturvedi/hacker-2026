import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { EmptyState, SectionHead } from "../components/ListingCard";
import { initials, money, timeAgo } from "../utils/format";

export default function InboxPage() {
  const [chats, setChats] = useState(null);

  useEffect(() => {
    api.chats().then(setChats).catch(() => setChats([]));
  }, []);

  if (chats === null) return <div className="loading-page">Loading…</div>;

  return (
    <section className="section narrow">
      <SectionHead eyebrow="CAMPUS CHAT" title="Your conversations" />
      {chats.length ? (
        <div className="chat-list">
          {chats.map((c) => (
            <Link className="chat-list-item" to={`/chat/${c.id}`} key={c.id}>
              <span className="avatar">{initials(c.other.name)}</span>
              <div className="chat-list-body">
                <div className="chat-list-top">
                  <b>{c.other.name}</b>
                  <small>{timeAgo(c.last_message_at)}</small>
                </div>
                <span className="chat-list-item-name">{c.listing_name}</span>
                <p>
                  {c.last_message
                    ? (c.last_message.type === "offer" && c.last_message.amount
                        ? "💰 Offer: "
                        : "") +
                      (c.last_message.text || money(c.last_message.amount || 0))
                    : "Say hello 👋"}
                </p>
              </div>
              <span className="role-pill">{c.role}</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No conversations yet"
          message="Open a listing and start chatting with a seller."
          to="/browse"
          actionLabel="Browse listings"
        />
      )}
    </section>
  );
}
