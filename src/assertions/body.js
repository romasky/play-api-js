/**
 * Typed assertions over response bodies (lists, ordering, pages, the error envelope). Steps stay one-liners;
 * the logic and the failure messages live here. Paths are dotted (`getPath`), never substring matches on a
 * serialised body.
 */
const { getPath, hasPath } = require('../utils/jsonPath');
const { show } = require('../http/attach');

function fail(message) {
  throw new Error(message);
}

function items(body, listPath) {
  const value = getPath(body, listPath);
  if (!Array.isArray(value)) fail(`'${listPath}' is not a list. Body: ${show(body)}`);
  return value;
}

function assertEveryItem(body, listPath, field, { present = true } = {}) {
  const rows = items(body, listPath);
  if (rows.length === 0) fail(`'${listPath}' is empty — nothing to check. Body: ${show(body)}`);
  const offenders = rows.map((row, i) => [row, i]).filter(([row]) => hasPath(row, field) !== present).map(([, i]) => i);
  if (offenders.length > 0) {
    fail(`${offenders.length} item(s) of '${listPath}' ${present ? 'lack' : 'expose'} '${field}', first index ${offenders[0]}`);
  }
}

function assertEveryItemEquals(body, listPath, field, expected) {
  const rows = items(body, listPath);
  if (rows.length === 0) fail(`'${listPath}' is empty — nothing to check. Body: ${show(body)}`);
  const wrong = rows.map((row) => getPath(row, field)).filter((value) => String(value) !== expected);
  if (wrong.length > 0) fail(`${wrong.length} item(s) of '${listPath}' have '${field}' != '${expected}': ${show(wrong.slice(0, 5))}`);
}

/** Byte order (the API's binary string order for UTF-8), like the server's sort. */
function assertSorted(body, listPath, key, direction) {
  if (direction !== 'asc' && direction !== 'desc') fail(`direction must be asc|desc, got '${direction}'`);
  const values = items(body, listPath).map((row) => getPath(row, key));
  if (values.some((v) => v === undefined || v === null)) fail(`some '${listPath}' items have no '${key}': ${show(values)}`);
  const cmp = (a, b) => (typeof a === 'string' ? Buffer.compare(Buffer.from(a), Buffer.from(b)) : a - b);
  const expected = [...values].sort((a, b) => (direction === 'asc' ? cmp(a, b) : cmp(b, a)));
  if (values.some((v, i) => v !== expected[i])) fail(`'${listPath}' not sorted by ${key} ${direction}: ${show(values)}`);
}

function assertTotalPages(body) {
  const { total, per_page: perPage, total_pages: pages } = body ?? {};
  if (!Number.isInteger(total) || !Number.isInteger(perPage) || perPage <= 0) fail(`bad pagination fields: ${show(body)}`);
  if (pages !== Math.ceil(total / perPage)) fail(`total_pages ${pages} != ceil(${total} / ${perPage})`);
}

/** The standard error envelope { success, error: { code, … }, request_id } with the expected code. */
function assertErrorCode(body, expected) {
  const actual = body?.error?.code;
  if (actual !== expected) fail(`Expected error code '${expected}' but got '${actual}'. Body: ${show(body)}`);
}

function assertHasRequestId(body) {
  const id = body?.request_id;
  if (typeof id !== 'string' || id.trim() === '') fail(`Expected non-empty 'request_id' in error body. Body: ${show(body)}`);
}

module.exports = {
  items, assertEveryItem, assertEveryItemEquals, assertSorted, assertTotalPages, assertErrorCode, assertHasRequestId,
};
