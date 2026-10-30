const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  items, assertEveryItem, assertEveryItemEquals, assertSorted, assertTotalPages, assertErrorCode, assertHasRequestId,
} = require('../../../src/assertions/body');

const page = { data: [{ id: 1, name: 'b', role: 'user' }, { id: 2, name: 'a', role: 'user', secret: 'x' }] };

test('items returns the list at the path, and fails when it is not a list', () => {
  assert.equal(items(page, 'data').length, 2);
  assert.throws(() => items(page, 'data.0'), /'data.0' is not a list/);
});

test('assertEveryItem passes when every item has the field (or none has it, with present: false)', () => {
  assertEveryItem(page, 'data', 'id');
  assertEveryItem(page, 'data', 'password', { present: false });
});

test('assertEveryItem names how many items break the rule and the first one', () => {
  assert.throws(() => assertEveryItem(page, 'data', 'secret'), /^Error: 1 item\(s\) of 'data' lack 'secret', first index 0$/);
  assert.throws(() => assertEveryItem(page, 'data', 'secret', { present: false }), /1 item\(s\) of 'data' expose 'secret', first index 1/);
});

test('an empty list proves nothing, so the item checks fail on it', () => {
  assert.throws(() => assertEveryItem({ data: [] }, 'data', 'id'), /'data' is empty/);
  assert.throws(() => assertEveryItemEquals({ data: [] }, 'data', 'role', 'user'), /'data' is empty/);
});

test('assertEveryItemEquals compares the text of each value', () => {
  assertEveryItemEquals(page, 'data', 'role', 'user');
  assertEveryItemEquals({ data: [{ n: 1 }, { n: 1 }] }, 'data', 'n', '1');
  assert.throws(() => assertEveryItemEquals(page, 'data', 'id', '1'), /1 item\(s\) of 'data' have 'id' != '1': \[2\]/);
});

test('assertSorted accepts ascending and descending order, numbers and strings', () => {
  assertSorted(page, 'data', 'id', 'asc');
  assertSorted(page, 'data', 'name', 'desc');
  assertSorted({ data: [{ n: 2 }, { n: 10 }] }, 'data', 'n', 'asc'); // numeric, not text order
});

test('assertSorted compares strings by bytes, like the server: uppercase before lowercase', () => {
  assertSorted({ data: [{ s: 'Zed' }, { s: 'apple' }] }, 'data', 's', 'asc');
  assert.throws(() => assertSorted({ data: [{ s: 'apple' }, { s: 'Zed' }] }, 'data', 's', 'asc'), /not sorted by s asc/);
});

test('assertSorted orders ISO timestamps by time, whatever their millisecond digits', () => {
  const at = (...ts) => ({ data: ts.map((t) => ({ t })) });
  assertSorted(at('2026-10-29T14:59:56.876Z', '2026-10-29T14:59:56.8Z', '2026-10-29T14:59:56Z'), 'data', 't', 'desc');
  assert.throws(() => assertSorted(at('2026-10-29T14:59:56.8Z', '2026-10-29T14:59:56.876Z'), 'data', 't', 'desc'), /not sorted by t desc/);
  // only when BOTH are instants: a timestamp beside plain text still compares by bytes
  assert.throws(() => assertSorted(at('b', '2026-10-29T14:59:56Z'), 'data', 't', 'asc'), /not sorted by t asc/);
});

test('assertSorted fails on the wrong order, a missing key, or a bad direction', () => {
  assert.throws(() => assertSorted(page, 'data', 'id', 'desc'), /'data' not sorted by id desc: \[1,2\]/);
  assert.throws(() => assertSorted({ data: [{ n: 1 }, {}] }, 'data', 'n', 'asc'), /some 'data' items have no 'n'/);
  assert.throws(() => assertSorted({ data: [{ n: null }] }, 'data', 'n', 'asc'), /have no 'n'/);
  assert.throws(() => assertSorted(page, 'data', 'id', 'up'), /direction must be asc\|desc, got 'up'/);
});

test('assertTotalPages checks total_pages = ceil(total / per_page)', () => {
  assertTotalPages({ total: 21, per_page: 10, total_pages: 3 });
  assertTotalPages({ total: 0, per_page: 10, total_pages: 0 });
  assert.throws(() => assertTotalPages({ total: 20, per_page: 10, total_pages: 3 }), /total_pages 3 != ceil\(20 \/ 10\)/);
});

test('assertTotalPages rejects pagination fields that are missing, fractional or non-positive', () => {
  for (const bad of [undefined, {}, { total: 1.5, per_page: 10 }, { total: 1, per_page: 0 }, { total: 1, per_page: -1 }, { total: 1, per_page: '10' }]) {
    assert.throws(() => assertTotalPages(bad), /bad pagination fields/, JSON.stringify(bad));
  }
});

test('assertErrorCode checks the code of the error envelope and shows the body when it differs', () => {
  assertErrorCode({ error: { code: 'NOT_FOUND' } }, 'NOT_FOUND');
  assert.throws(() => assertErrorCode({ error: { code: 'FORBIDDEN' } }, 'NOT_FOUND'),
    /Expected error code 'NOT_FOUND' but got 'FORBIDDEN'\. Body: \{"error":\{"code":"FORBIDDEN"\}\}/);
  assert.throws(() => assertErrorCode(undefined, 'NOT_FOUND'), /but got 'undefined'/);
});

test('assertHasRequestId requires a non-blank request_id string', () => {
  assertHasRequestId({ request_id: 'req-1' });
  for (const bad of [{}, { request_id: '  ' }, { request_id: 42 }, null]) {
    assert.throws(() => assertHasRequestId(bad), /Expected non-empty 'request_id'/, JSON.stringify(bad));
  }
});

test('failure messages never leak a webhook secret from the body', () => {
  assert.throws(() => assertErrorCode({ secret: 'whsec_0123456789abcdefXYZ' }, 'X'), (err) => !err.message.includes('0123456789abcdef'));
});
