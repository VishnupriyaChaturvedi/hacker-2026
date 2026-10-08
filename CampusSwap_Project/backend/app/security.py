"""Password hashing and JWT access tokens (no third-party auth dependency)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Password hashing — PBKDF2-HMAC-SHA256 with a per-user salt.
# ---------------------------------------------------------------------------

_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return f"pbkdf2_sha256${_ITERATIONS}${salt.hex()}${derived.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iterations, salt_hex, hash_hex = str(stored).split("$")
        if scheme != "pbkdf2_sha256":
            return False
        derived = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(derived.hex(), hash_hex)
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# JWT (HS256) — dependency-free implementation.
# ---------------------------------------------------------------------------


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_access_token(
    subject: str | int, secret: str, expires_minutes: int, extra: Optional[dict] = None
) -> str:
    now = int(time.time())
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": now + expires_minutes * 60,
    }
    if extra:
        payload.update(extra)

    header = {"alg": "HS256", "typ": "JWT"}
    segments = [
        _b64url_encode(json.dumps(header, separators=(",", ":")).encode()),
        _b64url_encode(json.dumps(payload, separators=(",", ":")).encode()),
    ]
    signing_input = ".".join(segments).encode()
    signature = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    segments.append(_b64url_encode(signature))
    return ".".join(segments)


def decode_access_token(token: str, secret: str) -> Optional[dict]:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}".encode()
        expected = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _b64url_decode(signature_b64)):
            return None
        payload = json.loads(_b64url_decode(payload_b64))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None
