const { When } = require('@cucumber/cucumber');
const ctx    = require('../context/scenarioContext');
const client = require('../api/restClient');
const paths  = require('../api/apiPaths');

// GET /auth/basic — HTTP Basic practice endpoint (non-standard error shape: { error, message })

When('Send GET basic auth request with no auth header and save as {string}', async (varName) => {
  ctx.save(varName, await client.get(paths.AUTH_BASIC));
});

When('Send GET basic auth request with credentials {string} and save as {string}', async (userPass, varName) => {
  const encoded = Buffer.from(userPass).toString('base64');
  ctx.save(varName, await client.get(paths.AUTH_BASIC, {}, { Authorization: `Basic ${encoded}` }));
});

When('Send GET basic auth request with raw auth header {string} and save as {string}', async (header, varName) => {
  ctx.save(varName, await client.get(paths.AUTH_BASIC, {}, { Authorization: header }));
});
