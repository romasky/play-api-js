const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { mutants, apply, run, inFunction, score, testsFor, main } = require('../../tools/mutate');

const described = (source) => mutants(source).map((m) => `${m.line}: ${m.description}`);

test('comparison and logical operators are flipped', () => {
  assert.deepEqual(described('f(a >= 1 && b === c);'), ['1: && → ||', '1: >= → <', '1: >= → >', '1: === → !==']);
});

test('negations are dropped, booleans swapped, conditions negated, returns emptied', () => {
  const source = 'function f(a) {\n  if (!a) return true;\n  return a ? 1 : 2;\n}';
  assert.deepEqual(described(source), [
    '2: if condition negated', '2: ! removed', '2: return true → return undefined', '2: true → false',
    '3: return a ? 1 : 2 → return undefined', '3: ?: condition negated',
  ]);
});

test('a mutant is applied as a splice of the source', () => {
  const source = 'f(a >= 1);';
  const [mutant] = mutants(source).filter((m) => m.description === '>= → >');
  assert.equal(apply(source, mutant), 'f(a > 1);');
  const [flag] = mutants('f(true);');
  assert.equal(apply('f(true);', flag), 'f(false);');
});

test('a mutant the checks notice is killed; one they miss survives', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures', 'mutate');
  const file = path.join(fixtures, 'age.js');
  const [boundary] = mutants(fs.readFileSync(file, 'utf8')).filter((m) => m.description === '>= → >');
  assert.equal(run({ file, mutant: boundary, tests: [path.join(fixtures, 'strong.check.js')] }), 'killed');
  assert.equal(run({ file, mutant: boundary, tests: [path.join(fixtures, 'weak.check.js')] }), 'survived');
});

test('the CLI entry guard of a tool is not mutated', () => {
  assert.deepEqual(described('if (require.main === module) main(!x);'), []);
});

test('?? becomes && (?? → || is equivalent whenever the left side is never 0 or empty)', () => {
  assert.deepEqual(described('f(a ?? b);'), ['1: ?? → &&']);
});

test('a bare return, or one already returning undefined, has nothing to empty', () => {
  assert.deepEqual(described('function f() { return; }\nfunction g() { return undefined; }'), []);
});

test('--fn narrows the mutants to one function; an unknown name fails loudly', () => {
  const source = 'function a(x) { return x > 1; }\nfunction b(x) { return x < 1; }\nfunction c(x) { return !x; }';
  assert.deepEqual(inFunction(source, 'b').map((m) => `${m.line}: ${m.description}`),
    ['2: return x < 1 → return undefined', '2: < → >=', '2: < → <=']);
  assert.equal(inFunction(source, undefined).length, 8);
  assert.throws(() => inFunction(source, 'd'), /no function named 'd'/);
});

test('the score is the share of mutants killed; no mutant scores 100', () => {
  assert.equal(score(4, 1), 75);
  assert.equal(score(3, 1), 67);
  assert.equal(score(0, 0), 100);
});

test('the tests of a module are the unit tests that require it, nested folders included', () => {
  const names = (file) => testsFor(path.join(__dirname, '..', '..', file)).map((t) => path.relative(path.join(__dirname, '..'), t));
  assert.deepEqual(names('tools/dry.js'), ['tools/dry.test.js']);
  assert.deepEqual(names('tools/lib/baseline.js'), ['tools/lib/baseline.test.js']);
});

/** main()'s exit code, its printed lines in `printed`. */
let printed;
const cli = (...argv) => {
  const { log, error } = console;
  printed = [];
  console.log = console.error = (line) => printed.push(line);
  try { return main(argv); } finally { Object.assign(console, { log, error }); }
};
const fixture = (name) => path.join('test', 'fixtures', 'mutate', name);

test('the CLI passes when every mutant is killed', () => {
  assert.equal(cli(fixture('age.js'), '--tests', fixture('strong.check.js')), 0);
  assert.deepEqual(printed, ['2 mutant(s): 2 killed, 0 survived (100 %)']);
});

test('the CLI fails on a survivor and names its line', () => {
  assert.equal(cli(fixture('age.js'), '--tests', fixture('weak.check.js')), 1);
  assert.deepEqual(printed, ['SURVIVED  test/fixtures/mutate/age.js:2  >= → >', '2 mutant(s): 1 killed, 1 survived (50 %)']);
});

test('the CLI refuses a file without tests, and tests that are already red', () => {
  assert.equal(cli(fixture('age.js')), 2);
  assert.match(printed[0], /no unit test requires/);
  assert.equal(cli(fixture('age.js'), '--tests', fixture('red.check.js')), 2);
  assert.match(printed[0], /fail without any mutant/);
});
