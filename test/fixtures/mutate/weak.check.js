// Misses the boundary: `>=` → `>` survives.
const assert = require('node:assert/strict');
const { isAdult } = require('./age');

assert.equal(isAdult(30), true);
assert.equal(isAdult(5), false);
