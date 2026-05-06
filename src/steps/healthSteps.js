const { When, Then } = require('@cucumber/cucumber');
const ctx    = require('../context/scenarioContext');
const client = require('../api/restClient');
const paths  = require('../api/apiPaths');

When('Send GET health request and save as {string}', async (varName) => {
  const res = await client.get(paths.HEALTH);
  ctx.save(varName, res);
});

Then('Assert health response has status field in {string}', (varName) => {
  const body = ctx.get(varName, true).data;
  if (!body.status) throw new Error(`Missing 'status' field in health response. Body: ${JSON.stringify(body)}`);
});

Then('Assert health response has time field in {string}', (varName) => {
  const body = ctx.get(varName, true).data;
  if (!body.time) throw new Error(`Missing 'time' field in health response. Body: ${JSON.stringify(body)}`);
});
