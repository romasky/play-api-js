// A nested test run must not inherit the outer run's coverage collection (mutated code would count as covered).
// (NODE_TEST_CONTEXT cannot be checked here: `node --test` sets it for every file it runs.)
const assert = require('node:assert/strict');

assert.ok(!process.env.NODE_V8_COVERAGE, `coverage leaked: '${process.env.NODE_V8_COVERAGE}'`);
