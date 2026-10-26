const { When, Then } = require('@cucumber/cucumber');
const authService = require('../../services/auth');
const users = require('../../services/users');
const auth = require('../../support/auth');
const { rawBody } = require('../../http/client');
const { assertContract } = require('../../contracts');
const { show } = require('../../http/attach');

// ─── Login (POST /login — opaque token; paced 12.5 s by the client) ───────

When('Login with {string} and {string} and save response as {string}', async function (emailKey, passwordKey, varName) {
  this.save(varName, await authService.login({ email: this.str(emailKey), password: this.str(passwordKey) }));
});

When('Login with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await authService.login(rawBody(this.render(rawJson))));
});

Then('Assert login response is successful in {string}', function (varName) {
  const body = this.body(varName);
  assertContract('LoginResponse', body);
  if (body.success !== true) throw new Error(`Expected success=true in login response. Body: ${show(body)}`);
});

// ─── Logout ───────────────────────────────────────────────────────────────

When('Logout user {string} with token {string} and save response as {string}', async function (idKey, tokenKey, varName) {
  this.save(varName, await users.logout(this.str(idKey), this.bearer(tokenKey)));
});

When('Logout user {string} with raw auth header {string} and save response as {string}', async function (idKey, header, varName) {
  this.save(varName, await users.logout(this.str(idKey), this.rawAuth(header)));
});

When('Logout user {string} with no auth token and save response as {string}', async function (idKey, varName) {
  this.save(varName, await users.logout(this.str(idKey), auth.none()));
});

// ─── HTTP Basic (GET /auth/basic — non-standard error shape: { error, message }) ──

When('Send GET basic auth request with no auth header and save as {string}', async function (varName) {
  this.save(varName, await authService.basicAuth());
});

When('Send GET basic auth request with credentials {string} and save as {string}', async function (userPass, varName) {
  this.save(varName, await authService.basicAuth(auth.basic(userPass)));
});

When('Send GET basic auth request with raw auth header {string} and save as {string}', async function (header, varName) {
  this.save(varName, await authService.basicAuth(auth.raw(header)));
});
