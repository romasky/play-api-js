/**
 * /webhooks/* steps. Every created inbox is deleted after the scenario (`saveCreated`): the server allows only
 * 20 ACTIVE inboxes per IP, so a leak would break the 21st scenario for two hours.
 */
const { When, Then } = require('@cucumber/cucumber');
const webhooks = require('../../services/webhooks');
const { saveCreated } = require('../../support/cleanup');
const { BINARY, WEBHOOK_BODY_LIMIT } = require('../../utils/samples');
const { SIGNED_BODY, headerFor } = require('../../utils/webhookSign');
const { choose } = require('../../utils/lookup');

const SIZES = { '64 KiB': WEBHOOK_BODY_LIMIT, '64 KiB + 1': WEBHOOK_BODY_LIMIT + 1 };

When('Create webhook inbox and save response as {string}', function (varName) {
  return saveCreated(this, varName, webhooks.createInbox, (body) => webhooks.deleteInbox(body.token));
});

When('Get webhook inbox {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await webhooks.getInbox(this.str(tokenKey)));
});

When('Delete webhook inbox {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await webhooks.deleteInbox(this.str(tokenKey)));
});

// ─── Capture (/webhooks/in/{ingest_token}) — bodies go as raw bytes, compared byte-for-byte later ──

When('Send {string} to webhook ingest {string} and save response as {string}', async function (method, ingestKey, varName) {
  this.save(varName, await webhooks.ingest(this.str(ingestKey), method));
});

When('Send POST to webhook ingest {string} with JSON body {string} and save response as {string}', async function (ingestKey, json, varName) {
  this.save('sentBody', json);
  this.save(varName, await webhooks.ingest(this.str(ingestKey), 'POST', { content: json }));
});

When('Send POST to webhook ingest {string} with header {string} values {string} and {string} and query {string} and save response as {string}',
  async function (ingestKey, name, first, second, query, varName) {
    const headers = { [name]: [first, second] }; // an array is sent as two header lines
    this.save(varName, await webhooks.ingest(this.str(ingestKey), 'POST', { headers, params: this.query(query) }));
  });

When('Send POST to webhook ingest {string} with header {string} value {string} and save response as {string}',
  async function (ingestKey, name, value, varName) {
    this.save(varName, await webhooks.ingest(this.str(ingestKey), 'POST', { headers: { [name]: value } }));
  });

When('Send POST to webhook ingest {string} with a binary body and save response as {string}', async function (ingestKey, varName) {
  this.save(varName, await webhooks.ingest(this.str(ingestKey), 'POST', { content: BINARY, contentType: 'application/octet-stream' }));
});

When('Send POST to webhook ingest {string} with a body of size {string} and save response as {string}', async function (ingestKey, size, varName) {
  const content = 'a'.repeat(choose(SIZES, size, 'body size'));
  this.save(varName, await webhooks.ingest(this.str(ingestKey), 'POST', { content, contentType: 'text/plain' }));
});

When('Send POST to webhook ingest {string} signed with {string} as {string} and save response as {string}',
  async function (ingestKey, secretKey, kind, varName) {
    const headers = headerFor(kind, this.str(secretKey), SIGNED_BODY);
    this.save(varName, await webhooks.ingest(this.str(ingestKey), 'POST', { content: SIGNED_BODY, headers }));
  });

// ─── Events ───────────────────────────────────────────────────────────────

When('List webhook events of {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await webhooks.listEvents(this.str(tokenKey)));
});

When('List webhook events of {string} with query {string} and save response as {string}', async function (tokenKey, query, varName) {
  this.save(varName, await webhooks.listEvents(this.str(tokenKey), this.query(query)));
});

When('Get webhook event {string} of {string} and save response as {string}', async function (eventKey, tokenKey, varName) {
  this.save(varName, await webhooks.getEvent(this.str(tokenKey), this.str(eventKey)));
});

Then('Assert field {string} is the base64 of the binary body in response {string}', function (field, varName) {
  const actual = this.body(varName)?.[field];
  if (actual == null || !Buffer.from(actual, 'base64').equals(BINARY)) throw new Error(`'${field}' = '${actual}' is not base64(BINARY)`);
});
