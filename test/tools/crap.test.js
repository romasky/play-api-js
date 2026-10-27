const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseLcov, lineCoverage, crap, offenders } = require('../../tools/crap');

const LCOV = ['SF:src/a.js', 'DA:1,1', 'DA:2,0', 'DA:3,4', 'DA:4,0', 'end_of_record', 'SF:src/b.js', 'DA:1,0', 'end_of_record'].join('\n');

test('lcov is read into hit counts per file and line, and calls per function start line', () => {
  const lcov = parseLcov(LCOV);
  assert.equal(lcov.get('src/a.js').lines.get(3), 4);
  assert.equal(lcov.get('src/b.js').lines.get(1), 0);
  const calls = parseLcov('SF:src/c.js\nFN:1,f\nFN:1,anonymous_0\nFNDA:0,f\nFNDA:3,anonymous_0\nend_of_record').get('src/c.js').calls;
  assert.deepEqual(calls.get(1), [0, 3]);
});

test('a function is covered by the share of its lines that ran', () => {
  const file = parseLcov(LCOV).get('src/a.js');
  assert.equal(lineCoverage({ start: 1, end: 4 }, file), 0.5);
  assert.equal(lineCoverage({ start: 3, end: 3 }, file), 1);
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

test('a function scoring exactly the limit offends; offenders come worst first', () => {
  const fns = [
    { file: 'src/b.js', name: 'six', start: 1, end: 1, complexity: 2 },
    { file: 'src/b.js', name: 'twelve', start: 1, end: 1, complexity: 3 },
  ];
  // six: 4 + 2 = 6; twelve: 9 + 3 = 12
  assert.deepEqual(offenders(fns, parseLcov(LCOV), 6).map((row) => row.key), ['src/b.js::twelve', 'src/b.js::six']);
});

test('a one-line function never called is uncovered, though its line ran when the module loaded', () => {
  // const f = (a) => (a ? 1 : 2);   — line 1 runs at load (DA:1,1), the function never does (FNDA:0)
  const file = parseLcov('SF:src/c.js\nFN:1,f\nFNDA:0,f\nDA:1,1\nend_of_record').get('src/c.js');
  assert.equal(lineCoverage({ start: 1, end: 1 }, file), 0);
  const called = parseLcov('SF:src/c.js\nFN:1,f\nFNDA:2,f\nDA:1,1\nend_of_record').get('src/c.js');
  assert.equal(lineCoverage({ start: 1, end: 1 }, called), 1);
});

test('when another function on the same line ran, the line coverage decides', () => {
  const file = parseLcov('SF:src/c.js\nFN:1,f\nFN:1,g\nFNDA:0,f\nFNDA:1,g\nDA:1,1\nend_of_record').get('src/c.js');
  assert.equal(lineCoverage({ start: 1, end: 1 }, file), 1);
});

test('FN and FNDA rows pair by position, so two functions with one name keep their own call counts', () => {
  const file = parseLcov('SF:src/c.js\nFN:1,check\nFN:5,check\nFNDA:0,check\nFNDA:2,check\nend_of_record').get('src/c.js');
  assert.deepEqual([file.calls.get(1), file.calls.get(5)], [[0], [2]]);
});
