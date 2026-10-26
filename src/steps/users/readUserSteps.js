const { When, Then } = require('@cucumber/cucumber');
const users = require('../../services/users');
const { assertContract } = require('../../contracts');
const { items, assertEveryItem, assertTotalPages } = require('../../assertions/body');
const { show } = require('../../http/attach');

// Reads are public, but a PRESENT bad Authorization header is still rejected (401), before the id / query.

// ─── Get / exists ─────────────────────────────────────────────────────────

When('Send GET user request for {string} and save response as {string}', async function (idKey, varName) {
  this.save(varName, await users.get(this.str(idKey)));
});

When('Send GET user request for {string} with raw auth header {string} and save response as {string}',
  async function (idKey, header, varName) {
    this.save(varName, await users.get(this.str(idKey), this.rawAuth(header)));
  });

When('Send GET user request for {string} with token {string} and save response as {string}',
  async function (idKey, tokenKey, varName) {
    this.save(varName, await users.get(this.str(idKey), this.bearer(tokenKey)));
  });

When('Send HEAD exists request for {string} and save response as {string}', async function (idKey, varName) {
  this.save(varName, await users.exists(this.str(idKey), 'HEAD'));
});

When('Send GET exists request for {string} and save response as {string}', async function (idKey, varName) {
  this.save(varName, await users.exists(this.str(idKey), 'GET'));
});

Then('Assert user response has all core fields in {string}', function (varName) {
  assertContract('UserResponse', this.body(varName));
});

// ─── List ─────────────────────────────────────────────────────────────────

When('Send GET users list request and save response as {string}', async function (varName) {
  this.save(varName, await users.list());
});

// String-typed so boundary rows can pass non-numeric values (abc, -5, xyz)
When('Send GET users list request with page {string} per_page {string} and save response as {string}',
  async function (page, perPage, varName) {
    this.save(varName, await users.list({ page, per_page: perPage }));
  });

When('Send GET users list request with query {string} and save response as {string}', async function (text, varName) {
  this.save(varName, await users.list(this.query(text)));
});

When('Send GET users list request with query {string} and raw auth header {string} and save response as {string}',
  async function (text, header, varName) {
    this.save(varName, await users.list(this.query(text), this.rawAuth(header)));
  });

When('Send GET users list request with query {string} and token {string} and save response as {string}',
  async function (text, tokenKey, varName) {
    this.save(varName, await users.list(this.query(text), this.bearer(tokenKey)));
  });

Then('Assert users list total_pages matches total and per_page in {string}', function (varName) {
  assertTotalPages(this.body(varName));
});

Then('Assert users list is not empty in {string}', function (varName) {
  if (items(this.body(varName), 'users').length === 0) throw new Error('Expected non-empty users list');
});

Then('Assert users list items have no {string} field in {string}', function (field, varName) {
  assertEveryItem(this.body(varName), 'users', field, { present: false });
});

// ─── OPTIONS ──────────────────────────────────────────────────────────────

When('Send OPTIONS users request and save response as {string}', async function (varName) {
  this.save(varName, await users.options());
});

Then('Assert options response has allowed_methods in {string}', function (varName) {
  const body = this.body(varName);
  if (!Array.isArray(body?.allowed_methods)) throw new Error(`Missing 'allowed_methods' array in OPTIONS response. Body: ${show(body)}`);
});

Then('Assert options response has endpoints in {string}', function (varName) {
  const body = this.body(varName);
  if (!body?.endpoints || typeof body.endpoints !== 'object') throw new Error(`Missing 'endpoints' object in OPTIONS response. Body: ${show(body)}`);
});

Then('Assert Allow header contains {string} in {string}', function (method, varName) {
  const allow = this.res(varName).headers.allow || '';
  if (!allow.includes(method)) throw new Error(`Allow header '${allow}' does not contain '${method}'`);
});
