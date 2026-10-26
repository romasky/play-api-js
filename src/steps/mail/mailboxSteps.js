const { When } = require('@cucumber/cucumber');
const mail = require('../../services/mail');
const { rawBody } = require('../../http/client');
const { createMailboxReq } = require('../../builders/mail');

// ─── Create ───────────────────────────────────────────────────────────────

When('Create mailbox and save response as {string}', async function (varName) {
  this.save(varName, await mail.createMailbox());
});

When('Create mailbox with domain {string} and save response as {string}', async function (domain, varName) {
  this.save(varName, await mail.createMailbox(createMailboxReq({ domain })));
});

When('Create mailbox with local_part {string} and save response as {string}', async function (localPart, varName) {
  this.save(varName, await mail.createMailbox(createMailboxReq({ localPart })));
});

When('Create mailbox with context local_part {string} and save response as {string}', async function (localPartKey, varName) {
  this.save(varName, await mail.createMailbox(createMailboxReq({ localPart: this.str(localPartKey) })));
});

When('Create mailbox with domain {string} local_part {string} and save response as {string}',
  async function (domain, localPart, varName) {
    this.save(varName, await mail.createMailbox(createMailboxReq({ domain, localPart })));
  });

When('Create mailbox with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await mail.createMailbox(rawBody(this.render(rawJson))));
});

// ─── Get / delete ─────────────────────────────────────────────────────────

When('Get mailbox with token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await mail.getMailbox(this.str(tokenKey)));
});

When('Delete mailbox with token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await mail.deleteMailbox(this.str(tokenKey)));
});
