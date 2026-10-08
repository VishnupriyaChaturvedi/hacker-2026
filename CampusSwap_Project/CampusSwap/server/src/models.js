'use strict';

const { db, nowIso } = require('./store');
const { hashPassword, verifyPassword, newId } = require('./security');
const { DEMO_USERS, buildSeedListings } = require('./seed');

const CATEGORIES = ['Books', 'Gadgets', 'Hostel', 'Cycles', 'Stationery', 'Other'];
const CONDITIONS = ['Like new', 'Good', 'Used'];
const LISTING_STATUSES = ['active', 'sold', 'removed'];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

class ValidationError extends Error {
  constructor(fields) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.status = 422;
    this.fields = fields;
  }
}

function str(value) {
  return value == null ? '' : String(value).trim();
}

function validateRegister(input) {
  const fields = {};
  const name = str(input.name);
  const email = str(input.email).toLowerCase();
  const campus = str(input.campus);
  const password = String(input.password || '');

  if (name.length < 2) fields.name = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fields.email = 'Enter a valid email address.';
  if (campus.length < 2) fields.campus = 'Tell us which campus you are from.';
  if (password.length < 6)
    fields.password = 'Password must be at least 6 characters.';
  if (Object.keys(fields).length) throw new ValidationError(fields);
  return { name, email, campus, password };
}

function validateListing(input) {
  const fields = {};
  const name = str(input.name);
  const category = str(input.category);
  const condition = str(input.condition);
  const desc = str(input.desc);
  const price = Number(input.price);

  if (name.length < 3) fields.name = 'Give your item a clear name.';
  if (!CATEGORIES.includes(category)) fields.category = 'Choose a category.';
  if (!CONDITIONS.includes(condition)) fields.condition = 'Choose a condition.';
  if (!Number.isFinite(price) || price < 1 || price > 1000000)
    fields.price = 'Enter a price between 1 and 1,000,000.';
  if (desc.length < 5) fields.desc = 'Add a short description.';
  if (desc.length > 600) fields.desc = 'Description is too long (max 600).';
  if (Object.keys(fields).length) throw new ValidationError(fields);
  return { name, category, condition, desc, price: Math.round(price) };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const users = {
  byEmail(email) {
    const normalized = str(email).toLowerCase();
    return db.findOne('users', (u) => u.email === normalized);
  },
  byId(id) {
    return db.find('users', id);
  },
  create(data) {
    const existing = users.byEmail(data.email);
    if (existing) {
      throw new ValidationError({ email: 'An account with this email already exists.' });
    }
    const user = {
      id: newId('u'),
      name: data.name,
      email: str(data.email).toLowerCase(),
      campus: data.campus,
      course: str(data.course) || 'Not specified',
      year: str(data.year) || 'Not specified',
      bio: str(data.bio) || '',
      meetup: str(data.meetup) || 'Main gate',
      rating: 0,
      trades: 0,
      verified: false,
      passwordHash: hashPassword(data.password),
      createdAt: nowIso()
    };
    db.insert('users', user);
    db.flush();
    return publicUser(user);
  },
  authenticate(email, password) {
    const user = users.byEmail(email);
    if (!user) return null;
    if (!verifyPassword(password, user.passwordHash)) return null;
    return publicUser(user);
  },
  update(id, patch) {
    const user = db.find('users', id);
    if (!user) return null;
    const allowed = ['name', 'campus', 'course', 'year', 'bio', 'meetup'];
    for (const key of allowed) {
      if (patch[key] != null && str(patch[key]) !== '') user[key] = str(patch[key]);
    }
    db.flush();
    return publicUser(user);
  }
};

/** Strip private fields before sending a user anywhere near the browser. */
function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    campus: user.campus,
    course: user.course,
    year: user.year,
    bio: user.bio,
    meetup: user.meetup,
    rating: user.rating,
    trades: user.trades,
    verified: user.verified,
    createdAt: user.createdAt
  };
}

function initials(name) {
  const parts = str(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CS';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

function decorateListing(listing) {
  const seller = users.byId(listing.sellerId) || {};
  return {
    id: listing.id,
    name: listing.name,
    category: listing.category,
    price: listing.price,
    condition: listing.condition,
    desc: listing.desc,
    image: listing.image || '',
    status: listing.status,
    watch: listing.watch || 0,
    createdAt: listing.createdAt,
    sellerId: listing.sellerId,
    seller: {
      id: seller.id,
      name: seller.name,
      initials: initials(seller.name),
      rating: seller.rating,
      trades: seller.trades,
      verified: seller.verified,
      campus: seller.campus,
      meetup: seller.meetup
    }
  };
}

const listings = {
  all(filters = {}) {
    const q = str(filters.q).toLowerCase();
    const category = str(filters.category);
    const sort = str(filters.sort) || 'newest';

    let rows = db.all('listings').filter((l) => l.status !== 'removed');

    if (filters.status) {
      rows = rows.filter((l) => l.status === filters.status);
    } else if (!filters.includeAll) {
      rows = rows.filter((l) => l.status !== 'removed');
    }

    if (category && category !== 'All') {
      rows = rows.filter((l) => l.category === category);
    }
    if (q) {
      rows = rows.filter((l) => {
        const seller = users.byId(l.sellerId);
        const haystack = `${l.name} ${l.desc} ${l.category} ${seller ? seller.name : ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    if (sort === 'price-asc') rows.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') rows.sort((a, b) => b.price - a.price);
    else rows.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return rows.map(decorateListing);
  },
  byId(id) {
    const listing = db.find('listings', id);
    return listing ? decorateListing(listing) : null;
  },
  rawById(id) {
    return db.find('listings', id);
  },
  bySeller(sellerId) {
    return db
      .filter('listings', (l) => l.sellerId === sellerId && l.status !== 'removed')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map(decorateListing);
  },
  create(sellerId, data) {
    const listing = {
      id: newId('l'),
      sellerId,
      ...data,
      image: '',
      status: 'active',
      watch: 0,
      createdAt: nowIso()
    };
    db.insert('listings', listing);
    db.flush();
    return decorateListing(listing);
  },
  update(id, sellerId, patch) {
    const listing = db.find('listings', id);
    if (!listing) return null;
    if (listing.sellerId !== sellerId) {
      const err = new Error('You can only edit your own listings.');
      err.status = 403;
      throw err;
    }
    const allowed = ['name', 'category', 'price', 'condition', 'desc', 'status', 'image'];
    for (const key of allowed) {
      if (patch[key] !== undefined) listing[key] = patch[key];
    }
    db.flush();
    return decorateListing(listing);
  },
  setStatus(id, sellerId, status) {
    if (!LISTING_STATUSES.includes(status)) {
      throw new ValidationError({ status: 'Invalid status.' });
    }
    return listings.update(id, sellerId, { status });
  },
  toggleWatch(id) {
    const listing = db.find('listings', id);
    if (!listing) return null;
    listing.watch = (listing.watch || 0) + 1;
    db.flush();
    return decorateListing(listing);
  },
  stats() {
    const active = db.all('listings').filter((l) => l.status === 'active');
    const sellers = new Set(active.map((l) => l.sellerId));
    const totalWatch = active.reduce((sum, l) => sum + (l.watch || 0), 0);
    const traded = db.all('listings').filter((l) => l.status === 'sold');
    return {
      activeListings: active.length,
      sellers: sellers.size,
      watching: totalWatch,
      sold: traded.length
    };
  }
};

// ---------------------------------------------------------------------------
// Chats & messages
// ---------------------------------------------------------------------------

function decorateMessage(message) {
  return {
    id: message.id,
    chatId: message.chatId,
    senderId: message.senderId,
    type: message.type,
    text: message.text,
    amount: message.amount == null ? null : message.amount,
    createdAt: message.createdAt
  };
}

const chats = {
  between(listingId, buyerId, sellerId) {
    return db.findOne(
      'chats',
      (c) =>
        c.listingId === listingId &&
        c.buyerId === buyerId &&
        c.sellerId === sellerId
    );
  },
  findOrCreate(listingId, buyerId, sellerId) {
    const existing = chats.between(listingId, buyerId, sellerId);
    if (existing) return existing;
    const chat = {
      id: newId('c'),
      listingId,
      buyerId,
      sellerId,
      createdAt: nowIso(),
      lastMessageAt: nowIso()
    };
    db.insert('chats', chat);
    db.flush();
    return chat;
  },
  byId(id) {
    return db.find('chats', id);
  },
  forUser(userId) {
    const rows = db
      .filter('chats', (c) => c.buyerId === userId || c.sellerId === userId)
      .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
    return rows.map((chat) => {
      const listing = listings.byId(chat.listingId) || { name: 'Removed listing' };
      const otherId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
      const other = publicUser(users.byId(otherId)) || { name: 'Unknown user' };
      const messages = chats.messages(chat.id);
      const last = messages[messages.length - 1] || null;
      return {
        id: chat.id,
        listingId: chat.listingId,
        listingName: listing.name,
        other,
        role: chat.buyerId === userId ? 'buyer' : 'seller',
        lastMessage: last,
        messageCount: messages.length,
        lastMessageAt: chat.lastMessageAt
      };
    });
  },
  access(chatId, userId) {
    const chat = chats.byId(chatId);
    if (!chat) return null;
    if (chat.buyerId !== userId && chat.sellerId !== userId) return null;
    return chat;
  },
  messages(chatId) {
    return db
      .filter('messages', (m) => m.chatId === chatId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map(decorateMessage);
  },
  addMessage(chatId, senderId, payload) {
    const chat = chats.byId(chatId);
    if (!chat) return null;
    if (chat.buyerId !== senderId && chat.sellerId !== senderId) return null;
    const message = {
      id: newId('m'),
      chatId,
      senderId,
      type: payload.type === 'offer' ? 'offer' : 'text',
      text: str(payload.text).slice(0, 1000),
      amount: payload.amount == null ? null : Number(payload.amount),
      createdAt: nowIso()
    };
    db.insert('messages', message);
    chat.lastMessageAt = message.createdAt;
    db.flush();
    return decorateMessage(message);
  },
  /** Listing-savvy auto reply so the prototype feels alive without a second user. */
  autoReply(chatId, listing) {
    const chat = chats.byId(chatId);
    if (!chat) return null;
    const messages = chats.messages(chatId);
    const last = messages[messages.length - 1];
    if (!last || last.senderId !== chat.buyerId) return null;

    let text;
    if (last.type === 'offer' && last.amount) {
      text =
        last.amount >= listing.price * 0.85
          ? `₹${last.amount.toLocaleString('en-IN')} works — let's do it! 🎉 When can you meet at ${listing.seller.meetup || 'campus'}?`
          : `I can come down a little but not that low. How about ₹${Math.round(
              listing.price * 0.9
            ).toLocaleString('en-IN')}?`;
    } else {
      text = `Yes, "${listing.name}" is still available. Happy to meet near ${
        listing.seller.meetup || 'campus'
      }.`;
    }
    return chats.addMessage(chatId, chat.sellerId, { type: 'text', text });
  }
};

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

function ensureSeed() {
  const fresh = db.all('users').length === 0 && db.all('listings').length === 0;
  if (!fresh) return false;

  const createdAt = nowIso();
  for (const demo of DEMO_USERS) {
    const { password, ...rest } = demo;
    db.insert('users', {
      ...rest,
      passwordHash: hashPassword(password),
      createdAt
    });
  }
  for (const listing of buildSeedListings()) {
    db.insert('listings', listing);
  }
  db.flush();
  return true;
}

module.exports = {
  CATEGORIES,
  CONDITIONS,
  LISTING_STATUSES,
  ValidationError,
  users,
  publicUser,
  initials,
  listings,
  chats,
  ensureSeed,
  validateRegister,
  validateListing
};
