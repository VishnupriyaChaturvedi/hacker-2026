'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Tiny dependency-free JSON datastore.
 *
 * The whole database is kept in memory for fast reads and flushed to disk
 * atomically on every write. This is intentionally simple and perfect for a
 * prototype / single-instance deployment. Swap this module for Postgres or
 * SQLite when you outgrow it: the rest of the app only talks to `db`.
 */

const DEFAULT_DB = {
  meta: { version: 1, createdAt: null },
  users: [],
  listings: [],
  chats: [],
  messages: [],
  sessions: []
};

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class Store {
  constructor(file) {
    this.file = file;
    this.dir = path.dirname(file);
    this.tmp = `${file}.tmp`;
    this.data = clone(DEFAULT_DB);
    this._flushTimer = null;
  }

  load() {
    fs.mkdirSync(this.dir, { recursive: true });
    if (fs.existsSync(this.file)) {
      try {
        const raw = fs.readFileSync(this.file, 'utf8');
        const parsed = raw.trim() ? JSON.parse(raw) : {};
        this.data = Object.assign(clone(DEFAULT_DB), parsed);
      } catch (err) {
        // Never lose data silently: move the corrupt file aside and start clean.
        const backup = `${this.file}.corrupt-${Date.now()}`;
        try {
          fs.renameSync(this.file, backup);
          console.error(
            `[store] Could not parse ${this.file}. Moved to ${backup} and starting fresh.`
          );
        } catch (_) {
          console.error('[store] Could not parse database file:', err.message);
        }
        this.data = clone(DEFAULT_DB);
      }
    } else {
      this.data = clone(DEFAULT_DB);
    }
    if (!this.data.meta) this.data.meta = clone(DEFAULT_DB.meta);
    if (!this.data.meta.createdAt) this.data.meta.createdAt = nowIso();
    return this;
  }

  /**
   * Persist immediately. Call after grouping related in-memory changes so we
   * write the file once instead of on every primitive mutation.
   */
  flush() {
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      fs.writeFileSync(this.tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(this.tmp, this.file);
    } catch (err) {
      console.error('[store] Failed to persist database:', err.message);
    }
    return this;
  }

  // ---- generic collection helpers -------------------------------------

  all(collection) {
    return this.data[collection] || [];
  }

  find(collection, id) {
    return this.all(collection).find((row) => row.id === id) || null;
  }

  filter(collection, predicate) {
    return this.all(collection).filter(predicate);
  }

  findOne(collection, predicate) {
    return this.all(collection).find(predicate) || null;
  }

  insert(collection, row) {
    this.data[collection].push(row);
    return row;
  }

  remove(collection, predicate) {
    const before = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(
      (row) => !predicate(row)
    );
    return before - this.data[collection].length;
  }

  // ---- sessions (small, high churn) -----------------------------------

  getSession(id) {
    const s = this.find('sessions', id);
    if (!s) return null;
    if (s.expiresAt && Date.parse(s.expiresAt) < Date.now()) {
      this.remove('sessions', (row) => row.id === id);
      this.flush();
      return null;
    }
    return s;
  }

  setSession(id, userId, ttlSec) {
    this.remove('sessions', (row) => row.id === id);
    const session = {
      id,
      userId,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + ttlSec * 1000).toISOString()
    };
    this.insert('sessions', session);
    this.flush();
    return session;
  }

  destroySession(id) {
    const removed = this.remove('sessions', (row) => row.id === id);
    if (removed) this.flush();
    return removed > 0;
  }

  pruneSessions() {
    const removed = this.remove(
      'sessions',
      (row) => row.expiresAt && Date.parse(row.expiresAt) < Date.now()
    );
    if (removed) this.flush();
    return removed;
  }
}

const config = require('./config');
const db = new Store(config.dataFile).load();

module.exports = { db, Store, nowIso, clone };
