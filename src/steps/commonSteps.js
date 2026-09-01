const { Before, Given, When, Then } = require('@cucumber/cucumber');
const ctx = require('../context/scenarioContext');
const gen = require('../utils/generator');
const { getPath, hasPath } = require('../utils/jsonPath');
const errorResponse = require('../models/errorResponse');

Before(function (scenario) {
  ctx.setScenario(scenario);
});

const responseOf = (varName) => ctx.get(varName, true);
const bodyOf     = (varName) => responseOf(varName).data;

// Data generation
Given('Save string {string} as {string}',                    (value, key) => ctx.save(key, value));
Given('Save context value {string} as {string}',             (srcKey, destKey) => ctx.save(destKey, ctx.get(srcKey, true)));
Given('Generate email and save as {string}',                 (key) => ctx.save(key, gen.email()));
Given('Generate username and save as {string}',              (key) => ctx.save(key, gen.username()));
Given('Generate password and save as {string}',              (key) => ctx.save(key, gen.password()));
Given('Generate first name and save as {string}',            (key) => ctx.save(key, gen.firstName()));
Given('Generate last name and save as {string}',             (key) => ctx.save(key, gen.lastName()));
Given('Generate sender email and save as {string}',          (key) => ctx.save(key, gen.senderEmail()));
Given('Generate message subject and save as {string}',       (key) => ctx.save(key, gen.messageSubject()));
Given('Generate message body and save as {string}',          (key) => ctx.save(key, gen.messageBody()));
Given('Generate invalid email and save as {string}',         (key) => ctx.save(key, gen.invalidEmail()));
Given('Generate short password and save as {string}',        (key) => ctx.save(key, gen.shortPassword()));
Given('Generate fake mongo id and save as {string}',         (key) => ctx.save(key, gen.fakeMongoId()));
Given('Generate fake uuid and save as {string}',             (key) => ctx.save(key, gen.fakeUuid()));
Given('Generate phone number and save as {string}',          (key) => ctx.save(key, gen.phoneNumber()));
Given('Generate string of length {int} and save as {string}',(n, key) => ctx.save(key, gen.alphanumericString(n)));
Given('Generate local part and save as {string}',            (key) => ctx.save(key, gen.alphanumericString(10).toLowerCase()));
Given('Generate local part with underscore and hyphen and save as {string}', (key) => ctx.save(key, 'my_' + gen.alphanumericString(6) + '-box'));
Given('Get current date and save as {string}',               (key) => ctx.save(key, new Date().toISOString().split('T')[0]));

// Extract a (dotted-path) field from a saved response into the context
Then('Extract {string} from {string} and save as {string}', (field, varName, saveAs) => {
  const value = getPath(bodyOf(varName), field);
  if (value === undefined || value === null) {
    throw new Error(`Field '${field}' not found in response. Body: ${JSON.stringify(bodyOf(varName))}`);
  }
  ctx.save(saveAs, String(value));
});

// Status code
When('Get and check status code {int} from {string}', (code, varName) => ctx.assertStatusCode(code, varName));
Then('Assert response is not a server error in {string}', (varName) => {
  const res = responseOf(varName);
  if (res.status >= 500) throw new Error(`Expected non-5xx status but got ${res.status}. Body: ${JSON.stringify(res.data)}`);
});
Then('Assert status code is one of {string} in {string}', (codes, varName) => {
  const allowed = codes.split(',').map((c) => parseInt(c.trim(), 10));
  const res = responseOf(varName);
  if (!allowed.includes(res.status)) {
    throw new Error(`Expected status in [${codes}] but got ${res.status}. Body: ${JSON.stringify(res.data)}`);
  }
});

// Header assertions
Then('Assert response header {string} equals {string} in {string}', (header, expected, varName) => {
  const actual = responseOf(varName).headers[header.toLowerCase()];
  const resolved = ctx.str(expected);
  if (actual !== resolved) throw new Error(`Header '${header}': expected '${resolved}' but got '${actual}'`);
});
Then('Assert response header {string} contains {string} in {string}', (header, expected, varName) => {
  const actual = responseOf(varName).headers[header.toLowerCase()];
  if (!actual?.includes(expected)) throw new Error(`Header '${header}' '${actual}' does not contain '${expected}'`);
});
Then('Assert response header {string} is present in {string}', (header, varName) => {
  const actual = responseOf(varName).headers[header.toLowerCase()];
  if (!actual) throw new Error(`Header '${header}' is missing`);
});

// Typed body-field assertions (dotted paths, own-property semantics)
Then('Assert field {string} equals {string} in response {string}', (field, expected, varName) => {
  const actual   = getPath(bodyOf(varName), field);
  const resolved = ctx.str(expected);
  if (String(actual) !== resolved) throw new Error(`Field '${field}': expected '${resolved}' but got '${actual}'`);
});
Then('Assert field {string} is not null in response {string}', (field, varName) => {
  const actual = getPath(bodyOf(varName), field);
  if (actual === undefined || actual === null) {
    throw new Error(`Field '${field}' is null/undefined. Body: ${JSON.stringify(bodyOf(varName))}`);
  }
});
Then('Assert field {string} contains {string} in response {string}', (field, expected, varName) => {
  const actual   = getPath(bodyOf(varName), field);
  const resolved = ctx.str(expected);
  if (typeof actual !== 'string' || !actual.includes(resolved)) {
    throw new Error(`Field '${field}' = '${actual}' does not contain '${resolved}'`);
  }
});
Then('Assert field {string} is present in response {string}', (field, varName) => {
  if (!hasPath(bodyOf(varName), field)) {
    throw new Error(`Field '${field}' is missing. Body: ${JSON.stringify(bodyOf(varName))}`);
  }
});
Then('Assert field {string} is absent in response {string}', (field, varName) => {
  if (hasPath(bodyOf(varName), field)) {
    throw new Error(`Field '${field}' should NOT be present. Body: ${JSON.stringify(bodyOf(varName))}`);
  }
});
Then('Assert response body is empty in {string}', (varName) => {
  const data = bodyOf(varName);
  if (data !== undefined && data !== null && data !== '') {
    throw new Error(`Expected empty body but got: ${JSON.stringify(data)}`);
  }
});
Then('Assert response has request_id in {string}', (varName) => errorResponse.assertHasRequestId(responseOf(varName)));

// Context value assertions
Then('Assert {string} not null',          (key) => { if (!ctx.get(key, true)) throw new Error(`${key} is null`); });
Then('Assert {string} equals {string}',   (key, expected) => {
  const actual = ctx.str(key);
  const resolved = ctx.str(expected);
  if (actual !== resolved) throw new Error(`${key}: '${actual}' !== '${resolved}'`);
});
Then('Assert {string} contains {string}', (key, expected) => {
  if (!ctx.str(key).includes(expected)) throw new Error(`'${ctx.str(key)}' does not contain '${expected}'`);
});
Then('Assert {string} matches regex {string}', (key, regex) => {
  const value = ctx.str(key);
  if (!new RegExp(regex).test(value)) throw new Error(`'${value}' does not match regex '${regex}'`);
});

// Debug
Then('Print response {string}', (varName) => {
  const val = ctx.get(varName, true);
  if (val?.status) console.log(`\n[${varName}] HTTP ${val.status}\n${JSON.stringify(val.data, null, 2)}\n`);
  else console.log(`\n[${varName}] = ${val}\n`);
});
