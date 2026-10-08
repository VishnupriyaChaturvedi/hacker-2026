'use strict';

const path = require('path');
const fs = require('fs');

// Minimal .env loader (no dependency). Lines like KEY=VALUE, # comments ignored.
function loadEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

const serverRoot = path.join(__dirname, '..');

function resolveDataFile(value) {
  if (!value) return path.join(serverRoot, 'data', 'db.json');
  return path.isAbsolute(value) ? value : path.join(serverRoot, value);
}

const config = {
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || '127.0.0.1',
  isProd: process.env.NODE_ENV === 'production',
  sessionSecret:
    process.env.SESSION_SECRET || 'campusswap-dev-secret-change-me',
  cookieName: 'cs_session',
  sessionTtlSec: 60 * 60 * 24 * 7, // 7 days
  dataFile: resolveDataFile(process.env.DATA_FILE),
  serverRoot,
  publicDir: path.join(serverRoot, 'public'),
  brand: 'CampusSwap'
};

if (config.isProd && config.sessionSecret === 'campusswap-dev-secret-change-me') {
  console.warn(
    '[config] WARNING: SESSION_SECRET is still the development default. ' +
      'Set a strong SESSION_SECRET before exposing this server publicly.'
  );
}

module.exports = config;
