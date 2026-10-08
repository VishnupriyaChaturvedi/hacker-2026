'use strict';

// Reset helper: removes the current database and re-seeds the demo data.
const fs = require('fs');
const path = require('path');
const config = require('../src/config');

if (fs.existsSync(config.dataFile)) {
  fs.rmSync(config.dataFile, { force: true });
  console.log(`Removed existing data at ${config.dataFile}`);
}
if (fs.existsSync(`${config.dataFile}.tmp`)) {
  fs.rmSync(`${config.dataFile}.tmp`, { force: true });
}

// Requiring models loads the (now absent) store, then seeds fresh data.
const { ensureSeed } = require('../src/models');
ensureSeed();
console.log(`Seeded demo data at ${config.dataFile}`);
console.log('Demo login: ananya@campus.edu / campus123');
