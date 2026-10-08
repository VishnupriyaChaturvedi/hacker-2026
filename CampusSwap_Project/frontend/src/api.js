// Tiny fetch wrapper around the CampusSwap FastAPI backend.
// Attaches the JWT (if any) and normalizes errors.

const BASE = import.meta.env.VITE_API_BASE || "/api/v1";
const TOKEN_KEY = "campusswap_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function friendlyDetail(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  // FastAPI validation errors: array of {loc, msg}
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || String(d)).join(", ");
  }
  return String(detail);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      "Could not reach the server. Is the backend running on port 8000?",
      0
    );
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const detail =
      payload && typeof payload === "object" ? payload.detail : payload;
    throw new ApiError(friendlyDetail(detail), res.status, detail);
  }

  return payload;
}

export const api = {
  // meta
  meta: () => request("/meta", { auth: false }),

  // auth
  register: (data) =>
    request("/auth/register", { method: "POST", body: data, auth: false }),
  login: (data) =>
    request("/auth/login", { method: "POST", body: data, auth: false }),

  // listings
  listings: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return request(`/listings${qs ? `?${qs}` : ""}`, { auth: false });
  },
  stats: () => request("/listings/stats", { auth: false }),
  listing: (id) => request(`/listings/${id}`, { auth: false }),
  createListing: (data) =>
    request("/listings", { method: "POST", body: data }),
  updateListing: (id, data) =>
    request(`/listings/${id}`, { method: "PATCH", body: data }),
  watchListing: (id) => request(`/listings/${id}/watch`, { method: "POST" }),

  // users
  me: () => request("/users/me"),
  updateMe: (data) => request("/users/me", { method: "PATCH", body: data }),
  user: (id) => request(`/users/${id}`, { auth: false }),

  // chats
  chats: () => request("/chats"),
  startChat: (listingId) =>
    request("/chats", { method: "POST", body: { listing_id: listingId } }),
  messages: (chatId) => request(`/chats/${chatId}/messages`),
  sendMessage: (chatId, data) =>
    request(`/chats/${chatId}/messages`, { method: "POST", body: data }),
};
