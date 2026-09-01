const { When } = require('@cucumber/cucumber');
const ctx    = require('../context/scenarioContext');
const client = require('../api/restClient');
const paths  = require('../api/apiPaths');

When('Send GET health request and save as {string}', async (varName) => {
  ctx.save(varName, await client.get(paths.HEALTH));
});

When('Send GET health request with X-Request-ID {string} and save as {string}', async (requestIdKey, varName) => {
  ctx.save(varName, await client.get(paths.HEALTH, {}, { 'X-Request-ID': ctx.str(requestIdKey) }));
});
