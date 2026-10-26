const { When } = require('@cucumber/cucumber');
const system = require('../../services/system');

When('Send GET health request and save as {string}', async function (varName) {
  this.save(varName, await system.health());
});

When('Send GET health request with X-Request-ID {string} and save as {string}', async function (requestIdKey, varName) {
  this.save(varName, await system.health({ 'X-Request-ID': this.str(requestIdKey) }));
});
