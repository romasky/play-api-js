const { When, Then } = require('@cucumber/cucumber');
const ctx    = require('../context/scenarioContext');
const client = require('../api/restClient');
const paths  = require('../api/apiPaths');

When('Send OPTIONS users request and save response as {string}', async (varName) => {
  const res = await client.options(paths.USERS_OPTIONS);
  ctx.save(varName, res);
});

Then('Assert options response has allowed_methods in {string}', (varName) => {
  const body = ctx.get(varName, true).data;
  if (!Array.isArray(body?.allowed_methods)) {
    throw new Error(`Missing 'allowed_methods' array in OPTIONS response. Body: ${JSON.stringify(body)}`);
  }
});

Then('Assert options response has endpoints in {string}', (varName) => {
  const body = ctx.get(varName, true).data;
  if (!body?.endpoints || typeof body.endpoints !== 'object') {
    throw new Error(`Missing 'endpoints' object in OPTIONS response. Body: ${JSON.stringify(body)}`);
  }
});

Then('Assert Allow header contains {string} in {string}', (method, varName) => {
  const allow = ctx.get(varName, true).headers?.allow || '';
  if (!allow.includes(method)) {
    throw new Error(`Allow header '${allow}' does not contain '${method}'`);
  }
});
