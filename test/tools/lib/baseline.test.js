const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { compare, gate } = require('../../../tools/lib/baseline');

const quietly = (fn) => {
  const log = console.log;
  console.log = () => {};
  try { return fn(); } finally { console.log = log; }
};
const tempBaseline = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-')), 'baseline.json');

test('an offender missing from the baseline is new', () => {
  assert.deepEqual(compare({ a: 12 }, {}), { added: ['a'], worsened: [], fixed: [] });
});

test('a known offender that did not get worse passes', () => {
  assert.deepEqual(compare({ a: 12 }, { a: 12 }), { added: [], worsened: [], fixed: [] });
  assert.deepEqual(compare({ a: 11 }, { a: 12 }), { added: [], worsened: [], fixed: [] });
});

test('a known offender that got worse fails', () => {
  assert.deepEqual(compare({ a: 13 }, { a: 12 }), { added: [], worsened: ['a'], fixed: [] });
});

test('a baseline entry that no longer offends is reported fixed, so the baseline can shrink', () => {
  assert.deepEqual(compare({}, { a: 12 }), { added: [], worsened: [], fixed: ['a'] });
});

test('the gate fails on an offender beyond the baseline, and a missing baseline accepts nothing', () => {
  assert.equal(quietly(() => gate(tempBaseline(), { a: 12 })), 1);
});

test('--update records today\'s offenders, sorted, after which the same offenders pass', () => {
  const file = tempBaseline();
  assert.equal(quietly(() => gate(file, { b: 11, a: 12 }, { update: true })), 0);
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8'))), ['a', 'b']);
  assert.equal(quietly(() => gate(file, { a: 12 })), 0);
  assert.equal(quietly(() => gate(file, { a: 13 })), 1);
});
