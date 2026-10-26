const { Given, Then } = require('@cucumber/cucumber');
const gen = require('../../utils/generator');
const { getPath } = require('../../utils/jsonPath');
const { show } = require('../../http/attach');

// ─── Literals and generated test data ─────────────────────────────────────

Given('Save string {string} as {string}', function (value, key) { this.save(key, value); });
Given('Save context value {string} as {string}', function (srcKey, destKey) { this.save(destKey, this.get(srcKey, true)); });

Given('Generate email and save as {string}',                 function (key) { this.save(key, gen.email()); });
Given('Generate username and save as {string}',              function (key) { this.save(key, gen.username()); });
Given('Generate password and save as {string}',              function (key) { this.save(key, gen.password()); });
Given('Generate first name and save as {string}',            function (key) { this.save(key, gen.firstName()); });
Given('Generate last name and save as {string}',             function (key) { this.save(key, gen.lastName()); });
Given('Generate sender email and save as {string}',          function (key) { this.save(key, gen.senderEmail()); });
Given('Generate message subject and save as {string}',       function (key) { this.save(key, gen.messageSubject()); });
Given('Generate message body and save as {string}',          function (key) { this.save(key, gen.messageBody()); });
Given('Generate invalid email and save as {string}',         function (key) { this.save(key, gen.invalidEmail()); });
Given('Generate short password and save as {string}',        function (key) { this.save(key, gen.shortPassword()); });
Given('Generate fake mongo id and save as {string}',         function (key) { this.save(key, gen.fakeMongoId()); });
Given('Generate fake uuid and save as {string}',             function (key) { this.save(key, gen.fakeUuid()); });
Given('Generate phone number and save as {string}',          function (key) { this.save(key, gen.phoneNumber()); });
Given('Generate string of length {int} and save as {string}', function (n, key) { this.save(key, gen.alphanumericString(n)); });
Given('Generate local part and save as {string}',            function (key) { this.save(key, gen.alphanumericString(10).toLowerCase()); });
Given('Generate local part with underscore and hyphen and save as {string}', function (key) { this.save(key, `my_${gen.alphanumericString(6)}-box`); });
Given('Get current date and save as {string}',               function (key) { this.save(key, new Date().toISOString().split('T')[0]); });
// a unique address.country isolates our own users in the shared /users/list collection
Given('Generate unique country and save as {string}',        function (key) { this.save(key, gen.uniqueCountry()); });
Given('Save upper-cased {string} as {string}',               function (srcKey, destKey) { this.save(destKey, this.str(srcKey).toUpperCase()); });

// ─── Values taken from saved responses ────────────────────────────────────

Then('Extract {string} from {string} and save as {string}', function (field, varName, saveAs) {
  const value = getPath(this.body(varName), field);
  if (value === undefined || value === null) {
    throw new Error(`Field '${field}' not found in response. Body: ${show(this.body(varName))}`);
  }
  this.save(saveAs, String(value));
});

Then('Extract header {string} from {string} and save as {string}', function (name, varName, saveAs) {
  const value = this.res(varName).headers[name.toLowerCase()];
  if (value === undefined) throw new Error(`Header '${name}' not found in response '${varName}'`);
  this.save(saveAs, value);
});

// ─── Debug ────────────────────────────────────────────────────────────────

Then('Print response {string}', function (varName) {
  const val = this.get(varName, true);
  if (val?.status) console.log(`\n[${varName}] HTTP ${val.status}\n${show(val.data)}\n`);
  else console.log(`\n[${varName}] = ${val}\n`);
});
