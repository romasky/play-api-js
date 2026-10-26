const { Given, When, Then } = require('@cucumber/cucumber');
const jwt = require('../../services/jwt');
const authService = require('../../services/auth');
const auth = require('../../support/auth');
const { sharedJwtSession } = require('../../support/session');
const { rawBody } = require('../../http/client');
const jwtTools = require('../../utils/jwtTools');
const { choose } = require('../../utils/lookup');
const { show } = require('../../http/attach');

// ─── Shared JWT session (one rate-limited JWT login pair per run, see support/session.js) ──

Given('a shared JWT session', async function () {
  const { created, ...tokens } = await sharedJwtSession();
  for (const [key, value] of Object.entries(tokens)) this.save(key, value);
});

Given('Craft {string} JWT from {string} and save as {string}', function (kind, srcKey, destKey) {
  this.save(destKey, jwtTools.craft(kind, this.str(srcKey)));
});

// ─── /jwt/login (paced 12.5 s — every call counts, 400s too) ──────────────

When('JWT login with {string} and {string} and save response as {string}', async function (emailKey, passwordKey, varName) {
  this.save(varName, await jwt.login({ email: this.str(emailKey), password: this.str(passwordKey) }));
});

When('JWT login with {string} and {string} and access ttl {string} and save response as {string}',
  async function (emailKey, passwordKey, ttl, varName) {
    const body = { email: this.str(emailKey), password: this.str(passwordKey), access_ttl_seconds: Number(ttl) };
    this.save(varName, await jwt.login(body));
  });

When('JWT login with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await jwt.login(rawBody(this.render(rawJson))));
});

const OVERSIZED = { login: jwt.login, refresh: jwt.refresh, decode: jwt.decode };

// deliberately not a real JWT body: one oversized field is all the 413 check needs
When('Send JWT {string} request with an oversized body and save response as {string}', async function (endpoint, varName) {
  this.save(varName, await choose(OVERSIZED, endpoint, 'JWT endpoint')({ padding: 'x'.repeat(jwt.BODY_LIMIT + 1) }));
});

// ─── /jwt/me ──────────────────────────────────────────────────────────────

When('Get JWT me with token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await jwt.me(this.bearer(tokenKey)));
});

When('Get JWT me with raw auth header {string} and save response as {string}', async function (header, varName) {
  this.save(varName, await jwt.me(this.rawAuth(header)));
});

When('Get JWT me with no auth token and save response as {string}', async function (varName) {
  this.save(varName, await jwt.me(auth.none()));
});

// ─── /jwt/refresh (the refresh token travels in the BODY) ─────────────────

When('Refresh JWT with token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await jwt.refresh({ refresh_token: this.str(tokenKey) }));
});

When('Refresh JWT with token {string} in the Authorization header only and save response as {string}',
  async function (tokenKey, varName) {
    this.save(varName, await jwt.refresh({}, this.bearer(tokenKey)));
  });

When('Refresh JWT with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await jwt.refresh(rawBody(this.render(rawJson))));
});

// ─── /jwt/decode (public inspector) ───────────────────────────────────────

When('Decode JWT {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await jwt.decode({ token: this.str(tokenKey) }));
});

When('Decode JWT with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await jwt.decode(rawBody(this.render(rawJson))));
});

// ─── Local (unverified) claim checks ──────────────────────────────────────

Then('Assert JWT {string} has claim {string} equals {string}', function (tokenKey, claim, expected) {
  const [, payload] = jwtTools.parts(this.str(tokenKey));
  const actual = String(payload[claim]);
  const resolved = this.str(expected);
  if (actual !== resolved) throw new Error(`JWT claim '${claim}': expected '${resolved}' but got '${actual}'. Payload: ${show(payload)}`);
});

Then('Assert JWT {string} lifetime is {int} seconds', function (tokenKey, seconds) {
  const [, payload] = jwtTools.parts(this.str(tokenKey));
  const lifetime = payload.exp - payload.iat;
  if (lifetime !== seconds) throw new Error(`JWT exp - iat = ${lifetime}, expected ${seconds}. Payload: ${show(payload)}`);
});

// ─── /store/login (personas, password secret_sauce) ───────────────────────

When('Store login as {string} with password {string} and save response as {string}', async function (username, password, varName) {
  this.save(varName, await authService.storeLogin({ username: this.str(username), password: this.str(password) }));
});

When('Store login with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await authService.storeLogin(rawBody(this.render(rawJson))));
});
