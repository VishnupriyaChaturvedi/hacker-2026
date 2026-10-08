'use strict';

const express = require('express');
const {
  listings,
  chats,
  publicUser,
  users,
  validateListing,
  ValidationError,
  CATEGORIES,
  CONDITIONS
} = require('../models');
const { requireAuth } = require('../middleware');

const router = express.Router();

function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

/**
 * Fire the seller's scripted auto-reply shortly after a buyer sends a message.
 * A short delay makes the conversation feel natural without blocking the
 * request. Only used when the sender is the buyer (not the seller replying).
 */
function scheduleAutoReply(chat, listing) {
  if (!chat || !listing || chat.sellerId === chat.buyerId) return;
  setTimeout(() => {
    try {
      chats.autoReply(chat.id, listing);
    } catch (err) {
      console.error('[chat] auto-reply failed:', err.message);
    }
  }, 600).unref?.();
}

// ---- Meta -----------------------------------------------------------------

router.get('/meta', (req, res) => {
  res.json({ categories: CATEGORIES, conditions: CONDITIONS });
});

// ---- Listings -------------------------------------------------------------

router.get('/listings', (req, res) => {
  const rows = listings.all({
    q: req.query.q,
    category: req.query.category,
    sort: req.query.sort,
    status: req.query.status
  });
  res.json({ listings: rows, count: rows.length });
});

router.get('/listings/:id', (req, res) => {
  const listing = listings.byId(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json({ listing });
});

router.post(
  '/listings',
  requireAuth,
  wrap((req, res) => {
    const data = validateListing(req.body);
    const listing = listings.create(req.user.id, data);
    res.status(201).json({ listing });
  })
);

router.patch(
  '/listings/:id',
  requireAuth,
  (req, res) => {
    try {
      const listing = listings.update(req.params.id, req.user.id, req.body);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      res.json({ listing });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// ---- Chats ----------------------------------------------------------------

router.get('/chats', requireAuth, (req, res) => {
  res.json({ chats: chats.forUser(req.user.id) });
});

router.post('/chats', requireAuth, (req, res) => {
  const listing = listings.byId(req.body.listingId);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.sellerId === req.user.id) {
    return res.status(400).json({ error: 'Cannot chat on your own listing' });
  }
  const chat = chats.findOrCreate(listing.id, req.user.id, listing.sellerId);
  res.status(201).json({ chat: { id: chat.id }, messages: chats.messages(chat.id) });
});

router.get('/chats/:id/messages', requireAuth, (req, res) => {
  const chat = chats.access(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json({ messages: chats.messages(chat.id) });
});

router.post('/chats/:id/messages', requireAuth, (req, res) => {
  const chat = chats.access(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  const listing = listings.byId(chat.listingId);
  const text = String(req.body.text || '').trim();
  const amount =
    req.body.amount != null && req.body.amount !== '' ? Number(req.body.amount) : null;
  if (!text && !amount) return res.status(422).json({ error: 'Message is empty' });
  const message = chats.addMessage(chat.id, req.user.id, {
    type: amount ? 'offer' : 'text',
    text,
    amount
  });
  scheduleAutoReply(chat, listing);
  res.status(201).json({ message });
});

// ---- Users ----------------------------------------------------------------

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.get('/users/:id', (req, res) => {
  const user = publicUser(users.byId(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user, listings: listings.bySeller(user.id) });
});

module.exports = router;
