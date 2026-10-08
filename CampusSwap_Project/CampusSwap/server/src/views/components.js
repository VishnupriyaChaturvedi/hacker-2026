'use strict';

const { esc, money, timeAgo, initials } = require('./layout');

function listingCard(listing, options = {}) {
  const href = `/listing/${encodeURIComponent(listing.id)}`;
  const sold = listing.status === 'sold';
  const badge = sold
    ? '<span class="status-badge sold">Sold</span>'
    : '';
  const actions = options.showManage
    ? `<div class="card-manage">
         <a class="ghost-btn small" href="${href}">View</a>
         <form method="post" action="/listings/${encodeURIComponent(
           listing.id
         )}/sold" class="inline-form">
           <button class="ghost-btn small" type="submit">${
             sold ? 'Relist' : 'Mark sold'
           }</button>
         </form>
       </div>`
    : `<a class="chat-btn" href="${href}">View &amp; chat</a>`;

  return `
  <article class="listing">
    <a class="listing-media" href="${href}" aria-label="${esc(listing.name)}">
      <div class="listing-image ${esc(listing.category.toLowerCase())}">
        ${esc(listing.category.toUpperCase())} · ${esc(listing.seller.initials)}
      </div>
      ${badge}
    </a>
    <div class="listing-body">
      <span class="tag">${esc(listing.category)}</span>
      <h3><a href="${href}">${esc(listing.name)}</a></h3>
      <p class="listing-desc">${esc(listing.desc)}</p>
      <div class="price-row">
        <span class="price">${money(listing.price)}</span>
        <span class="condition">${esc(listing.condition)}</span>
      </div>
      <div class="seller">
        <span class="avatar">${esc(listing.seller.initials)}</span>
        <div class="seller-meta">
          <b>${esc(listing.seller.name)}</b>
          <small>${listing.seller.verified ? '✓ verified' : 'pending'} · ${
            listing.seller.rating ? listing.seller.rating + ' ★' : 'new seller'
          }</small>
        </div>
        ${actions}
      </div>
      <div class="card-foot">
        <span>👀 ${listing.watch} watching</span>
        <span>${timeAgo(listing.createdAt)}</span>
      </div>
    </div>
  </article>`;
}

function emptyState(title, message, actionHref, actionLabel) {
  return `
  <div class="empty-state">
    <h3>${esc(title)}</h3>
    <p>${esc(message)}</p>
    ${
      actionHref
        ? `<a class="primary-btn" href="${actionHref}">${esc(actionLabel)}</a>`
        : ''
    }
  </div>`;
}

function sectionHead(eyebrow, title, rightHtml = '') {
  return `
  <div class="section-head">
    <div><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(
      title
    )}</h2></div>
    ${rightHtml ? `<div class="filters">${rightHtml}</div>` : ''}
  </div>`;
}

function userChip(user) {
  return `<span class="avatar small">${esc(initials(user.name))}</span>`;
}

module.exports = { listingCard, emptyState, sectionHead, userChip };
