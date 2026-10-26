const { When, Then } = require('@cucumber/cucumber');
const { getPath, hasPath } = require('../../utils/jsonPath');
const { show } = require('../../http/attach');
const {
  asText, items, assertEveryItem, assertEveryItemEquals, assertSorted, assertErrorCode, assertHasRequestId,
} = require('../../assertions/body');
const { header, link } = require('../../assertions/headers');

// ─── Status code ──────────────────────────────────────────────────────────

When('Get and check status code {int} from {string}', function (code, varName) {
  const res = this.res(varName);
  if (res.status !== code) throw new Error(`Expected status ${code} but got ${res.status}. Body: ${show(res.data)}`);
});
Then('Assert response is not a server error in {string}', function (varName) {
  const res = this.res(varName);
  if (res.status >= 500) throw new Error(`Expected non-5xx status but got ${res.status}. Body: ${show(res.data)}`);
});
Then('Assert status code is one of {string} in {string}', function (codes, varName) {
  const allowed = codes.split(',').map((c) => parseInt(c.trim(), 10));
  const res = this.res(varName);
  if (!allowed.includes(res.status)) throw new Error(`Expected status in [${codes}] but got ${res.status}. Body: ${show(res.data)}`);
});
Then('Assert response {string} took at least {int} seconds', function (varName, seconds) {
  const elapsed = this.res(varName).elapsedMs / 1000;
  if (elapsed < seconds) throw new Error(`Response took ${elapsed.toFixed(2)} s, expected at least ${seconds} s`);
});
Then('Assert error code is {string} in response {string}', function (code, varName) {
  assertErrorCode(this.body(varName), code);
});
Then('Assert response has request_id in {string}', function (varName) {
  assertHasRequestId(this.body(varName));
});

// ─── Headers ──────────────────────────────────────────────────────────────

// regex, not {string}: the expected value may itself contain quotes (Content-Disposition: filename="a.png")
Then(/^Assert response header "([^"]+)" equals "(.*)" in "([^"]+)"$/, function (name, expected, varName) {
  const actual = header(this.res(varName), name);
  const resolved = this.str(expected);
  if (actual !== resolved) throw new Error(`Header '${name}': expected '${resolved}' but got '${actual}'`);
});
Then(/^Assert response header "([^"]+)" contains "(.*)" in "([^"]+)"$/, function (name, expected, varName) {
  const actual = header(this.res(varName), name);
  if (!actual?.includes(expected)) throw new Error(`Header '${name}' '${actual}' does not contain '${expected}'`);
});
Then('Assert response header {string} is present in {string}', function (name, varName) {
  if (!header(this.res(varName), name)) throw new Error(`Header '${name}' is missing`);
});
Then('Assert response header {string} is absent in {string}', function (name, varName) {
  const actual = header(this.res(varName), name);
  if (actual !== undefined) throw new Error(`Header '${name}' should be absent but is '${actual}'`);
});
Then('Assert header {string} equals field {string} in response {string}', function (name, field, varName) {
  const actual = header(this.res(varName), name);
  const expected = asText(getPath(this.body(varName), field));
  if (actual !== expected) throw new Error(`Header '${name}' = '${actual}' but body '${field}' = '${expected}'`);
});

// ─── Link header (RFC 8288) ───────────────────────────────────────────────

Then('Assert Link header relation {string} contains {string} in {string}', function (rel, text, varName) {
  const url = link(this.res(varName), rel);
  if (url === undefined || !url.includes(text)) throw new Error(`Link rel=${rel} is '${url}', expected it to contain '${text}'`);
});
Then('Assert Link header relation {string} does not contain {string} in {string}', function (rel, text, varName) {
  const url = link(this.res(varName), rel);
  if (url === undefined || url.includes(text)) throw new Error(`Link rel=${rel} is '${url}', expected it NOT to contain '${text}'`);
});
Then('Assert Link header has no relation {string} in {string}', function (rel, varName) {
  const url = link(this.res(varName), rel);
  if (url !== undefined) throw new Error(`Link rel=${rel} should be absent but is '${url}'`);
});

// ─── Body fields (dotted paths, own-property semantics) ───────────────────

Then('Assert field {string} equals {string} in response {string}', function (field, expected, varName) {
  const actual = getPath(this.body(varName), field);
  const resolved = this.str(expected);
  if (String(actual) !== resolved) throw new Error(`Field '${field}': expected '${resolved}' but got '${actual}'`);
});
Then('Assert field {string} is not null in response {string}', function (field, varName) {
  const actual = getPath(this.body(varName), field);
  if (actual === undefined || actual === null) {
    throw new Error(`Field '${field}' is null/undefined. Body: ${show(this.body(varName))}`);
  }
});
Then('Assert field {string} of {string} equals field {string} of {string}', function (field, varName, otherField, otherVar) {
  const actual = getPath(this.body(varName), field);
  const expected = getPath(this.body(otherVar), otherField);
  if (actual == null || actual !== expected) throw new Error(`'${varName}'.${field} = ${actual}, '${otherVar}'.${otherField} = ${expected}`);
});
// code points, not UTF-16 units: the server counts runes
Then('Assert field {string} has length {int} in response {string}', function (field, n, varName) {
  const value = getPath(this.body(varName), field);
  const length = value == null ? 0 : [...value].length;
  if (value == null || length !== n) throw new Error(`Field '${field}' has length ${length}, expected ${n}`);
});
Then('Assert field {string} is null in response {string}', function (field, varName) {
  const body = this.body(varName);
  if (!hasPath(body, field)) throw new Error(`Field '${field}' is missing (expected present and null). Body: ${show(body)}`);
  const actual = getPath(body, field);
  if (actual !== null) throw new Error(`Field '${field}' = ${show(actual)}, expected null`);
});
Then('Assert field {string} contains {string} in response {string}', function (field, expected, varName) {
  const actual = getPath(this.body(varName), field);
  const resolved = this.str(expected);
  if (typeof actual !== 'string' || !actual.includes(resolved)) {
    throw new Error(`Field '${field}' = '${actual}' does not contain '${resolved}'`);
  }
});
Then('Assert field {string} is present in response {string}', function (field, varName) {
  if (!hasPath(this.body(varName), field)) throw new Error(`Field '${field}' is missing. Body: ${show(this.body(varName))}`);
});
Then('Assert field {string} is absent in response {string}', function (field, varName) {
  if (hasPath(this.body(varName), field)) throw new Error(`Field '${field}' should NOT be present. Body: ${show(this.body(varName))}`);
});
// ─── Lists ────────────────────────────────────────────────────────────────

Then('Assert list {string} has {int} items in response {string}', function (field, n, varName) {
  const rows = items(this.body(varName), field);
  if (rows.length !== n) throw new Error(`'${field}' has ${rows.length} items, expected ${n}`);
});
Then('Assert list {string} has at most {int} items in response {string}', function (field, n, varName) {
  const rows = items(this.body(varName), field);
  if (rows.length > n) throw new Error(`'${field}' has ${rows.length} items, expected at most ${n}`);
});
Then('Assert list {string} is sorted by {string} {string} in response {string}', function (field, key, direction, varName) {
  assertSorted(this.body(varName), field, key, direction);
});
Then('Assert every item of {string} has field {string} equals {string} in response {string}',
  function (field, itemField, expected, varName) {
    assertEveryItemEquals(this.body(varName), field, itemField, this.str(expected));
  });
Then('Assert every item of {string} has field {string} in response {string}', function (field, itemField, varName) {
  assertEveryItem(this.body(varName), field, itemField);
});
Then('Assert every item of {string} has no field {string} in response {string}', function (field, itemField, varName) {
  assertEveryItem(this.body(varName), field, itemField, { present: false });
});

Then('Assert response body is empty in {string}', function (varName) {
  const data = this.body(varName);
  if (data !== undefined && data !== null && data !== '') throw new Error(`Expected empty body but got: ${show(data)}`);
});

// ─── Context values ───────────────────────────────────────────────────────

Then('Assert {string} not null', function (key) {
  if (!this.get(key, true)) throw new Error(`${key} is null`);
});
Then('Assert {string} equals {string}', function (key, expected) {
  const actual = this.str(key);
  const resolved = this.str(expected);
  if (actual !== resolved) throw new Error(`${key}: '${actual}' !== '${resolved}'`);
});
Then('Assert {string} contains {string}', function (key, expected) {
  if (!this.str(key).includes(expected)) throw new Error(`'${this.str(key)}' does not contain '${expected}'`);
});
Then('Assert {string} matches regex {string}', function (key, regex) {
  const value = this.str(key);
  if (!new RegExp(regex).test(value)) throw new Error(`'${value}' does not match regex '${regex}'`);
});
