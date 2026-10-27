const { test } = require('node:test');
const assert = require('node:assert/strict');
const { functions } = require('../../tools/lib/functions');
const { shape, similarity, duplicates } = require('../../tools/dry');

const units = (file, source) => functions(source).map((fn) => ({ file, ...fn, tokens: shape(source, fn.node) }));
const unit = (file, source) => units(file, source)[0];

const LIST = `function listUsers(headers, params) {
  if (!headers) throw new Error('no headers');
  const query = { ...params, page: params.page ?? 1 };
  return request('GET', paths.ADMIN_USERS, { headers, params: query });
}`;
const RENAMED = LIST.replace(/listUsers/, 'listReports').replace(/ADMIN_USERS/, 'BUG_REPORTS').replace(/'no headers'/, "'missing'");
const OTHER = `function total(rows) {
  let sum = 0;
  for (const row of rows) sum += row.amount * 2;
  return sum;
}`;

test('the shape abstracts names and literals, keeps keywords and punctuation', () => {
  const [fn] = functions("function f(a) { return a + 'x'; }");
  assert.deepEqual(shape("function f(a) { return a + 'x'; }", fn.node),
    ['function', 'ID', '(', 'ID', ')', '{', 'return', 'ID', '+/-', 'LIT', ';', '}']);
});

test('a renamed copy is identical in shape; unrelated code is not', () => {
  assert.equal(similarity(unit('a', LIST).tokens, unit('b', RENAMED).tokens), 1);
  assert.ok(similarity(unit('a', LIST).tokens, unit('c', OTHER).tokens) < 0.5);
});

test('duplicates pairs functions at or above the threshold, keyed by both names in order', () => {
  const units = [unit('src/b.js', RENAMED), unit('src/a.js', LIST), unit('src/c.js', OTHER)];
  assert.deepEqual(duplicates(units, { threshold: 0.8, minTokens: 10 }),
    [{ key: 'src/a.js::listUsers ~ src/b.js::listReports', similarity: 1 }]);
});

test('functions below the minimum size are too small to count as duplication; at the minimum they count', () => {
  const pair = [unit('src/a.js', LIST), unit('src/b.js', RENAMED)];
  const size = pair[0].tokens.length;
  assert.deepEqual(duplicates(pair, { threshold: 0.8, minTokens: size + 1 }), []);
  assert.equal(duplicates(pair, { threshold: 0.8, minTokens: size }).length, 1);
});

test('the shape is cut into overlapping 5-token shingles, the last one included', () => {
  assert.equal(similarity(['a', 'b', 'c', 'd', 'e', 'f'], ['a', 'b', 'c', 'd', 'e', 'x']), 0.5);
});

test('a pair exactly at the threshold counts', () => {
  const near = unit('src/b.js', RENAMED.replace('page: params.page ?? 1', 'page: 1'));
  const score = Math.round(similarity(unit('src/a.js', LIST).tokens, near.tokens) * 100) / 100;
  assert.ok(score < 1);
  assert.equal(duplicates([unit('src/a.js', LIST), near], { threshold: score, minTokens: 10 }).length, 1);
});

test('a function is not a copy of the function nested in it — but the same span in another file is', () => {
  const wrapped = `function outer() {\n  return ${LIST};\n}`;
  assert.deepEqual(duplicates(units('src/a.js', wrapped), { threshold: 0.8, minTokens: 10 }), []);
  const oneLine = `function outer() { return ${LIST.replace(/\n/g, ' ')}; }`; // same start and end line
  assert.deepEqual(duplicates(units('src/a.js', oneLine), { threshold: 0.8, minTokens: 10 }), []);
  const [a, b] = [unit('src/a.js', LIST), unit('src/b.js', LIST)];
  assert.equal(duplicates([a, b], { threshold: 0.8, minTokens: 10 }).length, 1);
});

test('pairs come most similar first, equal scores in key order', () => {
  const near = unit('src/b.js', RENAMED.replace('page: params.page ?? 1', 'page: 1'));
  const keys = duplicates([unit('src/a.js', LIST), near, unit('src/c.js', LIST)], { threshold: 0.5, minTokens: 10 })
    .map(({ key, similarity: score }) => `${score === 1 ? 1 : '<1'} ${key}`);
  assert.deepEqual(keys, [
    '1 src/a.js::listUsers ~ src/c.js::listUsers',
    '<1 src/a.js::listUsers ~ src/b.js::listReports',
    '<1 src/b.js::listReports ~ src/c.js::listUsers',
  ]);
});
