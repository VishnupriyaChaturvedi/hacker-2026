'use strict';

const express = require('express');
const pages = require('../views/pages');
const {
  users,
  listings,
  chats,
  publicUser,
  validateRegister,
  validateListing,
  ValidationError
} = require('../models');
const { requireAuth, requireGuest } = require('../middleware');

const router = express.Router();

function view(res, html, status = 200) {
  res.status(status).type('html').send(html);
}

// ---- Home -----------------------------------------------------------------

router.get('/', (req, res) => {
  const stats = listings.stats();
  const featured = listings.all({ sort: 'newest' });
  view(
    res,
    pages.renderHome({ user: req.user, stats, featured, flash: req.flash })
  );
});

// ---- Browse ---------------------------------------------------------------

router.get('/browse', (req, res) => {
  const filters = {
    q: req.query.q || '',
    category: req.query.category || 'All',
    sort: req.query.sort || 'newest'
  };
  const listingRows = listings.all(filters);
  view(
    res,
    pages.renderBrowse({ user: req.user, listingRows, filters, flash: req.flash })
  );
});

// ---- Listing detail -------------------------------------------------------

router.get('/listing/:id', (req, res) => {
  const listing = listings.byId(req.params.id);
  if (!listing) return notFound(req, res);
  const isOwner = req.user && req.user.id === listing.sellerId;
  const existingChat =
    req.user && !isOwner
      ? chats.between(listing.id, req.user.id, listing.sellerId)
      : null;
  view(
    res,
    pages.renderListing({
      user: req.user,
      listing,
      isOwner,
      existingChat,
      flash: req.flash
    })
  );
});

router.post('/listing/:id/watch', (req, res) => {
  const listing = listings.toggleWatch(req.params.id);
  if (!listing) return notFound(req, res);
  res.flash('success', `You are now watching “${listing.name}”.`);
  res.redirect(`/listing/${encodeURIComponent(listing.id)}`);
});

router.post('/listing/:id/chat', requireAuth, (req, res) => {
  const listing = listings.byId(req.params.id);
  if (!listing) return notFound(req, res);
  if (listing.sellerId === req.user.id) {
    res.flash('info', 'This is your own listing.');
    return res.redirect(`/listing/${encodeURIComponent(listing.id)}`);
  }
  const chat = chats.findOrCreate(listing.id, req.user.id, listing.sellerId);
  if (!chats.messages(chat.id).length) {
    chats.addMessage(chat.id, listing.sellerId, {
      type: 'text',
      text: `Hi! Yes, “${listing.name}” is still available. Happy to meet near ${
        listing.seller.meetup || 'campus'
      }.`
    });
  }
  res.redirect(`/chat/${encodeURIComponent(chat.id)}`);
});

// ---- Sell -----------------------------------------------------------------

router.get('/sell', requireAuth, (req, res) => {
  view(
    res,
    pages.renderSell({ user: req.user, values: {}, errors: null, flash: req.flash })
  );
});

router.post('/sell', requireAuth, (req, res) => {
  try {
    const data = validateListing(req.body);
    const listing = listings.create(req.user.id, data);
    res.flash('success', 'Listing published — your campus can now find it!');
    res.redirect(`/listing/${encodeURIComponent(listing.id)}`);
  } catch (err) {
    if (err instanceof ValidationError) {
      return view(
        res,
        pages.renderSell({
          user: req.user,
          values: req.body,
          errors: err.fields,
          flash: { type: 'error', message: 'Please fix the highlighted fields.' }
        }),
        422
      );
    }
    throw err;
  }
});

// ---- Inbox & chat ---------------------------------------------------------

router.get('/inbox', requireAuth, (req, res) => {
  const chatRows = chats.forUser(req.user.id);
  view(
    res,
    pages.renderInbox({ user: req.user, chatRows, flash: req.flash })
  );
});

router.get('/chat/:id', requireAuth, (req, res) => {
  const chat = chats.access(req.params.id, req.user.id);
  if (!chat) return notFound(req, res);
  const listing = listings.byId(chat.listingId);
  if (!listing) return notFound(req, res);
  view(
    res,
    pages.renderChat({
      user: req.user,
      chat,
      listing,
      messages: chats.messages(chat.id),
      flash: req.flash
    })
  );
});

router.post('/chat/:id/messages', requireAuth, (req, res) => {
  const chat = chats.access(req.params.id, req.user.id);
  if (!chat) return notFound(req, res);
  const listing = listings.byId(chat.listingId);
  const text = String(req.body.text || '').trim();
  const amount = req.body.amount != null && req.body.amount !== ''
    ? Number(req.body.amount)
    : null;

  if (!text && !amount) {
    res.status(422).json({ error: 'Message is empty.' });
    return;
  }
  const type = amount ? 'offer' : 'text';
  const message = chats.addMessage(chat.id, req.user.id, { type, text, amount });
  // Auto-reply from the seller so a single-user demo still feels alive.
  if (listing && chat.sellerId !== req.user.id) {
    setTimeout(() => {
      try {
        chats.autoReply(chat.id, listing);
      } catch (err) {
        console.error('[chat] auto-reply failed:', err.message);
      }
    }, 600);
  }
  res.status(201).json({ message });
});

router.get('/api/chat/:id/messages', requireAuth, (req, res) => {
  const chat = chats.access(req.params.id, req.user.id);
  if (!chat) return notFound(res);
  res.json({ messages: chats.messages(chat.id) });
});

// ---- Profile --------------------------------------------------------------

router.get('/profile', requireAuth, (req, res) => {
  const myListings = listings.bySeller(req.user.id);
  view(
    res,
    pages.renderProfile({
      user: req.user,
      profileUser: req.user,
      myListings,
      isSelf: true,
      flash: req.flash
    })
  );
});

router.post('/profile', requireAuth, (req, res) => {
  users.update(req.user.id, req.body);
  res.flash('success', 'Profile updated.');
  res.redirect('/profile');
});

router.get('/profile/:id', (req, res) => {
  const profileUser = publicUser(users.byId(req.params.id));
  if (!profileUser) return notFound(req, res);
  const isSelf = req.user && req.user.id === profileUser.id;
  if (isSelf) return res.redirect('/profile');
  const myListings = listings.bySeller(profileUser.id);
  view(
    res,
    pages.renderProfile({
      user: req.user,
      profileUser,
      myListings,
      isSelf: false,
      flash: req.flash
    })
  );
});

// ---- Listings management --------------------------------------------------

router.post('/listings/:id/sold', requireAuth, (req, res) => {
  const listing = listings.rawById(req.params.id);
  if (!listing) return notFound(req, res);
  const nextStatus = listing.status === 'sold' ? 'active' : 'sold';
  listings.setStatus(listing.id, req.user.id, nextStatus);
  res.flash(
    'success',
    nextStatus === 'sold' ? 'Marked as sold. 🎉' : 'Listing is active again.'
  );
  res.redirect('/profile');
});

// ---- Auth -----------------------------------------------------------------

router.get('/login', requireGuest, (req, res) => {
  view(
    res,
    pages.renderLogin({
      user: req.user,
      values: {},
      errors: null,
      flash: req.flash,
      next: req.query.next || ''
    })
  );
});

router.post('/login', requireGuest, (req, res) => {
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');
  const nextUrl = safeNext(req.body.next);
  const account = users.authenticate(email, password);
  if (!account) {
    return view(
      res,
      pages.renderLogin({
        user: null,
        values: { email },
        errors: { form: 'Incorrect email or password.' },
        flash: null,
        next: nextUrl
      }),
      401
    );
  }
  req.login(account.id);
  res.flash('success', `Welcome back, ${account.name.split(' ')[0]}!`);
  res.redirect(nextUrl || '/browse');
});

router.get('/register', requireGuest, (req, res) => {
  view(
    res,
    pages.renderRegister({
      user: req.user,
      values: {},
      errors: null,
      flash: req.flash
    })
  );
});

router.post('/register', requireGuest, (req, res) => {
  try {
    const data = validateRegister(req.body);
    const account = users.create(data);
    req.login(account.id);
    res.flash('success', 'Welcome to CampusSwap! Post your first item.');
    res.redirect('/sell');
  } catch (err) {
    if (err instanceof ValidationError) {
      return view(
        res,
        pages.renderRegister({
          user: null,
          values: req.body,
          errors: err.fields,
          flash: { type: 'error', message: 'Please fix the highlighted fields.' }
        }),
        422
      );
    }
    throw err;
  }
});

router.post('/logout', (req, res) => {
  req.logout();
  res.flash('info', 'You have been logged out.');
  res.redirect('/');
});

// ---- Helpers --------------------------------------------------------------

function notFound(req, res) {
  view(res, pages.renderError({ user: req.user, status: 404, message: 'Page not found' }), 404);
}

function safeNext(value) {
  const next = String(value || '');
  if (next.startsWith('/') && !next.startsWith('//')) return next;
  return '';
}

module.exports = router;
