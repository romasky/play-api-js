const { When, Then } = require('@cucumber/cucumber');
const ctx    = require('../context/scenarioContext');
const client = require('../api/restClient');
const paths  = require('../api/apiPaths');
const createMailboxReq = require('../models/createMailboxReq');
const sendMessageReq   = require('../models/sendMessageReq');
const mailboxResponse  = require('../models/mailboxResponse');

// ─── Create mailbox ───────────────────────────────────────────────────────

When('Create mailbox and save response as {string}', async (varName) => {
  ctx.save(varName, await client.post(paths.MAIL_CREATE, {}));
});

When('Create mailbox with domain {string} and save response as {string}', async (domain, varName) => {
  ctx.save(varName, await client.post(paths.MAIL_CREATE, createMailboxReq({ domain })));
});

When('Create mailbox with local_part {string} and save response as {string}', async (localPart, varName) => {
  ctx.save(varName, await client.post(paths.MAIL_CREATE, createMailboxReq({ localPart })));
});

When('Create mailbox with context local_part {string} and save response as {string}', async (localPartKey, varName) => {
  ctx.save(varName, await client.post(paths.MAIL_CREATE, createMailboxReq({ localPart: ctx.str(localPartKey) })));
});

When('Create mailbox with domain {string} local_part {string} and save response as {string}',
  async (domain, localPart, varName) => {
    ctx.save(varName, await client.post(paths.MAIL_CREATE, createMailboxReq({ domain, localPart })));
  }
);

When('Create mailbox with raw body {string} and save response as {string}', async (rawJson, varName) => {
  ctx.save(varName, await client.post(paths.MAIL_CREATE, JSON.parse(rawJson)));
});

// ─── Get / delete mailbox ─────────────────────────────────────────────────

When('Get mailbox with token {string} and save response as {string}', async (tokenKey, varName) => {
  ctx.save(varName, await client.get(paths.mailGet(ctx.str(tokenKey))));
});

When('Delete mailbox with token {string} and save response as {string}', async (tokenKey, varName) => {
  ctx.save(varName, await client.del(paths.mailDelete(ctx.str(tokenKey))));
});

// ─── Messages ─────────────────────────────────────────────────────────────

When('Get messages for token {string} and save response as {string}', async (tokenKey, varName) => {
  ctx.save(varName, await client.get(paths.mailMessages(ctx.str(tokenKey))));
});

When('Get message {string} for token {string} and save response as {string}',
  async (msgIdKey, tokenKey, varName) => {
    ctx.save(varName, await client.get(paths.mailMessage(ctx.str(tokenKey), ctx.str(msgIdKey))));
  }
);

When('Send message to token {string} from {string} subject {string} body {string} and save response as {string}',
  async (tokenKey, fromKey, subjectKey, bodyKey, varName) => {
    const body = sendMessageReq({
      from:    ctx.str(fromKey),
      subject: ctx.str(subjectKey),
      body:    ctx.str(bodyKey),
    });
    ctx.save(varName, await client.post(paths.mailSend(ctx.str(tokenKey)), body));
  }
);

When('Send message to token {string} with raw body {string} and save response as {string}',
  async (tokenKey, rawJson, varName) => {
    ctx.save(varName, await client.post(paths.mailSend(ctx.str(tokenKey)), JSON.parse(rawJson)));
  }
);

// ─── Typed list-shape assertion ───────────────────────────────────────────

Then('Assert messages list {string} items have no full body', (varName) => {
  mailboxResponse.assertListItemsHaveNoFullBody(ctx.get(varName, true));
});
