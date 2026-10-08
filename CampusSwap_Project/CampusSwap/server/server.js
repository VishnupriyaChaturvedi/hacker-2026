'use strict';

const path = require('path');
const express = require('express');

const config = require('./src/config');
const { db } = require('./src/store');
const { ensureSeed } = require('./src/models');
const {
  sessionMiddleware,
  verifyCsrf,
  localsMiddleware
} = require('./src/middleware');
const pageRoutes = require('./src/routes/pages');
const apiRoutes = require('./src/routes/api');
const { renderError } = require('./src/views/pages');

const app = express();

// ---- Core middleware ------------------------------------------------------

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Parse bodies. The API only needs JSON; page forms use urlencoded.
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// Basic security headers (no helmet dependency needed).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'self'"
  );
  next();
});

// Sessions, CSRF and flash messages.
app.use(sessionMiddleware);
app.use(verifyCsrf);
app.use(localsMiddleware);

// ---- Static assets --------------------------------------------------------

app.use(
  '/',
  express.static(config.publicDir, {
    index: false,
    maxAge: config.isProd ? '1d' : 0,
    etag: true
  })
);

// Static files must never swallow real routes.
app.use((req, res, next) => {
  if (req.path.includes('..')) return res.status(400).send('Bad request');
  next();
});

// ---- Routes ---------------------------------------------------------------

app.use('/api/v1', apiRoutes);
app.use('/', pageRoutes);

// ---- 404 / error handling -------------------------------------------------

app.use((req, res) => {
  res
    .status(404)
    .type('html')
    .send(renderError({ user: req.user, status: 404, message: 'Page not found' }));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  const wantsJson =
    req.path.startsWith('/api/') ||
    (req.get('accept') || '').includes('application/json');
  if (wantsJson) {
    return res
      .status(status)
      .json({ error: status >= 500 ? 'Internal server error' : err.message });
  }
  res
    .status(status)
    .type('html')
    .send(
      renderError({
        user: req.user,
        status,
        message: status === 403 ? 'Access denied' : 'Something went wrong'
      })
    );
});

// ---- Boot -----------------------------------------------------------------

function start() {
  const seeded = ensureSeed();
  db.pruneSessions();
  // Periodically clean up expired sessions and flush.
  setInterval(() => db.pruneSessions(), 60 * 60 * 1000).unref();

  const server = app.listen(config.port, config.host, () => {
    const url = `http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${
      config.port
    }`;
    console.log('');
    console.log(`  CampusSwap backend running`);
    console.log(`  → ${url}`);
    console.log(`  Data file: ${config.dataFile}`);
    if (seeded) console.log(`  Seeded demo data (login: ananya@campus.edu / campus123)`);
    console.log('');
  });

  const shutdown = (signal) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(() => {
      db.flush();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) start();

module.exports = { app, start };
