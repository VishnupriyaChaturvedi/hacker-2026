"""End-to-end smoke test for the CampusSwap FastAPI backend.

Run the server first, then:
    .venv\\Scripts\\python.exe test_api.py
"""

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000/api/v1"


def call(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as res:
            raw = res.read().decode()
            return res.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


passed = 0
failed = 0


def check(label, condition, extra=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {label}")
    else:
        failed += 1
        print(f"  FAIL  {label}  {extra}")


print("\n== Meta ==")
status, meta = call("GET", "/meta")
check("GET /meta", status == 200 and "Books" in meta["categories"], status)

print("\n== Listings ==")
status, res = call("GET", "/listings")
check("GET /listings", status == 200 and res["count"] >= 8, res.get("count"))

status, books = call("GET", "/listings?category=Books")
check("filter by category", status == 200 and all(l["category"] == "Books" for l in books["listings"]))

status, search = call("GET", "/listings?q=casio")
check("search 'casio'", status == 200 and any("Casio" in l["name"] for l in search["listings"]))

status, asc = call("GET", "/listings?sort=price-asc")
prices = [l["price"] for l in asc["listings"]]
check("sort price-asc", prices == sorted(prices))

status, stats = call("GET", "/listings/stats")
check("GET /listings/stats", status == 200 and stats["active_listings"] >= 8)

status, one = call("GET", "/listings/1")
check("GET /listings/1", status == 200 and one["seller"]["name"], status)

status, missing = call("GET", "/listings/99999")
check("404 for missing listing", status == 404)

print("\n== Auth ==")
status, bad = call("POST", "/auth/login", {"email": "ananya@campus.edu", "password": "wrong"})
check("reject wrong password", status == 401, status)

status, login = call("POST", "/auth/login", {"email": "ananya@campus.edu", "password": "campus123"})
check("login demo user", status == 200 and login["access_token"], status)
token = login["access_token"] if status == 200 else None

status, me = call("GET", "/users/me", token=token)
check("GET /users/me", status == 200 and me["email"] == "ananya@campus.edu", status)

status, unauth = call("GET", "/users/me")
check("401 without token", status == 401, status)

# Register a fresh user
import random

suffix = random.randint(1000, 9999)
new_email = f"tester{suffix}@campus.edu"
status, reg = call("POST", "/auth/register", {
    "name": "Test Tester", "email": new_email, "campus": "Test College", "password": "secret123",
})
check("register new user", status == 201 and reg["access_token"], status)
new_token = reg["access_token"] if status == 201 else None

status, dup = call("POST", "/auth/register", {
    "name": "Dup", "email": new_email, "campus": "Test", "password": "secret123",
})
check("reject duplicate email", status == 409, status)

status, inval = call("POST", "/auth/register", {
    "name": "Bad", "email": "not-an-email", "campus": "Test", "password": "secret123",
})
check("reject invalid email", status == 422, status)

print("\n== Listings (write) ==")
status, created = call("POST", "/listings", {
    "name": "Test Microscope", "category": "Gadgets", "condition": "Good",
    "price": 1200, "description": "Lab microscope, barely used.",
}, token=new_token)
check("create listing", status == 201 and created["id"], status)
listing_id = created["id"] if status == 201 else None

status, forbidden = call("PATCH", f"/listings/{listing_id}", {"price": 1000}, token=token)
check("cannot edit others' listing", status == 403, status)

status, edited = call("PATCH", f"/listings/{listing_id}", {"price": 1100}, token=new_token)
check("owner can edit listing", status == 200 and edited["price"] == 1100, status)

status, watched = call("POST", f"/listings/{listing_id}/watch")
check("watch increments", status == 200 and watched["watch"] == 1, status)

print("\n== Chats & offers ==")
# ananya chats on the new user's listing
status, chat = call("POST", "/chats", {"listing_id": listing_id}, token=token)
check("start chat", status == 201 and chat["chat_id"], status)
check("greeting auto-created", status == 201 and len(chat["messages"]) >= 1)
chat_id = chat["chat_id"] if status == 201 else None

status, own = call("POST", "/chats", {"listing_id": listing_id}, token=new_token)
check("cannot chat own listing", status == 400, status)

status, msg = call("POST", f"/chats/{chat_id}/messages", {"text": "Is this available?"}, token=token)
check("send text message", status == 201 and msg["type"] == "text", status)

status, offer = call("POST", f"/chats/{chat_id}/messages", {"text": "", "amount": 1000}, token=token)
check("send offer", status == 201 and offer["type"] == "offer" and offer["amount"] == 1000, status)

status, empty = call("POST", f"/chats/{chat_id}/messages", {"text": ""}, token=token)
check("reject empty message", status == 422, status)

status, msgs = call("GET", f"/chats/{chat_id}/messages", token=token)
check("list messages incl. auto-reply", status == 200 and len(msgs) >= 3, len(msgs) if status == 200 else status)

status, inbox = call("GET", "/chats", token=token)
check("inbox returns chat", status == 200 and any(c["id"] == chat_id for c in inbox), status)

status, denied = call("GET", f"/chats/{chat_id}/messages", token=None)
check("chat requires auth", status == 401, status)

print("\n== Users / profile ==")
status, pub = call("GET", f"/users/{reg['user']['id']}")
check("public profile", status == 200 and "email" not in pub["user"], list(pub.get("user", {}).keys()))

status, updated = call("PATCH", "/users/me", {"bio": "Updated bio", "meetup": "Canteen"}, token=new_token)
check("update profile", status == 200 and updated["bio"] == "Updated bio", status)

print("\n== Docs ==")
with urllib.request.urlopen("http://127.0.0.1:8000/openapi.json") as r:
    check("openapi.json served", r.status == 200)

print(f"\n{'=' * 40}")
print(f"  {passed} passed, {failed} failed")
print(f"{'=' * 40}\n")
sys.exit(1 if failed else 0)
