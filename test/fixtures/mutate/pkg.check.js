// Requires a directory module: testsFor must resolve './pkg' to pkg/index.js.
const assert = require('node:assert/strict');
const { two } = require('./pkg');

assert.equal(two(), 2);
