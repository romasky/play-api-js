/**
 * /files/* steps. Samples are in-memory (utils/samples.js); every successful upload is deleted after the
 * scenario because files share a server-side storage budget (`saveCreated`).
 *
 * "anonymously" (not "with no auth token") is deliberate: an upload without a header is a valid, OWNERLESS
 * upload — the API's own term — not an auth failure.
 */
const { When, Then } = require('@cucumber/cucumber');
const files = require('../../services/files');
const auth = require('../../support/auth');
const { saveCreated } = require('../../support/cleanup');
const { sample } = require('../../utils/samples');

function upload(world, varName, headers, file, opts) {
  return saveCreated(world, varName, () => files.upload(headers, file, opts), (body) => files.delete(body.file_id, headers));
}

When('Upload sample {string} with token {string} and save response as {string}', function (name, tokenKey, varName) {
  return upload(this, varName, auth.bearer(this.str(tokenKey)), sample(name));
});

When('Upload sample {string} anonymously and save response as {string}', function (name, varName) {
  return upload(this, varName, auth.none(), sample(name));
});

When('Upload sample {string} declared as {string} anonymously and save response as {string}', function (name, type, varName) {
  return upload(this, varName, auth.none(), { ...sample(name), type });
});

When('Upload sample {string} with description {string} anonymously and save response as {string}', function (name, descKey, varName) {
  return upload(this, varName, auth.none(), sample(name), { description: this.str(descKey) });
});

When('Upload sample {string} in multipart field {string} anonymously and save response as {string}', function (name, field, varName) {
  return upload(this, varName, auth.none(), sample(name), { field });
});

When('Upload sample {string} with raw auth header {string} and save response as {string}', function (name, header, varName) {
  return upload(this, varName, auth.raw(this.render(header)), sample(name));
});

When('Upload a multipart body without a file part and save response as {string}', function (varName) {
  return upload(this, varName, auth.none(), null, { description: 'no file here' });
});

// deliberately a plain object: the point is that it is NOT multipart
When('Upload a JSON body instead of multipart and save response as {string}', async function (varName) {
  this.save(varName, await files.uploadJson({ file: 'not-a-file' }, auth.none()));
});

// ─── List / metadata / download / delete ──────────────────────────────────

When('List my files with token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await files.listMine(auth.bearer(this.str(tokenKey))));
});

When('List my files with query {string} and token {string} and save response as {string}', async function (query, tokenKey, varName) {
  this.save(varName, await files.listMine(auth.bearer(this.str(tokenKey)), new URLSearchParams(this.render(query))));
});

When('List my files with no auth token and save response as {string}', async function (varName) {
  this.save(varName, await files.listMine(auth.none()));
});

When('Get file {string} metadata and save response as {string}', async function (idKey, varName) {
  this.save(varName, await files.metadata(this.str(idKey)));
});

When('Get file {string} metadata with raw auth header {string} and save response as {string}', async function (idKey, header, varName) {
  this.save(varName, await files.metadata(this.str(idKey), auth.raw(this.render(header))));
});

When('Download file {string} and save response as {string}', async function (idKey, varName) {
  this.save(varName, await files.download(this.str(idKey)));
});

When('Download file {string} with query {string} and save response as {string}', async function (idKey, query, varName) {
  this.save(varName, await files.download(this.str(idKey), new URLSearchParams(this.render(query))));
});

When('Delete file {string} with token {string} and save response as {string}', async function (idKey, tokenKey, varName) {
  this.save(varName, await files.delete(this.str(idKey), auth.bearer(this.str(tokenKey))));
});

When('Delete file {string} anonymously and save response as {string}', async function (idKey, varName) {
  this.save(varName, await files.delete(this.str(idKey), auth.none()));
});

// ─── Byte-level assertions ────────────────────────────────────────────────

Then('Assert response {string} body equals sample {string}', function (varName, name) {
  const expected = sample(name).content;
  const actual = this.res(varName).raw;
  if (!actual.equals(expected)) throw new Error(`Downloaded ${actual.length} bytes differ from sample '${name}' (${expected.length} bytes)`);
});

Then('Assert field {string} equals the size of sample {string} in response {string}', function (field, name, varName) {
  const expected = sample(name).content.length;
  const actual = this.body(varName)?.[field];
  if (actual !== expected) throw new Error(`'${field}' = ${actual}, expected ${expected} (size of sample '${name}')`);
});
