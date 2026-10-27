// Fails without any mutant: mutate.js must refuse to run on red tests.
const assert = require('node:assert/strict');
const { isAdult } = require('./age');

assert.equal(isAdult(17), true);
