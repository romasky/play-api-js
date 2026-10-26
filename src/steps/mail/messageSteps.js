const { When, Then } = require('@cucumber/cucumber');
const mail = require('../../services/mail');
const { rawBody } = require('../../http/client');
const { sendMessageReq } = require('../../builders/mail');
const { items, assertEveryItem } = require('../../assertions/body');

When('Get messages for token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await mail.listMessages(this.str(tokenKey)));
});

When('Get message {string} for token {string} and save response as {string}', async function (msgIdKey, tokenKey, varName) {
  this.save(varName, await mail.getMessage(this.str(tokenKey), this.str(msgIdKey)));
});

When('Send message to token {string} from {string} subject {string} body {string} and save response as {string}',
  async function (tokenKey, fromKey, subjectKey, bodyKey, varName) {
    const body = sendMessageReq({ from: this.str(fromKey), subject: this.str(subjectKey), body: this.str(bodyKey) });
    this.save(varName, await mail.send(this.str(tokenKey), body));
  });

When('Send message to token {string} with raw body {string} and save response as {string}',
  async function (tokenKey, rawJson, varName) {
    this.save(varName, await mail.send(this.str(tokenKey), rawBody(this.render(rawJson))));
  });

// ─── SMTP response simulator (send-to: always 200, `accepted` tells the outcome) ──

When('Send to {string} from mailbox {string} and save response as {string}', async function (toKey, tokenKey, varName) {
  this.save(varName, await mail.sendTo(this.str(tokenKey), { to: this.str(toKey) }));
});

When('Send to {string} from mailbox {string} with subject {string} and save response as {string}',
  async function (toKey, tokenKey, subject, varName) {
    const body = { to: this.str(toKey), subject, body: 'Sent through the SMTP response simulator' };
    this.save(varName, await mail.sendTo(this.str(tokenKey), body));
  });

When('Send to from mailbox {string} with raw body {string} and save response as {string}', async function (tokenKey, rawJson, varName) {
  this.save(varName, await mail.sendTo(this.str(tokenKey), rawBody(this.render(rawJson))));
});

/**
 * List items carry only `body_preview`; the full `body` / `html_body` / `headers` belong to the single-message
 * endpoint (an own-property check: `body_preview` contains the substring `body`).
 */
Then('Assert messages list {string} items have no full body', function (varName) {
  const body = this.body(varName);
  if (items(body, 'messages').length === 0) throw new Error('Expected at least one message in the list to check its shape');
  assertEveryItem(body, 'messages', 'body_preview');
  for (const field of ['body', 'html_body', 'headers']) assertEveryItem(body, 'messages', field, { present: false });
});
