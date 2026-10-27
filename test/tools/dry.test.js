const { test } = require('node:test');
const assert = require('node:assert/strict');
const { functions } = require('../../tools/lib/functions');
const { shape, similarity, duplicates } = require('../../tools/dry');

const unit = (file, source) => {
  const [fn] = functions(source);
  return { file, name: fn.name, tokens: shape(source, fn.node) };
};

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

test('functions below the minimum size are too small to count as duplication', () => {
  const units = [unit('src/a.js', LIST), unit('src/b.js', RENAMED)];
  assert.deepEqual(duplicates(units, { threshold: 0.8, minTokens: 1000 }), []);
});
