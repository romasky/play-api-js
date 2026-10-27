// Checks the boundary: kills `>=` → `>`.
const assert = require('node:assert/strict');
const { isAdult } = require('./age');

assert.equal(isAdult(18), true);
assert.equal(isAdult(17), false);
