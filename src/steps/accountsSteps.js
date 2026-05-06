const { Before, Given, When, Then } = require('@cucumber/cucumber');
const ctx    = require('../context/scenarioContext');
const client = require('../api/restClient');
const paths  = require('../api/apiPaths');
const gen    = require('../utils/generator');
const { createUserReq, profileReq, contactsReq, addressReq, employmentReq, settingsReq } = require('../models/createUserReq');
const loginReq = require('../models/loginReq');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Rate-limit pacing
Before({ tags: '@allure.label.suite:User_Management' }, async function () {
  await sleep(2000);
});
Before({ tags: '@allure.label.subSuite:Login' }, async function () {
  await sleep(13000);
});

// ─── Create user helpers ───────────────────────────────────────────────────

Given('Create minimal user and save response as {string}', async (varName) => {
  const email    = gen.email();
  const password = gen.password();
  const body = createUserReq({
    email,
    username: gen.username(),
    password,
    profile: profileReq({ firstName: gen.firstName(), lastName: gen.lastName() }),
  });
  const res = await client.post(paths.USERS_CREATE, body);
  ctx.save(varName, res);
  ctx.save('generatedEmail', email);
  ctx.save('generatedPassword', password);
});

When('Create user with body and save response as {string}',
  { timeout: 30000 },
  async function (varName) {
    const email    = ctx.str('email');
    const password = ctx.str('password');
    const body = createUserReq({
      email,
      username: ctx.str('username'),
      password,
      profile: profileReq({
        firstName: ctx.str('firstName'),
        lastName:  ctx.str('lastName'),
      }),
    });
    const res = await client.post(paths.USERS_CREATE, body);
    ctx.save(varName, res);
  }
);

When('Create user with full body and save response as {string}',
  { timeout: 30000 },
  async function (varName) {
    const email    = ctx.str('email');
    const password = ctx.str('password');
    const body = createUserReq({
      email,
      username: ctx.str('username'),
      password,
      profile: profileReq({
        firstName:   ctx.str('firstName'),
        lastName:    ctx.str('lastName'),
        gender:      ctx.get('gender'),
        bio:         ctx.get('bio'),
        dateOfBirth: ctx.get('dateOfBirth'),
        interests:   ctx.get('interests'),
        avatarUrl:   ctx.get('avatarUrl'),
      }),
      contacts: ctx.get('contacts') ? contactsReq(ctx.get('contacts')) : undefined,
      address:  ctx.get('address')  ? addressReq(ctx.get('address'))   : undefined,
      employment: ctx.get('employment') ? employmentReq(ctx.get('employment')) : undefined,
      settings: ctx.get('settings') ? settingsReq(ctx.get('settings')) : undefined,
    });
    const res = await client.post(paths.USERS_CREATE, body);
    ctx.save(varName, res);
  }
);

Given('Set employment status {string}', (status) => ctx.save('employment', { status }));
Given('Set theme {string}', (theme) => ctx.save('settings', { theme }));

When('Create user with raw body {string} and save response as {string}', async (rawJson, varName) => {
  const body = JSON.parse(rawJson);
  const res = await client.post(paths.USERS_CREATE, body);
  ctx.save(varName, res);
});

// ─── Extract fields from response ─────────────────────────────────────────

Then('Extract {string} from {string} and save as {string}', (field, varName, saveAs) => {
  const data = ctx.get(varName, true).data;
  const parts = field.split('.');
  let value = data;
  for (const part of parts) {
    value = value?.[part];
  }
  if (value === undefined || value === null) {
    throw new Error(`Field '${field}' not found in response. Body: ${JSON.stringify(data)}`);
  }
  ctx.save(saveAs, String(value));
});

// ─── Get user ─────────────────────────────────────────────────────────────

When('Send GET user request for {string} and save response as {string}', async (idKey, varName) => {
  const id = ctx.str(idKey);
  const res = await client.get(paths.usersGet(id));
  ctx.save(varName, res);
});

// ─── List users ───────────────────────────────────────────────────────────

When('Send GET users list request and save response as {string}', async (varName) => {
  const res = await client.get(paths.USERS_LIST);
  ctx.save(varName, res);
});

When('Send GET users list request with page {int} per_page {int} and save response as {string}', async (page, perPage, varName) => {
  const res = await client.get(paths.USERS_LIST, { page, per_page: perPage });
  ctx.save(varName, res);
});

Then('Assert users list has {string} field in {string}', (field, varName) => {
  const body = ctx.get(varName, true).data;
  if (!(field in body)) throw new Error(`Field '${field}' not found in list response. Body: ${JSON.stringify(body)}`);
});

Then('Assert users list is not empty in {string}', (varName) => {
  const users = ctx.get(varName, true).data?.users;
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('Expected non-empty users array');
  }
});

// ─── User exists ──────────────────────────────────────────────────────────

When('Send HEAD exists request for {string} and save response as {string}', async (idKey, varName) => {
  const id = ctx.str(idKey);
  const res = await client.head(paths.usersExists(id));
  ctx.save(varName, res);
});

When('Send GET exists request for {string} and save response as {string}', async (idKey, varName) => {
  const id = ctx.str(idKey);
  const res = await client.get(paths.usersExists(id));
  ctx.save(varName, res);
});

// ─── Update user (PUT) ────────────────────────────────────────────────────

When('Update user {string} with token {string} and save response as {string}', async (idKey, tokenKey, varName) => {
  const id    = ctx.str(idKey);
  const token = ctx.str(tokenKey);
  const body  = createUserReq({
    email:    ctx.str('email'),
    username: ctx.str('username'),
    profile:  profileReq({ firstName: ctx.str('firstName'), lastName: ctx.str('lastName') }),
  });
  const res = await client.put(paths.usersUpdate(id), body, {
    Authorization: client.bearerHeader(token),
  });
  ctx.save(varName, res);
});

When('Update user {string} with raw body {string} token {string} and save response as {string}',
  async (idKey, rawJson, tokenKey, varName) => {
    const id    = ctx.str(idKey);
    const token = ctx.str(tokenKey);
    const body  = JSON.parse(rawJson);
    const res   = await client.put(paths.usersUpdate(id), body, {
      Authorization: client.bearerHeader(token),
    });
    ctx.save(varName, res);
  }
);

// ─── Patch user (PATCH) ───────────────────────────────────────────────────

When('Patch user {string} with field {string} value {string} token {string} and save response as {string}',
  async (idKey, field, value, tokenKey, varName) => {
    const id    = ctx.str(idKey);
    const token = ctx.str(tokenKey);
    const body  = { [field]: ctx.str(value) };
    const res   = await client.patch(paths.usersPatch(id), body, {
      Authorization: client.bearerHeader(token),
    });
    ctx.save(varName, res);
  }
);

When('Patch user {string} with raw body {string} token {string} and save response as {string}',
  async (idKey, rawJson, tokenKey, varName) => {
    const id    = ctx.str(idKey);
    const token = ctx.str(tokenKey);
    const body  = JSON.parse(rawJson);
    const res   = await client.patch(paths.usersPatch(id), body, {
      Authorization: client.bearerHeader(token),
    });
    ctx.save(varName, res);
  }
);

// ─── Delete user ──────────────────────────────────────────────────────────

When('Delete user {string} with token {string} and save response as {string}', async (idKey, tokenKey, varName) => {
  const id    = ctx.str(idKey);
  const token = ctx.str(tokenKey);
  const res   = await client.del(paths.usersDelete(id), {
    Authorization: client.bearerHeader(token),
  });
  ctx.save(varName, res);
});

// ─── Login ────────────────────────────────────────────────────────────────

When('Login with {string} and {string} and save response as {string}', async (emailKey, passwordKey, varName) => {
  const body = loginReq({ email: ctx.str(emailKey), password: ctx.str(passwordKey) });
  const res  = await client.post(paths.LOGIN, body);
  ctx.save(varName, res);
});

When('Login with raw body {string} and save response as {string}', async (rawJson, varName) => {
  const body = JSON.parse(rawJson);
  const res  = await client.post(paths.LOGIN, body);
  ctx.save(varName, res);
});

// ─── Logout ───────────────────────────────────────────────────────────────

When('Logout user {string} with token {string} and save response as {string}', async (idKey, tokenKey, varName) => {
  const id    = ctx.str(idKey);
  const token = ctx.str(tokenKey);
  const res   = await client.postNoBody(paths.usersLogout(id), {
    Authorization: client.bearerHeader(token),
  });
  ctx.save(varName, res);
});

// ─── Response field assertions ────────────────────────────────────────────

Then('Assert field {string} equals {string} in response {string}', (field, expected, varName) => {
  const data = ctx.get(varName, true).data;
  const parts = field.split('.');
  let actual = data;
  for (const part of parts) actual = actual?.[part];
  const resolved = ctx.str(expected);
  if (String(actual) !== resolved) {
    throw new Error(`Field '${field}': expected '${resolved}' but got '${actual}'`);
  }
});

Then('Assert field {string} is not null in response {string}', (field, varName) => {
  const data = ctx.get(varName, true).data;
  const parts = field.split('.');
  let actual = data;
  for (const part of parts) actual = actual?.[part];
  if (actual === undefined || actual === null) {
    throw new Error(`Field '${field}' is null/undefined. Body: ${JSON.stringify(data)}`);
  }
});

Then('Assert error code is {string} in response {string}', (code, varName) => {
  const actual = ctx.get(varName, true).data?.error?.code;
  if (actual !== code) throw new Error(`Expected error code '${code}' but got '${actual}'`);
});
