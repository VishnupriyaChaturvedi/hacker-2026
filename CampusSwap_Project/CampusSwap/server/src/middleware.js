'use strict';

const crypto = require('crypto');
const config = require('./config');
const { db } = require('./store');
const {
  createSessionToken,
  readSessionToken
} = require('./security');
const { users, chats } = require('./models');

// ---- cookie parsing -------------------------------------------------------

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  if (opts.secure || config.isProd) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

// ---- session + csrf -------------------------------------------------------

function sessionMiddleware(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  let sessionId = readSessionToken(cookies[config.cookieName], config.sessionSecret);
  let user = null;

  if (sessionId) {
    const session = db.getSession(sessionId);
    if (session) {
      user = users.byId(session.userId) || null;
    } else {
      sessionId = null;
    }
  }

  req.cookies = cookies;
  req.user = user;
  req.sessionId = sessionId;
  req.login = (userId) => {
    const { id, token } = createSessionToken(config.sessionSecret);
    db.setSession(id, userId, config.sessionTtlSec);
    setCookie(res, config.cookieName, token, {
      maxAge: config.sessionTtlSec
    });
    return id;
  };
  req.logout = () => {
    if (req.sessionId) db.destroySession(req.sessionId);
    setCookie(res, config.cookieName, '', { maxAge: 0 });
  };

  // CSRF token per session (or per visitor before login).
  let csrf = cookies.csrf_token;
  if (!csrf || !/^[a-f0-9]{32,}$/.test(csrf)) {
    csrf = crypto.randomBytes(24).toString('hex');
    setCookie(res, 'csrf_token', csrf, { httpOnly: false, maxAge: config.sessionTtlSec });
  }
  req.csrfToken = csrf;

  // Flash messages travel in a short-lived cookie.
  res.flash = (type, message) => {
    const payload = Buffer.from(JSON.stringify({ type, message })).toString(
      'base64url'
    );
    setCookie(res, 'flash', payload, { httpOnly: false, maxAge: 20 });
  };
  if (cookies.flash) {
    try {
      req.flash = JSON.parse(Buffer.from(cookies.flash, 'base64url').toString('utf8'));
    } catch (_) {
      req.flash = null;
    }
    setCookie(res, 'flash', '', { maxAge: 0 });
  } else {
    req.flash = null;
  }

  next();
}

function verifyCsrf(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const provided =
    (req.body && req.body._csrf) || req.get('x-csrf-token') || '';
  const expected = (req.cookies && req.cookies.csrf_token) || '';
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    const err = new Error('Invalid or missing CSRF token. Refresh the page and try again.');
    err.status = 403;
    return next(err);
  }
  next();
}

// ---- guards ---------------------------------------------------------------

function requireAuth(req, res, next) {
  if (req.user) return next();
  const isApi =
    (req.originalUrl || req.path || '').startsWith('/api') ||
    (req.get('accept') || '').includes('application/json');
  if (isApi) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const next_ = encodeURIComponent(req.originalUrl);
  res.redirect(`/login?next=${next_}`);
}

function requireGuest(req, res, next) {
  if (!req.user) return next();
  res.redirect('/');
}

// Attach the CSRF token to res.locals so views/templates can use it if needed.
function localsMiddleware(req, res, next) {
  res.locals.csrfToken = req.csrfToken;
  res.locals.user = req.user;
  res.locals.chats = chats;
  next();
}

module.exports = {
  parseCookies,
  setCookie,
  sessionMiddleware,
  verifyCsrf,
  requireAuth,
  requireGuest,
  localsMiddleware
};
