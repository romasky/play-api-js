const { Given, When } = require('@cucumber/cucumber');
const users = require('../../services/users');
const gen = require('../../utils/generator');
const { rawBody } = require('../../http/client');
const { show } = require('../../http/attach');
const {
  createUserReq, profileReq, contactsReq, addressReq, employmentReq, settingsReq, minimalUser, adminUser, fullUser,
} = require('../../builders/users');

/** POST the body; remember its credentials as generatedEmail / generatedPassword for later Login steps. */
async function createAndRemember(world, { email, password, body }, create, varName) {
  world.save(varName, await create(body));
  world.save('generatedEmail', email);
  world.save('generatedPassword', password);
}

/** Composite setup: create, require 201, keep only the token (and id) — the response itself is not needed. */
async function created(world, user, create, tokenKey, idKey) {
  await createAndRemember(world, user, create, '_setup');
  const res = world.res('_setup');
  if (res.status !== 201) throw new Error(`setup create failed ${res.status}: ${show(res.data)}`);
  world.save(tokenKey, res.data.access_token);
  if (idKey) world.save(idKey, res.data.id);
}

Given('Create minimal user and save response as {string}', async function (varName) {
  await createAndRemember(this, minimalUser(), users.create, varName);
});

Given('Create user in country {string} and save response as {string}', async function (countryKey, varName) {
  await createAndRemember(this, minimalUser({ country: this.str(countryKey) }), users.create, varName);
});

Given('Create admin user and save response as {string}', async function (varName) {
  await createAndRemember(this, adminUser(), users.createAdmin, varName);
});

Given('a user with token {string}', async function (tokenKey) {
  await created(this, minimalUser(), users.create, tokenKey);
});

Given('a user with id {string} and token {string}', async function (idKey, tokenKey) {
  await created(this, minimalUser(), users.create, tokenKey, idKey);
});

Given('an admin with token {string}', async function (tokenKey) {
  await created(this, adminUser(), users.createAdmin, tokenKey);
});

Given('an admin with id {string} and token {string}', async function (idKey, tokenKey) {
  await created(this, adminUser(), users.createAdmin, tokenKey, idKey);
});

/** Body assembled from context variables set by earlier Given steps. */
When('Create user with body and save response as {string}', async function (varName) {
  const body = createUserReq({
    email:    this.str('email'),
    username: this.str('username'),
    password: this.str('password'),
    profile:  profileReq({ firstName: this.str('firstName'), lastName: this.str('lastName') }),
  });
  this.save(varName, await users.create(body));
});

When('Create user with full body and save response as {string}', async function (varName) {
  const section = (key, build) => (this.opt(key) ? build(this.opt(key)) : undefined);
  const body = createUserReq({
    email:    this.str('email'),
    username: this.str('username'),
    password: this.str('password'),
    profile: profileReq({
      firstName:   this.str('firstName'),
      lastName:    this.str('lastName'),
      gender:      this.opt('gender'),
      bio:         this.opt('profileBio'),
      dateOfBirth: this.opt('dateOfBirth'),
      interests:   this.opt('interests'),
      avatarUrl:   this.opt('avatarUrl'),
    }),
    contacts:   section('contacts', contactsReq),
    address:    section('address', addressReq),
    employment: section('employment', employmentReq),
    settings:   section('settings', settingsReq),
  });
  this.save(varName, await users.create(body));
});

When('Create user with all optional fields and save response as {string}', async function (varName) {
  this.save(varName, await users.create(fullUser()));
});

When('Create user with raw body {string} and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await users.create(rawBody(this.render(rawJson))));
});

// ─── Optional-field inputs consumed by "Create user with full body" ───────

Given('Set employment status {string}', function (status) { this.save('employment', { status }); });
Given('Set theme {string}',             function (theme)  { this.save('settings', { theme }); });
Given('Set interests {string}',         function (csv)    { this.save('interests', csv === '' ? [] : csv.split(',')); });
// saved as 'profileBio' so the literal "bio" stays usable in assertions (str() resolves context keys first)
Given('Set bio of length {int}',        function (n)      { this.save('profileBio', gen.string(n, { spaces: true })); });
Given('Generate username of length {int} and save as {string}', function (n, key) { this.save(key, gen.alphanumericString(n)); });
