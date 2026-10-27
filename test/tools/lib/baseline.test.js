const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { compare, gate } = require('../../../tools/lib/baseline');

/** The gate's exit code, its printed lines in `printed`. */
let printed;
const quietly = (fn) => {
  const log = console.log;
  printed = [];
  console.log = (line) => printed.push(line);
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
  assert.deepEqual(printed, ['NEW    12  a', '1 offender(s) beyond the baseline']);
});

test('--accept records today\'s offenders, sorted, after which the same offenders pass', () => {
  const file = tempBaseline();
  assert.equal(quietly(() => gate(file, { b: 11, a: 12 }, { update: true, accept: true })), 0);
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8'))), ['a', 'b']);
  assert.equal(quietly(() => gate(file, { a: 12 })), 0);
  assert.deepEqual(printed, ['FIXED  b  (run with --update to shrink the baseline)', 'OK — no offender beyond the baseline (2 accepted)']);
  assert.equal(quietly(() => gate(file, { a: 13 })), 1);
  assert.equal(printed[0], 'WORSE  12 → 13  a');
  assert.equal(quietly(() => gate(file, { a: 13, c: 10 })), 1);
  assert.equal(printed.at(-1), '2 offender(s) beyond the baseline');
});

test('--update refuses to accept a new or worse offender, so the baseline can only shrink', () => {
  const file = tempBaseline();
  quietly(() => gate(file, { a: 12, b: 11 }, { update: true, accept: true }));
  assert.equal(quietly(() => gate(file, { a: 12, c: 10 }, { update: true })), 1);
  assert.deepEqual(printed, ['NEW    10  c', 'FIXED  b  (run with --update to shrink the baseline)', 'refusing to update: 1 offender(s) beyond the baseline (fix them, or --accept with a reason in the commit)']);
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8'))), ['a', 'b']);
  assert.equal(quietly(() => gate(file, { a: 12 }, { update: true })), 0);
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8'))), ['a']);
});

test('--accept records new offenders on purpose', () => {
  const file = tempBaseline();
  assert.equal(quietly(() => gate(file, { a: 12 }, { update: true, accept: true })), 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { a: 12 });
});
