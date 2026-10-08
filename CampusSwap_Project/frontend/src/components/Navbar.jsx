import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/format";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/browse", label: "Browse" },
  { to: "/inbox", label: "Inbox" },
  { to: "/sell", label: "Sell" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="CampusSwap home">
        <span className="brand-mark">CS</span>
        <span>
          <strong>Campus</strong>Swap
        </span>
      </Link>
      <nav className="main-nav" aria-label="Primary">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="account-area">
        {user ? (
          <div className="account-menu">
            <Link className="account-chip" to="/profile">
              <span className="avatar small">{initials(user.name)}</span>
              <span className="account-name">{user.name}</span>
            </Link>
            <button className="ghost-btn small" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : (
          <div className="account-menu">
            <Link className="ghost-btn small" to="/login">
              Log in
            </Link>
            <Link className="primary-btn small" to="/register">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
