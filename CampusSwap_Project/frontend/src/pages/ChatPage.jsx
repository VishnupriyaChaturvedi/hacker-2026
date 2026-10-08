import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { initials, money } from "../utils/format";

export default function ChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [chatInfo, setChatInfo] = useState(null);
  const [text, setText] = useState("");
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  // Load chat meta from the inbox list (has listing name, other user, role).
  useEffect(() => {
    api
      .chats()
      .then((rows) => setChatInfo(rows.find((c) => String(c.id) === String(id)) || null))
      .catch(() => {});
  }, [id]);

  // Poll messages so seller replies appear without a refresh.
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const msgs = await api.messages(id);
        if (active) setMessages(msgs);
      } catch {
        /* ignore transient errors */
      }
    }
    load();
    const timer = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendText(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.sendMessage(id, { text });
      setText("");
      setMessages(await api.messages(id));
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendOffer(e) {
    e.preventDefault();
    const amount = Number(offer);
    if (!amount) return;
    setBusy(true);
    try {
      await api.sendMessage(id, { text: "", amount });
      setOffer("");
      setMessages(await api.messages(id));
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <nav className="crumbs">
        <Link to="/inbox">Inbox</Link> <span>›</span>{" "}
        <span>{chatInfo ? chatInfo.listing_name : "Chat"}</span>
      </nav>
      <section className="chat-page">
        <div className="chat-card">
          <div className="chat-head">
            <div>
              <span className="eyebrow">CAMPUS CHAT</span>
              <h2>{chatInfo ? chatInfo.other.name : "Chat"}</h2>
            </div>
            <span className="verified-pill">
              {chatInfo?.other.verified ? "✓ Verified" : "⏳ Pending"}
            </span>
          </div>
          {chatInfo && (
            <Link className="deal-bar" to={`/listing/${chatInfo.listing_id}`}>
              <span>{chatInfo.listing_name}</span>
              <strong>{chatInfo.other.meetup}</strong>
            </Link>
          )}
          <div className="messages">
            {messages.map((m) => {
              const mine = m.sender_id === user.id;
              if (m.type === "offer") {
                return (
                  <div className={`bubble offer ${mine ? "buyer" : "seller"}`} key={m.id}>
                    💰 Offer: {money(m.amount)}
                  </div>
                );
              }
              return (
                <div className={`bubble ${mine ? "buyer" : "seller"}`} key={m.id}>
                  {m.text}
                </div>
              );
            })}
            {!messages.length && <p className="chat-empty">No messages yet. Say hello 👋</p>}
            <div ref={bottomRef} />
          </div>
          <form className="offer-row" onSubmit={sendOffer}>
            <input
              type="number"
              min="1"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="Enter your offer (₹)"
            />
            <button type="submit" disabled={busy}>
              Make offer
            </button>
          </form>
          <form className="message-row" onSubmit={sendText}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              autoComplete="off"
            />
            <button type="submit" disabled={busy}>
              Send
            </button>
          </form>
        </div>

        {chatInfo && (
          <aside className="chat-side">
            <div className="profile-top">
              <div className="avatar">{initials(chatInfo.other.name)}</div>
              <div>
                <b>{chatInfo.other.name}</b>
                <span>{chatInfo.other.campus || "Campus member"}</span>
              </div>
              <strong>
                {chatInfo.other.rating ? `${chatInfo.other.rating} ★` : "New"}
              </strong>
            </div>
            <div className="rating-row">
              <span>Meet-up</span>
              <b>{chatInfo.other.meetup || "Main gate"}</b>
            </div>
            <div className="rating-row">
              <span>Trades</span>
              <b>{chatInfo.other.trades}</b>
            </div>
            <div className="safe-banner">
              {chatInfo.other.verified ? "🛡 Campus verified seller" : "⏳ Pending"}
            </div>
            <Link className="ghost-btn block" to={`/listing/${chatInfo.listing_id}`}>
              View listing
            </Link>
          </aside>
        )}
      </section>
    </>
  );
}
