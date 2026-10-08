'use strict';

const { esc, money, timeAgo, renderPage, initials } = require('./layout');
const { listingCard, emptyState, sectionHead } = require('./components');
const { CATEGORIES, CONDITIONS } = require('../models');

const CATEGORY_ICONS = {
  Books: '📚',
  Gadgets: '🔌',
  Hostel: '🛏️',
  Cycles: '🚲',
  Stationery: '✏️',
  Other: '📦'
};

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

function renderHome({ user, stats, featured }) {
  const body = `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">THE CAMPUS MARKETPLACE</span>
        <h1>Your campus.<br><span>One smarter bazaar.</span></h1>
        <p>Stop scrolling through buried WhatsApp messages. Discover student deals, verify who you're buying from, and bargain in one clean place.</p>
        <div class="hero-actions">
          <a class="primary-btn big" href="/browse">Explore deals <span>→</span></a>
          <a class="ghost-btn" href="/sell">Post an item</a>
        </div>
        <div class="trust-row">
          <span>✓ Campus-only profiles</span><span>✓ Chat &amp; bargain</span><span>✓ Meet-up friendly</span>
        </div>
      </div>
      <div class="hero-card-wrap">
        <div class="floating-note note-one">🔥 ${stats.watching} students watching</div>
        <div class="phone-card">
          <div class="phone-top"><span>CampusSwap</span><span class="online-dot"></span></div>
          <div class="mini-search">⌕ Search textbooks, calculators...</div>
          ${featured
            .slice(0, 2)
            .map(
              (l) => `<div class="mini-item">
            <div class="mini-img ${esc(l.category.toLowerCase())}">${esc(
                l.category.slice(0, 5).toUpperCase()
              )}</div>
            <div><b>${esc(l.name)}</b><small>${money(l.price)} · ${esc(
                l.condition
              )}</small></div>
            <span>♡</span>
          </div>`
            )
            .join('')}
          <div class="mini-chat"><b>Buyer</b><span>Can you do the last price?</span><strong>Deal</strong></div>
          <a class="mini-btn" href="/browse">Make an offer</a>
        </div>
        <div class="floating-note note-two">✓ Verified student</div>
      </div>
    </section>

    <section class="stats-strip">
      <div><strong>${stats.activeListings}</strong><span>active listings</span></div>
      <div><strong>${stats.sellers}</strong><span>campus sellers</span></div>
      <div><strong>${stats.sold}</strong><span>trades completed</span></div>
      <div><strong>${stats.watching}</strong><span>item watches</span></div>
    </section>

    <section class="section">
      ${sectionHead(
        'FRESH ON CAMPUS',
        'Deals students actually want.',
        `<a class="filter" href="/browse">View all →</a>`
      )}
      <div class="listing-grid">
        ${
          featured.length
            ? featured.slice(0, 4).map((l) => listingCard(l)).join('')
            : emptyState(
                'No listings yet',
                'Be the first to post an item on campus.',
                '/sell',
                'Post an item'
              )
        }
      </div>
    </section>

    <section class="how-section">
      <div class="section-head centered"><span class="eyebrow">NO MORE “IS THIS AVAILABLE?”</span><h2>WhatsApp made the community.<br>CampusSwap fixes the chaos.</h2></div>
      <div class="steps">
        <div class="step"><span>01</span><div class="step-icon">✦</div><h3>Post once</h3><p>Seller adds condition, price and a preferred campus meet-up spot.</p></div>
        <div class="step"><span>02</span><div class="step-icon">⌕</div><h3>Browse clearly</h3><p>Buyers filter real listings instead of hunting through hundreds of group messages.</p></div>
        <div class="step"><span>03</span><div class="step-icon">↗</div><h3>Bargain in chat</h3><p>Make an offer, counter, accept or decline — with the item and price always visible.</p></div>
        <div class="step"><span>04</span><div class="step-icon">✓</div><h3>Meet with trust</h3><p>Verified campus profiles, ratings and public meet-up spots reduce the awkwardness.</p></div>
      </div>
    </section>

    <section class="owner-section">
      <div class="owner-card"><span class="eyebrow">THE REAL OWNER</span><h2>Meet Riya — the student behind the WhatsApp chaos.</h2><p>Riya runs a tiny student resale hustle from her hostel floor. She sells used textbooks, calculators and lab gear to juniors.</p><div class="quote">“I don’t hate WhatsApp. I hate answering the same question 20 times after my post is buried.”</div><small>— Riya, 3rd-year student seller · fictional persona for the prototype</small></div>
      <div class="pain-points"><div><span>01</span><b>Posts disappear</b><p>A great deal gets buried under memes and exam reminders.</p></div><div><span>02</span><b>Prices get lost</b><p>Buyers ask “how much?” even when the price was in yesterday’s message.</p></div><div><span>03</span><b>No buyer confidence</b><p>New students don't know who is genuine, active or reliable.</p></div></div>
    </section>

    ${
      user
        ? ''
        : `<section class="cta-band">
            <div>
              <h2>Ready to trade smarter?</h2>
              <p>Create a campus profile to post listings and bargain in chat.</p>
            </div>
            <div class="cta-actions">
              <a class="primary-btn big" href="/register">Create account</a>
              <a class="ghost-btn" href="/login">Log in</a>
            </div>
          </section>`
    }
  `;

  return renderPage({ title: 'Buy. Sell. Bargain.', user, active: '/', body });
}

// ---------------------------------------------------------------------------
// Browse
// ---------------------------------------------------------------------------

function renderBrowse({ user, listingRows, filters }) {
  const { q = '', category = 'All', sort = 'newest' } = filters;
  const pill = (value, label) => {
    const active = (category || 'All') === value ? 'active' : '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('category', value);
    if (sort) params.set('sort', sort);
    return `<a class="filter ${active}" href="/browse?${params.toString()}">${esc(
      label
    )}</a>`;
  };

  const body = `
    <section class="section">
      ${sectionHead(
        'FRESH ON CAMPUS',
        q ? `Results for “${q}”` : 'Deals students actually want.',
        pill('All', 'All') +
          CATEGORIES.filter((c) => c !== 'Other')
            .map((c) => pill(c, CATEGORY_ICONS[c] + ' ' + c))
            .join('')
      )}
      <form class="search-row" method="get" action="/browse">
        <input type="hidden" name="category" value="${esc(category || 'All')}" />
        <input type="hidden" name="sort" value="${esc(sort || 'newest')}" />
        <div class="search-box">⌕
          <input id="searchInput" name="q" value="${esc(
            q
          )}" placeholder="Search textbooks, calculators, cycles..." />
        </div>
        <button class="primary-btn" type="submit">Search</button>
        <div class="sort-wrap">
          <label class="sr-only" for="sortSelect">Sort</label>
          <select id="sortSelect" name="sort" class="sort-select" onchange="this.form.submit()">
            <option value="newest" ${sort === 'newest' ? 'selected' : ''}>Sort: newest</option>
            <option value="price-asc" ${
              sort === 'price-asc' ? 'selected' : ''
            }>Price: low → high</option>
            <option value="price-desc" ${
              sort === 'price-desc' ? 'selected' : ''
            }>Price: high → low</option>
          </select>
        </div>
      </form>
      <p class="result-count">${listingRows.length} listing${
        listingRows.length === 1 ? '' : 's'
      } found</p>
      <div class="listing-grid">
        ${
          listingRows.length
            ? listingRows.map((l) => listingCard(l)).join('')
            : emptyState(
                'No matching listings',
                'Try a different search or category.',
                '/browse',
                'Clear filters'
              )
        }
      </div>
    </section>
  `;

  return renderPage({
    title: 'Browse',
    user,
    active: '/browse',
    body,
    pageScript: 'browse.js'
  });
}

// ---------------------------------------------------------------------------
// Listing detail
// ---------------------------------------------------------------------------

function renderListing({ user, listing, isOwner, existingChat, flash }) {
  const seller = listing.seller;
  const startChatAction = user
    ? isOwner
      ? `<a class="ghost-btn" href="/profile">Manage in profile</a>`
      : `<form method="post" action="/listing/${encodeURIComponent(
          listing.id
        )}/chat" class="inline-form">
           <button class="primary-btn big" type="submit">💬 Chat with seller</button>
         </form>`
    : `<a class="primary-btn big" href="/login?next=${encodeURIComponent(
        '/listing/' + listing.id
      )}">Log in to chat</a>`;

  const body = `
    <nav class="crumbs"><a href="/browse">Browse</a> <span>›</span> <a href="/browse?category=${encodeURIComponent(
      listing.category
    )}">${esc(listing.category)}</a> <span>›</span> <span>${esc(
    listing.name
  )}</span></nav>

    <section class="detail">
      <div class="detail-media">
        <div class="listing-image large ${esc(listing.category.toLowerCase())}">
          ${esc(listing.category.toUpperCase())} · ${esc(seller.initials)}
        </div>
        <div class="detail-badges">
          <span class="tag">${esc(listing.category)}</span>
          <span class="condition">${esc(listing.condition)}</span>
          ${
            listing.status === 'sold'
              ? '<span class="status-badge sold">Sold</span>'
              : ''
          }
        </div>
      </div>

      <div class="detail-info">
        <h1>${esc(listing.name)}</h1>
        <div class="detail-price-row">
          <span class="price big">${money(listing.price)}</span>
          <span class="watch-count">👀 ${listing.watch} watching</span>
        </div>
        <p class="detail-desc">${esc(listing.desc)}</p>
        <div class="detail-meta">
          <div><span>Posted</span><b>${timeAgo(listing.createdAt)}</b></div>
          <div><span>Meet-up</span><b>${esc(seller.meetup || 'Main gate')}</b></div>
          <div><span>Category</span><b>${esc(listing.category)}</b></div>
        </div>
        <div class="detail-actions">
          ${startChatAction}
          <form method="post" action="/listing/${encodeURIComponent(
            listing.id
          )}/watch" class="inline-form">
            <button class="ghost-btn" type="submit">♡ Watch this item</button>
          </form>
        </div>
        ${
          existingChat && !isOwner
            ? `<p class="hint">You already have a chat about this item — <a href="/chat/${encodeURIComponent(
                existingChat.id
              )}">open it</a>.</p>`
            : ''
        }
      </div>

      <aside class="seller-card">
        <div class="profile-top">
          <div class="avatar">${esc(seller.initials)}</div>
          <div><b>${esc(seller.name)}</b><span>${esc(
    seller.campus || 'Campus member'
  )}</span></div>
          <strong>${seller.rating ? seller.rating + ' ★' : 'New'}</strong>
        </div>
        <div class="rating-row"><span>Trades completed</span><b>${
          seller.trades
        }</b></div>
        <div class="rating-row"><span>Preferred meet-up</span><b>${esc(
          seller.meetup || 'Main gate'
        )}</b></div>
        <div class="safe-banner">${
          seller.verified ? '🛡 Campus verified seller' : '⏳ Verification pending'
        }</div>
      </aside>
    </section>
  `;

  return renderPage({
    title: listing.name,
    user,
    active: '/browse',
    body,
    flash,
    pageScript: 'listing.js'
  });
}

// ---------------------------------------------------------------------------
// Sell
// ---------------------------------------------------------------------------

function renderSell({ user, values, errors, flash }) {
  const v = values || {};
  const err = (field) =>
    errors && errors[field] ? `<small class="field-error">${esc(errors[field])}</small>` : '';

  const body = `
    <section class="form-page">
      <div class="form-intro">
        <span class="eyebrow">LIST AN ITEM</span>
        <h1>Turn your unused stuff into campus cash.</h1>
        <p>Post once and let buyers find you. You can mark an item sold or relist it anytime from your profile.</p>
        <ul class="form-tips">
          <li>Write a clear name and condition.</li>
          <li>Set a fair price — you can bargain in chat.</li>
          <li>Pick a public meet-up spot for safety.</li>
        </ul>
      </div>
      <form class="card-form" method="post" action="/sell" novalidate>
        <label>Item name
          <input name="name" required minlength="3" value="${esc(v.name || '')}" placeholder="e.g. Engineering Mathematics book" />
          ${err('name')}
        </label>
        <div class="two-col">
          <label>Category
            <select name="category">
              ${CATEGORIES.map(
                (c) =>
                  `<option ${v.category === c ? 'selected' : ''}>${esc(c)}</option>`
              ).join('')}
            </select>
            ${err('category')}
          </label>
          <label>Price (₹)
            <input name="price" type="number" min="1" step="1" required value="${esc(
              v.price || ''
            )}" placeholder="500" />
            ${err('price')}
          </label>
        </div>
        <label>Condition
          <select name="condition">
            ${CONDITIONS.map(
              (c) =>
                `<option ${v.condition === c ? 'selected' : ''}>${esc(c)}</option>`
            ).join('')}
          </select>
          ${err('condition')}
        </label>
        <label>Short description
          <textarea name="desc" required minlength="5" maxlength="600" placeholder="Mention edition, accessories, usage, etc.">${esc(
            v.desc || ''
          )}</textarea>
          ${err('desc')}
        </label>
        <button class="primary-btn big" type="submit">Publish listing →</button>
      </form>
    </section>
  `;

  return renderPage({
    title: 'Sell an item',
    user,
    active: '/sell',
    body,
    flash
  });
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

function renderInbox({ user, chatRows, flash }) {
  const body = `
    <section class="section narrow">
      ${sectionHead('CAMPUS CHAT', 'Your conversations')}
      ${
        chatRows.length
          ? `<div class="chat-list">${chatRows
              .map(
                (c) => `
            <a class="chat-list-item" href="/chat/${encodeURIComponent(c.id)}">
              <span class="avatar">${esc(initials(c.other.name))}</span>
              <div class="chat-list-body">
                <div class="chat-list-top">
                  <b>${esc(c.other.name)}</b>
                  <small>${timeAgo(c.lastMessageAt)}</small>
                </div>
                <span class="chat-list-item-name">${esc(c.listingName)}</span>
                <p>${
                  c.lastMessage
                    ? esc(
                        (c.lastMessage.type === 'offer' && c.lastMessage.amount
                          ? '💰 Offer: '
                          : '') +
                          (c.lastMessage.text ||
                            money(c.lastMessage.amount || 0))
                      )
                    : 'Say hello 👋'
                }</p>
              </div>
              <span class="role-pill">${esc(c.role)}</span>
            </a>`
              )
              .join('')}</div>`
          : emptyState(
              'No conversations yet',
              'Open a listing and start chatting with a seller.',
              '/browse',
              'Browse listings'
            )
      }
    </section>
  `;
  return renderPage({ title: 'Inbox', user, active: '/inbox', body, flash });
}

// ---------------------------------------------------------------------------
// Chat thread
// ---------------------------------------------------------------------------

function renderChat({ user, chat, listing, messages, flash }) {
  const other = chat.buyerId === user.id ? listing.seller : null;
  const conversationBubbles = messages
    .map((m) => {
      const mine = m.senderId === user.id;
      if (m.type === 'offer') {
        return `<div class="bubble offer ${
          mine ? 'buyer' : 'seller'
        }">💰 Offer: ${money(m.amount || m.text)}</div>`;
      }
      return `<div class="bubble ${mine ? 'buyer' : 'seller'}">${esc(
        m.text
      )}</div>`;
    })
    .join('');

  const body = `
    <nav class="crumbs"><a href="/inbox">Inbox</a> <span>›</span> <span>${esc(
      listing.name
    )}</span></nav>
    <section class="chat-page">
      <div class="chat-card">
        <div class="chat-head">
          <div>
            <span class="eyebrow">CAMPUS CHAT</span>
            <h2>${esc(chat.buyerId === user.id ? listing.seller.name : 'Buyer')}</h2>
          </div>
          <span class="verified-pill">${
            listing.seller.verified ? '✓ Verified seller' : '⏳ Pending'
          }</span>
        </div>
        <a class="deal-bar" href="/listing/${encodeURIComponent(listing.id)}">
          <span>${esc(listing.name)}</span>
          <strong>${money(listing.price)}</strong>
        </a>
        <div class="messages" id="messages" data-chat-id="${esc(chat.id)}" data-listing-id="${esc(
    listing.id
  )}" data-user-id="${esc(user.id)}">
          ${
            messages.length
              ? conversationBubbles
              : '<p class="chat-empty">No messages yet. Make an offer or say hello 👋</p>'
          }
        </div>
        <form class="offer-row" id="offerForm">
          <input id="offerInput" name="amount" type="number" min="1" placeholder="Enter your offer (₹)" />
          <button type="submit">Make offer</button>
        </form>
        <form class="message-row" id="messageForm">
          <input id="messageInput" name="text" placeholder="Write a message..." autocomplete="off" />
          <button type="submit">Send</button>
        </form>
      </div>
      <aside class="chat-side">
        <div class="profile-top">
          <div class="avatar">${esc(listing.seller.initials)}</div>
          <div><b>${esc(listing.seller.name)}</b><span>${esc(
    listing.seller.campus || 'Campus member'
  )}</span></div>
          <strong>${listing.seller.rating ? listing.seller.rating + ' ★' : 'New'}</strong>
        </div>
        <div class="rating-row"><span>Meet-up</span><b>${esc(
          listing.seller.meetup || 'Main gate'
        )}</b></div>
        <div class="rating-row"><span>Trades</span><b>${
          listing.seller.trades
        }</b></div>
        <div class="safe-banner">${
          listing.seller.verified ? '🛡 Campus verified seller' : '⏳ Pending'
        }</div>
        <a class="ghost-btn block" href="/listing/${encodeURIComponent(
          listing.id
        )}">View listing</a>
      </aside>
    </section>
  `;

  return renderPage({
    title: 'Chat',
    user,
    active: '/inbox',
    body,
    flash,
    pageScript: 'chat.js'
  });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

function renderProfile({ user, profileUser, myListings, isSelf, flash }) {
  const body = `
    <section class="profile-page">
      <aside class="profile-card">
        <div class="profile-hero">
          <div class="avatar xl">${esc(initials(profileUser.name))}</div>
          <h1>${esc(profileUser.name)}</h1>
          <p>${esc(profileUser.course)} · ${esc(profileUser.year)}</p>
          <span class="verified-pill">${
            profileUser.verified ? '✓ Verified student' : '⏳ Verification pending'
          }</span>
        </div>
        <div class="profile-stats">
          <div><strong>${
            profileUser.rating ? profileUser.rating : '—'
          }</strong><span>rating</span></div>
          <div><strong>${profileUser.trades}</strong><span>trades</span></div>
          <div><strong>${myListings.length}</strong><span>listings</span></div>
        </div>
        <div class="rating-row"><span>Campus</span><b>${esc(
          profileUser.campus
        )}</b></div>
        <div class="rating-row"><span>Email</span><b>${esc(
          isSelf ? profileUser.email : 'hidden'
        )}</b></div>
        <div class="rating-row"><span>Preferred meet-up</span><b>${esc(
          profileUser.meetup || 'Main gate'
        )}</b></div>
        ${
          profileUser.bio
            ? `<p class="profile-bio">${esc(profileUser.bio)}</p>`
            : ''
        }
        ${
          isSelf
            ? `<form class="profile-edit" method="post" action="/profile">
                 <label>Campus<input name="campus" value="${esc(
                   profileUser.campus
                 )}" /></label>
                 <label>Course<input name="course" value="${esc(
                   profileUser.course
                 )}" /></label>
                 <label>Year<input name="year" value="${esc(
                   profileUser.year
                 )}" /></label>
                 <label>Meet-up spot<input name="meetup" value="${esc(
                   profileUser.meetup || ''
                 )}" /></label>
                 <label>Bio<textarea name="bio" maxlength="300">${esc(
                   profileUser.bio || ''
                 )}</textarea></label>
                 <button class="primary-btn" type="submit">Save profile</button>
               </form>`
            : ''
        }
      </aside>

      <div class="profile-listings">
        ${sectionHead(
          isSelf ? 'YOUR LISTINGS' : 'LISTINGS',
          isSelf ? 'Things you are selling' : `Items from ${profileUser.name}`,
          isSelf ? `<a class="filter" href="/sell">+ New listing</a>` : ''
        )}
        <div class="listing-grid">
          ${
            myListings.length
              ? myListings
                  .map((l) => listingCard(l, { showManage: isSelf }))
                  .join('')
              : emptyState(
                  isSelf ? 'You have no listings' : 'No listings',
                  isSelf
                    ? 'Post your first item and it will show up here.'
                    : 'This seller has nothing up right now.',
                  isSelf ? '/sell' : null,
                  'Post an item'
                )
          }
        </div>
      </div>
    </section>
  `;
  return renderPage({
    title: profileUser.name,
    user,
    active: isSelf ? '/profile' : '',
    body,
    flash
  });
}

// ---------------------------------------------------------------------------
// Login / Register
// ---------------------------------------------------------------------------

function authShell(title, content) {
  return `
  <section class="auth-page">
    <div class="auth-card">
      <a class="brand center" href="/"><span class="brand-mark">CS</span> CampusSwap</a>
      <h1>${esc(title)}</h1>
      ${content}
    </div>
  </section>`;
}

function renderLogin({ user, values, errors, flash, next }) {
  const err = (f) => (errors && errors[f] ? `<small class="field-error">${esc(errors[f])}</small>` : '');
  const content = `
    <form method="post" action="/login" novalidate>
      <input type="hidden" name="next" value="${esc(next || '')}" />
      <label>Email
        <input name="email" type="email" required value="${esc(
          (values && values.email) || ''
        )}" placeholder="you@campus.edu" />
        ${err('email')}
      </label>
      <label>Password
        <input name="password" type="password" required placeholder="••••••••" />
        ${err('password')}
      </label>
      ${err('form')}
      <button class="primary-btn big" type="submit">Log in →</button>
    </form>
    <p class="auth-switch">New here? <a href="/register">Create an account</a></p>
    <div class="demo-hint"><b>Demo account</b><span>ananya@campus.edu / campus123</span></div>`;
  return renderPage({
    title: 'Log in',
    user,
    active: '',
    body: authShell('Welcome back', content),
    flash
  });
}

function renderRegister({ user, values, errors, flash }) {
  const err = (f) => (errors && errors[f] ? `<small class="field-error">${esc(errors[f])}</small>` : '');
  const content = `
    <form method="post" action="/register" novalidate>
      <label>Full name
        <input name="name" required value="${esc(
          (values && values.name) || ''
        )}" placeholder="Your name" />
        ${err('name')}
      </label>
      <label>Campus
        <input name="campus" required value="${esc(
          (values && values.campus) || ''
        )}" placeholder="Your college / university" />
        ${err('campus')}
      </label>
      <label>Email
        <input name="email" type="email" required value="${esc(
          (values && values.email) || ''
        )}" placeholder="you@campus.edu" />
        ${err('email')}
      </label>
      <label>Password
        <input name="password" type="password" required minlength="6" placeholder="At least 6 characters" />
        ${err('password')}
      </label>
      ${err('form')}
      <button class="primary-btn big" type="submit">Create account →</button>
    </form>
    <p class="auth-switch">Already have an account? <a href="/login">Log in</a></p>`;
  return renderPage({
    title: 'Sign up',
    user,
    active: '',
    body: authShell('Join your campus marketplace', content),
    flash
  });
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

function renderError({ user, status, message }) {
  const body = `
    <section class="error-page">
      <span class="error-code">${esc(status)}</span>
      <h1>${esc(message || 'Something went wrong')}</h1>
      <p>The page you were looking for could not be found or you do not have access.</p>
      <div class="hero-actions">
        <a class="primary-btn big" href="/">Back to home</a>
        <a class="ghost-btn" href="/browse">Browse listings</a>
      </div>
    </section>`;
  return renderPage({ title: `Error ${status}`, user, active: '', body });
}

module.exports = {
  renderHome,
  renderBrowse,
  renderListing,
  renderSell,
  renderInbox,
  renderChat,
  renderProfile,
  renderLogin,
  renderRegister,
  renderError
};
