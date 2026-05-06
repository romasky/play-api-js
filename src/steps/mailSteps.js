const { When, Then } = require('@cucumber/cucumber');
const ctx    = require('../context/scenarioContext');
const client = require('../api/restClient');
const paths  = require('../api/apiPaths');
const createMailboxReq = require('../models/createMailboxReq');
const sendMessageReq   = require('../models/sendMessageReq');

// ─── Create mailbox ───────────────────────────────────────────────────────

When('Create mailbox and save response as {string}', async (varName) => {
  const res = await client.post(paths.MAIL_CREATE, {});
  ctx.save(varName, res);
});

When('Create mailbox with domain {string} and save response as {string}', async (domain, varName) => {
  const body = createMailboxReq({ domain });
  const res  = await client.post(paths.MAIL_CREATE, body);
  ctx.save(varName, res);
});

When('Create mailbox with local_part {string} and save response as {string}', async (localPart, varName) => {
  const body = createMailboxReq({ localPart });
  const res  = await client.post(paths.MAIL_CREATE, body);
  ctx.save(varName, res);
});

When('Create mailbox with context local_part {string} and save response as {string}', async (localPartKey, varName) => {
  const body = createMailboxReq({ localPart: ctx.str(localPartKey) });
  const res  = await client.post(paths.MAIL_CREATE, body);
  ctx.save(varName, res);
});

When('Create mailbox with domain {string} local_part {string} and save response as {string}',
  async (domain, localPart, varName) => {
    const body = createMailboxReq({ domain, localPart });
    const res  = await client.post(paths.MAIL_CREATE, body);
    ctx.save(varName, res);
  }
);

When('Create mailbox with raw body {string} and save response as {string}', async (rawJson, varName) => {
  const body = JSON.parse(rawJson);
  const res  = await client.post(paths.MAIL_CREATE, body);
  ctx.save(varName, res);
});

// ─── Get mailbox ──────────────────────────────────────────────────────────

When('Get mailbox with token {string} and save response as {string}', async (tokenKey, varName) => {
  const token = ctx.str(tokenKey);
  const res   = await client.get(paths.mailGet(token));
  ctx.save(varName, res);
});

// ─── Delete mailbox ───────────────────────────────────────────────────────

When('Delete mailbox with token {string} and save response as {string}', async (tokenKey, varName) => {
  const token = ctx.str(tokenKey);
  const res   = await client.del(paths.mailDelete(token));
  ctx.save(varName, res);
});

// ─── List messages ────────────────────────────────────────────────────────

When('Get messages for token {string} and save response as {string}', async (tokenKey, varName) => {
  const token = ctx.str(tokenKey);
  const res   = await client.get(paths.mailMessages(token));
  ctx.save(varName, res);
});

// ─── Get single message ───────────────────────────────────────────────────

When('Get message {string} for token {string} and save response as {string}',
  async (msgIdKey, tokenKey, varName) => {
    const token = ctx.str(tokenKey);
    const msgId = ctx.str(msgIdKey);
    const res   = await client.get(paths.mailMessage(token, msgId));
    ctx.save(varName, res);
  }
);

// ─── Send message ─────────────────────────────────────────────────────────

When('Send message to token {string} from {string} subject {string} body {string} and save response as {string}',
  async (tokenKey, fromKey, subjectKey, bodyKey, varName) => {
    const token = ctx.str(tokenKey);
    const body  = sendMessageReq({
      from:    ctx.str(fromKey),
      subject: ctx.str(subjectKey),
      body:    ctx.str(bodyKey),
    });
    const res = await client.post(paths.mailSend(token), body);
    ctx.save(varName, res);
  }
);

When('Send message to token {string} with raw body {string} and save response as {string}',
  async (tokenKey, rawJson, varName) => {
    const token = ctx.str(tokenKey);
    const body  = JSON.parse(rawJson);
    const res   = await client.post(paths.mailSend(token), body);
    ctx.save(varName, res);
  }
);

// ─── Mailbox field assertions ─────────────────────────────────────────────

Then('Assert mailbox has token in {string}', (varName) => {
  const data = ctx.get(varName, true).data;
  if (!data?.token) throw new Error(`Missing 'token' in mailbox response. Body: ${JSON.stringify(data)}`);
});

Then('Assert mailbox has email_address in {string}', (varName) => {
  const data = ctx.get(varName, true).data;
  if (!data?.email_address) throw new Error(`Missing 'email_address' in mailbox response. Body: ${JSON.stringify(data)}`);
});

Then('Assert messages list has count field in {string}', (varName) => {
  const body = ctx.get(varName, true).data;
  if (!('count' in body)) throw new Error(`Missing 'count' field in messages response. Body: ${JSON.stringify(body)}`);
});

Then('Assert error code is {string} in mail response {string}', (code, varName) => {
  const actual = ctx.get(varName, true).data?.error?.code;
  if (actual !== code) throw new Error(`Expected error code '${code}' but got '${actual}'`);
});
