const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseLcov, lineCoverage, crap, offenders } = require('../../tools/crap');

const LCOV = ['SF:src/a.js', 'DA:1,1', 'DA:2,0', 'DA:3,4', 'DA:4,0', 'end_of_record', 'SF:src/b.js', 'DA:1,0', 'end_of_record'].join('\n');

test('lcov is read into hit counts per file and line', () => {
  const lcov = parseLcov(LCOV);
  assert.equal(lcov.get('src/a.js').get(3), 4);
  assert.equal(lcov.get('src/b.js').get(1), 0);
});

test('a function is covered by the share of its lines that ran', () => {
  const lines = parseLcov(LCOV).get('src/a.js');
  assert.equal(lineCoverage({ start: 1, end: 4 }, lines), 0.5);
  assert.equal(lineCoverage({ start: 3, end: 3 }, lines), 1);
});

test('a file the tests never loaded is not covered', () => {
  assert.equal(lineCoverage({ start: 1, end: 4 }, undefined), 0);
});

test('CRAP is complexity² × (1 − coverage)³ + complexity', () => {
  assert.equal(crap(1, 0), 2);
  assert.equal(crap(5, 1), 5);
  assert.equal(crap(4, 0.5), 6);
});

test('offenders are the functions at or above the limit, keyed file::name, worst first', () => {
  const fns = [
    { file: 'src/a.js', name: 'simple', start: 1, end: 1, complexity: 1 },
    { file: 'src/a.js', name: 'branchy', start: 2, end: 4, complexity: 4 },
    { file: 'src/b.js', name: 'untested', start: 1, end: 1, complexity: 3 },
  ];
  // branchy: 2 of 3 lines ran → 16 × (1/3)³ + 4 ≈ 4.6; untested: 9 + 3 = 12
  assert.deepEqual(offenders(fns, parseLcov(LCOV), 10), [{ key: 'src/b.js::untested', complexity: 3, coverage: 0, crap: 12 }]);
});
