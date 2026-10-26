const { When, Then } = require('@cucumber/cucumber');
const admin = require('../../services/admin');
const users = require('../../services/users');
const auth = require('../../support/auth');
const { rawBody } = require('../../http/client');
const { assertContract } = require('../../contracts');
const { adminUser } = require('../../builders/users');
const { choose } = require('../../utils/lookup');
const { show } = require('../../http/attach');

// ─── POST /users/create-admin (order: body 400 → seed 403 → duplicate 409) ──

When('Create admin with seed code {string} and save response as {string}', async function (seed, varName) {
  this.save(varName, await users.createAdmin(adminUser({ seedCode: this.str(seed) }).body));
});

When('Create admin without seed code and save response as {string}', async function (varName) {
  this.save(varName, await users.createAdmin(adminUser({ seedCode: null }).body));
});

When('Create admin with email {string} and the published seed code and save response as {string}', async function (emailKey, varName) {
  this.save(varName, await users.createAdmin(adminUser({ email: this.str(emailKey) }).body));
});

When('Create admin with email {string} and seed code {string} and save response as {string}', async function (emailKey, seed, varName) {
  this.save(varName, await users.createAdmin(adminUser({ seedCode: this.str(seed), email: this.str(emailKey) }).body));
});

When('Create admin with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await users.createAdmin(rawBody(this.render(rawJson))));
});

// ─── Auth matrix: the four /admin routes by name ──────────────────────────
// The target id is irrelevant there: the auth and role checks run before the scope check.

const ANY_ID = '000000000000000000000000';
const ROUTES = {
  'stats':       (headers) => admin.stats(headers),
  'users':       (headers) => admin.listUsers(headers),
  'set role':    (headers) => admin.setRole(ANY_ID, { role: 'user' }, headers),
  'delete user': (headers) => admin.deleteUser(ANY_ID, headers),
};

When('Send admin {string} request with no auth token and save response as {string}', async function (route, varName) {
  this.save(varName, await choose(ROUTES, route, 'route')(auth.none()));
});

When('Send admin {string} request with raw auth header {string} and save response as {string}', async function (route, header, varName) {
  this.save(varName, await choose(ROUTES, route, 'route')(auth.raw(this.render(header))));
});

When('Send admin {string} request with token {string} and save response as {string}', async function (route, tokenKey, varName) {
  this.save(varName, await choose(ROUTES, route, 'route')(auth.bearer(this.str(tokenKey))));
});

// ─── Routes ───────────────────────────────────────────────────────────────

When('Get admin stats with token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await admin.stats(auth.bearer(this.str(tokenKey))));
});

When('Get admin users with query {string} and token {string} and save response as {string}', async function (query, tokenKey, varName) {
  this.save(varName, await admin.listUsers(auth.bearer(this.str(tokenKey)), new URLSearchParams(this.render(query))));
});

When('Set role {string} for user {string} with token {string} and save response as {string}', async function (role, idKey, tokenKey, varName) {
  this.save(varName, await admin.setRole(this.str(idKey), { role }, auth.bearer(this.str(tokenKey))));
});

When('Set role for user {string} with raw body {string} token {string} and save response as {string}',
  async function (idKey, rawJson, tokenKey, varName) {
    this.save(varName, await admin.setRole(this.str(idKey), rawBody(this.render(rawJson)), auth.bearer(this.str(tokenKey))));
  });

When('Admin delete user {string} with token {string} and save response as {string}', async function (idKey, tokenKey, varName) {
  this.save(varName, await admin.deleteUser(this.str(idKey), auth.bearer(this.str(tokenKey))));
});

/** One aggregation, so the parts add up; the caller's own admin account is counted. */
Then('Assert admin stats are consistent in {string}', function (varName) {
  const body = this.body(varName);
  assertContract('AdminStatsResponse', body);
  const { admin: admins, moderator, user } = body.by_role;
  if (admins + moderator + user !== body.total) throw new Error(`by_role does not sum to total: ${show(body)}`);
  if (body.with_active_token < 0 || body.with_active_token > body.total) throw new Error(`with_active_token out of range: ${show(body)}`);
  if (admins < 1) throw new Error(`caller is an admin, expected by_role.admin >= 1: ${show(body)}`);
});
