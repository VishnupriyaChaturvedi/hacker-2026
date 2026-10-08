// Formatting + small display helpers shared across pages.

export function money(value) {
  const n = Number(value) || 0;
  return "₹" + n.toLocaleString("en-IN");
}

export function timeAgo(iso) {
  const then = Date.parse(iso);
  if (!then) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function initials(name) {
  const parts = String(name || "")
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "CS";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export const CATEGORIES = ["Books", "Gadgets", "Hostel", "Cycles", "Stationery", "Other"];
export const CONDITIONS = ["Like new", "Good", "Used"];

export const CATEGORY_ICONS = {
  Books: "📚",
  Gadgets: "🔌",
  Hostel: "🛏️",
  Cycles: "🚲",
  Stationery: "✏️",
  Other: "📦",
};
