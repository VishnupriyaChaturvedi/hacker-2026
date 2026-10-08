'use strict';

const crypto = require('crypto');

// ---- password hashing (scrypt, salted, per-user) -------------------------

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const derived = crypto.scryptSync(String(password), salt, 64);
    const expected = Buffer.from(hash, 'hex');
    if (expected.length !== derived.length) return false;
    return crypto.timingSafeEqual(expected, derived);
  } catch (_) {
    return false;
  }
}

// ---- signed cookie sessions ----------------------------------------------

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createSessionToken(secret) {
  const id = crypto.randomBytes(24).toString('base64url');
  const signature = sign(id, secret);
  return { id, token: `${id}.${signature}` };
}

function readSessionToken(token, secret) {
  if (typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const id = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(id, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

// ---- misc ----------------------------------------------------------------

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
  readSessionToken,
  newId
};
