'use strict';

const config = require('../config');

/** Escape untrusted text before it touches HTML. */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(value) {
  const n = Number(value) || 0;
  return '₹' + n.toLocaleString('en-IN');
}

function timeAgo(iso) {
  const then = Date.parse(iso);
  if (!then) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
}

const NAV = [
  { href: '/', label: 'Home', match: '/' },
  { href: '/browse', label: 'Browse', match: '/browse' },
  { href: '/inbox', label: 'Inbox', match: '/inbox' },
  { href: '/sell', label: 'Sell', match: '/sell' }
];

function navLinks(active) {
  return NAV.map(
    (item) =>
      `<a href="${item.href}" class="${
        item.match === active ? 'active' : ''
      }">${esc(item.label)}</a>`
  ).join('');
}

function accountArea(user) {
  if (user) {
    return `
      <div class="account-menu">
        <a class="account-chip" href="/profile">
          <span class="avatar small">${esc(initials(user.name))}</span>
          <span class="account-name">${esc(user.name)}</span>
        </a>
        <form method="post" action="/logout" class="inline-form">
          <button class="ghost-btn small" type="submit">Log out</button>
        </form>
      </div>`;
  }
  return `
    <div class="account-menu">
      <a class="ghost-btn small" href="/login">Log in</a>
      <a class="primary-btn small" href="/register">Sign up</a>
    </div>`;
}

function initials(name) {
  const parts = String(name || '').split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CS';
  return (
    (parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
  ).toUpperCase();
}

function toastHost() {
  return `<div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

function flashHost(flash) {
  if (!flash) return '';
  return `<div class="flash flash-${esc(flash.type || 'info')}" id="flash">${esc(
    flash.message
  )}</div>`;
}

/**
 * Render a full HTML document.
 * @param {object} opts
 * @param {string} opts.title
 * @param {object|null} opts.user
 * @param {string} opts.active
 * @param {string} opts.body
 * @param {string} [opts.pageScript] name of a script in public/js to load
 * @param {object} [opts.flash]
 */
function renderPage(opts) {
  const {
    title,
    user = null,
    active = '',
    body = '',
    pageScript = null,
    flash = null
  } = opts;

  const scriptTag = pageScript
    ? `<script src="/js/${pageScript}" defer></script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} · ${esc(config.brand)}</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="/" aria-label="CampusSwap home">
        <span class="brand-mark">CS</span>
        <span><strong>Campus</strong>Swap</span>
      </a>
      <nav class="main-nav" aria-label="Primary">${navLinks(active)}</nav>
      <div class="account-area">${accountArea(user)}</div>
    </header>
    ${flash ? `<div class="flash-wrap">${flashHost(flash)}</div>` : ''}
    <main class="page-main">
      ${body}
    </main>
    <footer>
      <div><span class="brand-mark">CS</span><b>CampusSwap</b></div>
      <span>Built for campus commerce · Prototype</span>
      <span>© ${new Date().getFullYear()} CampusSwap</span>
    </footer>
  </div>
  ${toastHost()}
  <script src="/js/common.js" defer></script>
  ${scriptTag}
</body>
</html>`;
}

module.exports = { esc, money, timeAgo, renderPage, initials, navLinks };
