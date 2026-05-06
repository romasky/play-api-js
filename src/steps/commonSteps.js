const { Before, Given, When, Then } = require('@cucumber/cucumber');
const ctx = require('../context/scenarioContext');
const gen = require('../utils/generator');

Before(function (scenario) {
  ctx.setScenario(scenario);
});

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
Given('Get current date and save as {string}',               (key) => ctx.save(key, new Date().toISOString().split('T')[0]));

// Status code
When('Get and check status code {int} from {string}', (code, varName) => ctx.assertStatusCode(code, varName));

// Header assertions
Then('Assert response header {string} equals {string} in {string}', (header, expected, varName) => {
  const actual = ctx.get(varName, true).headers[header.toLowerCase()];
  if (actual !== expected) throw new Error(`Header '${header}': expected '${expected}' but got '${actual}'`);
});
Then('Assert response header {string} contains {string} in {string}', (header, expected, varName) => {
  const actual = ctx.get(varName, true).headers[header.toLowerCase()];
  if (!actual?.includes(expected)) throw new Error(`Header '${header}' '${actual}' does not contain '${expected}'`);
});
Then('Assert response header {string} is present in {string}', (header, varName) => {
  const actual = ctx.get(varName, true).headers[header.toLowerCase()];
  if (!actual) throw new Error(`Header '${header}' is missing`);
});

// Body assertions
Then('Assert response body contains {string} in {string}', (expected, varName) => {
  const resolved = ctx.str(expected);
  const body = JSON.stringify(ctx.get(varName, true).data);
  if (!body.includes(resolved)) throw new Error(`Body does not contain '${resolved}'. Body: ${body}`);
});
Then('Assert response body does not contain {string} in {string}', (unexpected, varName) => {
  const body = JSON.stringify(ctx.get(varName, true).data);
  if (body.includes(unexpected)) throw new Error(`Body should NOT contain '${unexpected}'. Body: ${body}`);
});

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
