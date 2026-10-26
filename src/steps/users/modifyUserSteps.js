const { When } = require('@cucumber/cucumber');
const users = require('../../services/users');
const auth = require('../../support/auth');
const { rawBody } = require('../../http/client');
const { createUserReq, profileReq, randomUpdateBody, randomPatchBody } = require('../../builders/users');

// Every PUT / PATCH / DELETE comes in three auth flavours: a context token (bearer), a verbatim header value
// (raw — `${key}` placeholders interpolated) and no header at all. See support/auth.js for what each probes.

// ─── Update (PUT) ─────────────────────────────────────────────────────────

When('Update user {string} with token {string} and save response as {string}', async function (idKey, tokenKey, varName) {
  const body = createUserReq({
    email:    this.str('email'),
    username: this.str('username'),
    profile:  profileReq({ firstName: this.str('firstName'), lastName: this.str('lastName') }),
  });
  this.save(varName, await users.update(this.str(idKey), body, auth.bearer(this.str(tokenKey))));
});

When('Update user {string} with raw body {string} token {string} and save response as {string}',
  async function (idKey, rawJson, tokenKey, varName) {
    this.save(varName, await users.update(this.str(idKey), rawBody(this.render(rawJson)), auth.bearer(this.str(tokenKey))));
  });

When('Update user {string} with raw auth header {string} and save response as {string}', async function (idKey, header, varName) {
  this.save(varName, await users.update(this.str(idKey), randomUpdateBody(), auth.raw(this.render(header))));
});

When('Update user {string} with no auth token and save response as {string}', async function (idKey, varName) {
  this.save(varName, await users.update(this.str(idKey), randomUpdateBody(), auth.none()));
});

// ─── Patch (PATCH) ────────────────────────────────────────────────────────

When('Patch user {string} with field {string} value {string} token {string} and save response as {string}',
  async function (idKey, field, value, tokenKey, varName) {
    this.save(varName, await users.patch(this.str(idKey), { [field]: this.str(value) }, auth.bearer(this.str(tokenKey))));
  });

When('Patch user {string} with raw body {string} token {string} and save response as {string}',
  async function (idKey, rawJson, tokenKey, varName) {
    this.save(varName, await users.patch(this.str(idKey), rawBody(this.render(rawJson)), auth.bearer(this.str(tokenKey))));
  });

When('Patch user {string} with empty body token {string} and save response as {string}', async function (idKey, tokenKey, varName) {
  this.save(varName, await users.patch(this.str(idKey), {}, auth.bearer(this.str(tokenKey))));
});

When('Patch user {string} with raw auth header {string} and save response as {string}', async function (idKey, header, varName) {
  this.save(varName, await users.patch(this.str(idKey), randomPatchBody(), auth.raw(this.render(header))));
});

When('Patch user {string} with no auth token and save response as {string}', async function (idKey, varName) {
  this.save(varName, await users.patch(this.str(idKey), randomPatchBody(), auth.none()));
});

// ─── Delete ───────────────────────────────────────────────────────────────

When('Delete user {string} with token {string} and save response as {string}', async function (idKey, tokenKey, varName) {
  this.save(varName, await users.delete(this.str(idKey), auth.bearer(this.str(tokenKey))));
});

When('Delete user {string} with raw auth header {string} and save response as {string}', async function (idKey, header, varName) {
  this.save(varName, await users.delete(this.str(idKey), auth.raw(this.render(header))));
});

When('Delete user {string} with no auth token and save response as {string}', async function (idKey, varName) {
  this.save(varName, await users.delete(this.str(idKey), auth.none()));
});
