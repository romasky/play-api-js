/**
 * /buggy/* steps. The bugs are permanent and deterministic, so the scenarios pin the WRONG values — a fix on
 * the server side would (rightly) turn them red.
 */
const { When, Then } = require('@cucumber/cucumber');
const bugs = require('../../services/bugs');
const { rawBody } = require('../../http/client');
const { cart, cartOf } = require('../../builders/bugs');
const { assertContract } = require('../../contracts');
const { show } = require('../../http/attach');

/** `1..9` → [1, …, 9]; `25` → [25]; `` → []. */
function idRange(spec) {
  if (!spec) return [];
  const [first, last = first] = spec.split('..').map(Number);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

/** A decimal string as integer cents, without going through a binary float ("0.30" → 30). */
function cents(decimal) {
  const [whole, fraction = ''] = String(decimal).split('.');
  const sign = whole.startsWith('-') ? -1 : 1;
  return sign * (Math.abs(parseInt(whole, 10)) * 100 + parseInt(fraction.padEnd(2, '0').slice(0, 2), 10));
}

When('Get buggy catalog and save response as {string}', async function (varName) {
  this.save(varName, await bugs.catalog());
});

When('Get buggy items with query {string} and save response as {string}', async function (query, varName) {
  this.save(varName, await bugs.items(this.query(query)));
});

Then('Assert item ids are {string} in response {string}', function (ids, varName) {
  const body = this.body(varName);
  assertContract('BuggyItemsResponse', body);
  const actual = body.items.map((item) => item.id);
  const expected = idRange(ids);
  if (actual.join() !== expected.join()) throw new Error(`item ids [${actual}], expected [${expected.join() || '(none)'}]`);
});

/** Every catalogue item costs id × 1.25 (compared in cents, never as binary floats). */
Then('Assert every buggy item costs its id times 1.25 in response {string}', function (varName) {
  const body = this.body(varName);
  assertContract('BuggyItemsResponse', body);
  const wrong = body.items.filter((item) => cents(item.price) !== item.id * 125);
  if (wrong.length > 0) throw new Error(`items with an unexpected price: ${show(wrong)}`);
});

When('Post buggy cart with items {string} and save response as {string}', async function (spec, varName) {
  this.save(varName, await bugs.cartTotal(cart(spec)));
});

When('Post buggy cart with {int} items and save response as {string}', async function (count, varName) {
  this.save(varName, await bugs.cartTotal(cartOf(count)));
});

When('Post buggy cart with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await bugs.cartTotal(rawBody(this.render(rawJson))));
});

/** Read `total` from the RAW text, so "0.30" is compared as exact cents. */
Then('Assert cart total is {string} in response {string}', function (amount, varName) {
  const text = this.res(varName).raw.toString('utf8');
  const total = /"total"\s*:\s*(-?[\d.]+)/.exec(text)?.[1];
  if (total === undefined || cents(total) !== cents(amount)) throw new Error(`cart total ${total}, expected ${amount}. Body: ${show(text)}`);
});

When('Get buggy schedule with query {string} and save response as {string}', async function (query, varName) {
  this.save(varName, await bugs.schedule(this.query(query)));
});
