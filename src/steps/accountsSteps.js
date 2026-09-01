const { Before, Given, When, Then } = require('@cucumber/cucumber');
const ctx    = require('../context/scenarioContext');
const client = require('../api/restClient');
const paths  = require('../api/apiPaths');
const gen    = require('../utils/generator');
const { createUserReq, profileReq, contactsReq, addressReq, employmentReq, settingsReq } = require('../models/createUserReq');
const loginReq      = require('../models/loginReq');
const userResponse  = require('../models/userResponse');
const loginResponse = require('../models/loginResponse');
const usersList     = require('../models/usersListResponse');
const errorResponse = require('../models/errorResponse');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Rate-limit pacing
Before({ tags: '@allure.label.suite:User_Management' }, async function () {
  await sleep(2000);
});
Before({ tags: '@allure.label.subSuite:Login', timeout: 15000 }, async function () {
  await sleep(13000);
});

// ─── Authorization header variants ────────────────────────────────────────
// The BearerAuth middleware checks, in order:
//   header missing            → 401 MISSING_TOKEN          → auth.none()
//   not "Bearer <token>"      → 401 INVALID_TOKEN_FORMAT   → auth.raw(value)   (sent verbatim)
//   token ≠ user's token      → 401 INVALID_TOKEN          → auth.bearer(key)  (normal path)

//
// `raw` values are passed to axios untouched; note axios (and RFC 7230 servers) trim
// surrounding whitespace, so "Bearer " and "Bearer" are the same request on the wire.

const auth = {
  bearer: (tokenKey) => ({ Authorization: client.bearerHeader(ctx.str(tokenKey)) }),
  raw:    (value)    => ({ Authorization: value }),
  none:   ()         => ({}),
};

// ─── Request-body builders ────────────────────────────────────────────────

const minimalProfile = () => profileReq({ firstName: gen.firstName(), lastName: gen.lastName() });

/** Valid random bodies for scenarios that test auth, not payload validation. */
const randomUpdateBody = () => createUserReq({ email: gen.email(), username: gen.username(), profile: minimalProfile() });
const randomPatchBody  = () => ({ username: gen.username() });

/** Bodies assembled from context variables set by earlier Given steps. */
const contextUpdateBody = () => createUserReq({
  email:    ctx.str('email'),
  username: ctx.str('username'),
  profile:  profileReq({ firstName: ctx.str('firstName'), lastName: ctx.str('lastName') }),
});

// ─── Create user ──────────────────────────────────────────────────────────

Given('Create minimal user and save response as {string}', async (varName) => {
  const email    = gen.email();
  const password = gen.password();
  const body = createUserReq({ email, username: gen.username(), password, profile: minimalProfile() });
  ctx.save(varName, await client.post(paths.USERS_CREATE, body));
  ctx.save('generatedEmail', email);
  ctx.save('generatedPassword', password);
});

When('Create user with body and save response as {string}',
  { timeout: 30000 },
  async function (varName) {
    const body = createUserReq({
      email:    ctx.str('email'),
      username: ctx.str('username'),
      password: ctx.str('password'),
      profile:  profileReq({ firstName: ctx.str('firstName'), lastName: ctx.str('lastName') }),
    });
    ctx.save(varName, await client.post(paths.USERS_CREATE, body));
  }
);

When('Create user with full body and save response as {string}',
  { timeout: 30000 },
  async function (varName) {
    const body = createUserReq({
      email:    ctx.str('email'),
      username: ctx.str('username'),
      password: ctx.str('password'),
      profile: profileReq({
        firstName:   ctx.str('firstName'),
        lastName:    ctx.str('lastName'),
        gender:      ctx.opt('gender'),
        bio:         ctx.opt('profileBio'),
        dateOfBirth: ctx.opt('dateOfBirth'),
        interests:   ctx.opt('interests'),
        avatarUrl:   ctx.opt('avatarUrl'),
      }),
      contacts:   ctx.opt('contacts')   ? contactsReq(ctx.opt('contacts'))     : undefined,
      address:    ctx.opt('address')    ? addressReq(ctx.opt('address'))       : undefined,
      employment: ctx.opt('employment') ? employmentReq(ctx.opt('employment')) : undefined,
      settings:   ctx.opt('settings')   ? settingsReq(ctx.opt('settings'))     : undefined,
    });
    ctx.save(varName, await client.post(paths.USERS_CREATE, body));
  }
);

When('Create user with all optional fields and save response as {string}', async (varName) => {
  const body = createUserReq({
    email:    gen.email(),
    username: gen.username(),
    password: gen.password(),
    profile: profileReq({
      firstName: gen.firstName(), lastName: gen.lastName(), middleName: 'Michael',
      gender: 'other', bio: 'Short bio here.', dateOfBirth: '1990-01-15',
      interests: ['coding', 'travel'], avatarUrl: 'https://example.com/avatar.jpg',
    }),
    contacts: contactsReq({
      phone: gen.phoneNumber(), telegram: '@tester', whatsapp: gen.phoneNumber(),
      linkedin: 'https://linkedin.com/in/tester', github: 'https://github.com/tester', website: 'https://tester.dev',
    }),
    address: addressReq({
      country: 'US', state: 'California', city: 'San Francisco', street: 'Market St',
      building: '100', apartment: '5A', zipCode: '94105', coordinates: { latitude: 37.7749, longitude: -122.4194 },
    }),
    employment: employmentReq({
      status: 'employed', company: 'Acme Inc', position: 'Engineer', department: 'R&D',
      startDate: '2020-03-01', salary: { amount: 120000, currency: 'USD' },
    }),
    settings: settingsReq({
      language: 'en', timezone: 'America/Los_Angeles', theme: 'dark',
      notificationsEnabled: true, twoFactorEnabled: false, privateProfile: false,
    }),
  });
  ctx.save(varName, await client.post(paths.USERS_CREATE, body));
});

When('Create user with raw body {string} and save response as {string}', async (rawJson, varName) => {
  ctx.save(varName, await client.post(paths.USERS_CREATE, JSON.parse(rawJson)));
});

// Optional-field inputs consumed by "Create user with full body"
Given('Set employment status {string}', (status) => ctx.save('employment', { status }));
Given('Set theme {string}',             (theme)  => ctx.save('settings', { theme }));
Given('Set interests {string}',         (csv)    => ctx.save('interests', csv === '' ? [] : csv.split(',')));
// saved as 'profileBio' so the literal "bio" stays usable in assertions (ctx.str resolves context keys first)
Given('Set bio of length {int}',        (n)      => ctx.save('profileBio', gen.string(n, { spaces: true })));
Given('Generate username of length {int} and save as {string}', (n, key) => ctx.save(key, gen.alphanumericString(n)));

// ─── Get user ─────────────────────────────────────────────────────────────

When('Send GET user request for {string} and save response as {string}', async (idKey, varName) => {
  ctx.save(varName, await client.get(paths.usersGet(ctx.str(idKey))));
});

// ─── List users ───────────────────────────────────────────────────────────

When('Send GET users list request and save response as {string}', async (varName) => {
  ctx.save(varName, await client.get(paths.USERS_LIST));
});

// String-typed so boundary rows can pass non-numeric values (abc, -5, xyz)
When('Send GET users list request with page {string} per_page {string} and save response as {string}',
  async (page, perPage, varName) => {
    ctx.save(varName, await client.get(paths.USERS_LIST, { page, per_page: perPage }));
  }
);

Then('Assert users list is not empty in {string}', (varName) => {
  usersList.assertNotEmpty(ctx.get(varName, true));
});

Then('Assert users list items have no {string} field in {string}', (field, varName) => {
  usersList.assertItemsHaveNoField(ctx.get(varName, true), field);
});

// ─── User exists ──────────────────────────────────────────────────────────

When('Send HEAD exists request for {string} and save response as {string}', async (idKey, varName) => {
  ctx.save(varName, await client.head(paths.usersExists(ctx.str(idKey))));
});

When('Send GET exists request for {string} and save response as {string}', async (idKey, varName) => {
  ctx.save(varName, await client.get(paths.usersExists(ctx.str(idKey))));
});

// ─── Update user (PUT) ────────────────────────────────────────────────────

async function updateUser(idKey, body, headers, varName) {
  ctx.save(varName, await client.put(paths.usersUpdate(ctx.str(idKey)), body, headers));
}

When('Update user {string} with token {string} and save response as {string}',
  (idKey, tokenKey, varName) => updateUser(idKey, contextUpdateBody(), auth.bearer(tokenKey), varName));

When('Update user {string} with raw body {string} token {string} and save response as {string}',
  (idKey, rawJson, tokenKey, varName) => updateUser(idKey, JSON.parse(rawJson), auth.bearer(tokenKey), varName));

When('Update user {string} with raw auth header {string} and save response as {string}',
  (idKey, header, varName) => updateUser(idKey, randomUpdateBody(), auth.raw(header), varName));

When('Update user {string} with no auth token and save response as {string}',
  (idKey, varName) => updateUser(idKey, randomUpdateBody(), auth.none(), varName));

// ─── Patch user (PATCH) ───────────────────────────────────────────────────

async function patchUser(idKey, body, headers, varName) {
  ctx.save(varName, await client.patch(paths.usersPatch(ctx.str(idKey)), body, headers));
}

When('Patch user {string} with field {string} value {string} token {string} and save response as {string}',
  (idKey, field, value, tokenKey, varName) => patchUser(idKey, { [field]: ctx.str(value) }, auth.bearer(tokenKey), varName));

When('Patch user {string} with raw body {string} token {string} and save response as {string}',
  (idKey, rawJson, tokenKey, varName) => patchUser(idKey, JSON.parse(rawJson), auth.bearer(tokenKey), varName));

When('Patch user {string} with empty body token {string} and save response as {string}',
  (idKey, tokenKey, varName) => patchUser(idKey, {}, auth.bearer(tokenKey), varName));

When('Patch user {string} with raw auth header {string} and save response as {string}',
  (idKey, header, varName) => patchUser(idKey, randomPatchBody(), auth.raw(header), varName));

When('Patch user {string} with no auth token and save response as {string}',
  (idKey, varName) => patchUser(idKey, randomPatchBody(), auth.none(), varName));

// ─── Delete user ──────────────────────────────────────────────────────────

async function deleteUser(idKey, headers, varName) {
  ctx.save(varName, await client.del(paths.usersDelete(ctx.str(idKey)), headers));
}

When('Delete user {string} with token {string} and save response as {string}',
  (idKey, tokenKey, varName) => deleteUser(idKey, auth.bearer(tokenKey), varName));

When('Delete user {string} with raw auth header {string} and save response as {string}',
  (idKey, header, varName) => deleteUser(idKey, auth.raw(header), varName));

When('Delete user {string} with no auth token and save response as {string}',
  (idKey, varName) => deleteUser(idKey, auth.none(), varName));

// ─── Login ────────────────────────────────────────────────────────────────

When('Login with {string} and {string} and save response as {string}', async (emailKey, passwordKey, varName) => {
  const body = loginReq({ email: ctx.str(emailKey), password: ctx.str(passwordKey) });
  ctx.save(varName, await client.post(paths.LOGIN, body));
});

When('Login with raw body {string} and save response as {string}', async (rawJson, varName) => {
  ctx.save(varName, await client.post(paths.LOGIN, JSON.parse(rawJson)));
});

// ─── Logout ───────────────────────────────────────────────────────────────

async function logoutUser(idKey, headers, varName) {
  ctx.save(varName, await client.postNoBody(paths.usersLogout(ctx.str(idKey)), headers));
}

When('Logout user {string} with token {string} and save response as {string}',
  (idKey, tokenKey, varName) => logoutUser(idKey, auth.bearer(tokenKey), varName));

When('Logout user {string} with raw auth header {string} and save response as {string}',
  (idKey, header, varName) => logoutUser(idKey, auth.raw(header), varName));

When('Logout user {string} with no auth token and save response as {string}',
  (idKey, varName) => logoutUser(idKey, auth.none(), varName));

// ─── Typed response assertions ────────────────────────────────────────────

Then('Assert error code is {string} in response {string}', (code, varName) => {
  errorResponse.assertCode(ctx.get(varName, true), code);
});

Then('Assert user response has all core fields in {string}', (varName) => {
  userResponse.assertCoreFields(ctx.get(varName, true));
});

Then('Assert login response is successful in {string}', (varName) => {
  loginResponse.assertSuccessful(ctx.get(varName, true));
});
