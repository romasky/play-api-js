/**
 * System endpoints: GET /health, the API descriptions (OpenAPI / Postman downloads) and POST /verify-recaptcha
 * (non-standard envelope { success, error: <string> }).
 */
const { When, Then } = require('@cucumber/cucumber');
const system = require('../../services/system');
const { rawBody } = require('../../http/client');

When('Send GET health request and save as {string}', async function (varName) {
  this.save(varName, await system.health());
});

When('Send GET health request with X-Request-ID {string} and save as {string}', async function (requestIdKey, varName) {
  this.save(varName, await system.health({ 'X-Request-ID': this.str(requestIdKey) }));
});

// ─── API documents ────────────────────────────────────────────────────────

When('Download the API document {string} and save response as {string}', async function (name, varName) {
  this.save(varName, await system.document(name));
});

When('Download the API document {string} with query {string} and save response as {string}', async function (name, query, varName) {
  this.save(varName, await system.document(name, this.query(query)));
});

Then('Assert Postman variable {string} is defined in response {string}', function (key, varName) {
  const keys = (this.body(varName)?.variable ?? []).map((v) => v.key);
  if (!keys.includes(key)) throw new Error(`collection variable '${key}' missing; defined: ${keys}`);
});

// ─── reCAPTCHA ────────────────────────────────────────────────────────────

When('Verify reCAPTCHA with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await system.verifyRecaptcha(rawBody(this.render(rawJson))));
});
