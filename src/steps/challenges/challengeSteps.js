/**
 * /challenges/* steps. A solve flow uses the ordinary user steps (Delete / Logout / Login / Patch user) on the
 * sandbox user that `start` hands out — exactly what a player would do.
 */
const { When } = require('@cucumber/cucumber');
const challenges = require('../../services/challenges');
const auth = require('../../support/auth');
const { rawBody } = require('../../http/client');
const { choose } = require('../../utils/lookup');
const { show } = require('../../http/attach');

const SANDBOX_KEYS = { sandboxId: 'user_id', sandboxToken: 'access_token', sandboxEmail: 'email', sandboxPassword: 'password' };

/** The protected routes by name; auth is checked before the challenge id, so any id exercises it. */
const routes = (id) => ({
  'progress': (headers) => challenges.progress(headers),
  'start':    (headers) => challenges.start(id, headers),
  'verify':   (headers) => challenges.verify(id, headers),
  'reveal':   (headers) => challenges.reveal(id, { level: 1 }, headers),
});

When('List challenges with query {string} and save response as {string}', async function (query, varName) {
  this.save(varName, await challenges.catalog(new URLSearchParams(query)));
});

When('Get hints of challenge {string} and save response as {string}', async function (id, varName) {
  this.save(varName, await challenges.hints(id));
});

When('Get challenge progress with token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await challenges.progress(auth.bearer(this.str(tokenKey))));
});

When('Send challenge {string} request for {string} with no auth token and save response as {string}', async function (route, id, varName) {
  this.save(varName, await choose(routes(id), route, 'route')(auth.none()));
});

When('Send challenge {string} request for {string} with raw auth header {string} and save response as {string}',
  async function (route, id, header, varName) {
    this.save(varName, await choose(routes(id), route, 'route')(auth.raw(this.render(header))));
  });

When('Start challenge {string} with token {string} and save response as {string}', async function (id, tokenKey, varName) {
  this.save(varName, await challenges.start(id, auth.bearer(this.str(tokenKey))));
});

When('Start challenge {string} with query {string} and token {string} and save response as {string}', async function (id, query, tokenKey, varName) {
  this.save(varName, await challenges.start(id, auth.bearer(this.str(tokenKey)), new URLSearchParams(query)));
});

/** sandboxId / sandboxToken / sandboxEmail / sandboxPassword from a fresh (201) start. */
When('Extract the sandbox from {string}', function (varName) {
  const target = this.body(varName)?.target;
  if (!target?.access_token) throw new Error(`no fresh sandbox in '${varName}': ${show(this.body(varName))}`);
  for (const [key, field] of Object.entries(SANDBOX_KEYS)) this.save(key, target[field]);
});

When('Verify challenge {string} with token {string} and save response as {string}', async function (id, tokenKey, varName) {
  this.save(varName, await challenges.verify(id, auth.bearer(this.str(tokenKey))));
});

When('Verify challenge {string} with raw body {string} and token {string} and save response as {string}',
  async function (id, rawJson, tokenKey, varName) {
    this.save(varName, await challenges.verify(id, auth.bearer(this.str(tokenKey)), rawBody(this.render(rawJson))));
  });

When('Reveal hint {int} of challenge {string} with token {string} and save response as {string}', async function (level, id, tokenKey, varName) {
  this.save(varName, await challenges.reveal(id, { level }, auth.bearer(this.str(tokenKey))));
});

When('Reveal a hint of challenge {string} with raw body {string} and token {string} and save response as {string}',
  async function (id, rawJson, tokenKey, varName) {
    this.save(varName, await challenges.reveal(id, rawBody(this.render(rawJson)), auth.bearer(this.str(tokenKey))));
  });
