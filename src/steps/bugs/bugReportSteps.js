/**
 * /bug-reports steps — bodies come from builders/bugs.js (`perfectBugReport` and named variants).
 *
 * "anonymously": a report without a header is a valid, unsaved anonymous submission (200), not an auth failure.
 */
const { When, Then } = require('@cucumber/cucumber');
const bugs = require('../../services/bugs');
const auth = require('../../support/auth');
const { rawBody } = require('../../http/client');
const { perfectBugReport, bugReport } = require('../../builders/bugs');
const { assertContract } = require('../../contracts');
const { show } = require('../../http/attach');

When('Submit a perfect {string} bug report anonymously and save response as {string}', async function (bugId, varName) {
  this.save(varName, await bugs.submitReport(perfectBugReport(bugId), auth.none()));
});

When('Submit a perfect {string} bug report with token {string} and save response as {string}', async function (bugId, tokenKey, varName) {
  this.save(varName, await bugs.submitReport(perfectBugReport(bugId), this.bearer(tokenKey)));
});

When('Submit a {string} bug report with severity {string} anonymously and save response as {string}', async function (bugId, severity, varName) {
  this.save(varName, await bugs.submitReport(perfectBugReport(bugId, severity), auth.none()));
});

When('Submit a {string} bug report anonymously and save response as {string}', async function (variant, varName) {
  this.save(varName, await bugs.submitReport(bugReport(variant), auth.none()));
});

When('Submit a perfect {string} bug report with raw auth header {string} and save response as {string}', async function (bugId, header, varName) {
  this.save(varName, await bugs.submitReport(perfectBugReport(bugId), this.rawAuth(header)));
});

When('Submit a bug report with raw body {string} anonymously and save response as {string}', async function (rawJson, varName) {
  this.save(varName, await bugs.submitReport(rawBody(this.render(rawJson)), auth.none()));
});

When('List my bug reports with token {string} and save response as {string}', async function (tokenKey, varName) {
  this.save(varName, await bugs.listReports(this.bearer(tokenKey)));
});

When('List my bug reports with query {string} and token {string} and save response as {string}', async function (query, tokenKey, varName) {
  this.save(varName, await bugs.listReports(this.bearer(tokenKey), this.query(query)));
});

When('List my bug reports with no auth token and save response as {string}', async function (varName) {
  this.save(varName, await bugs.listReports(auth.none()));
});

When('Get bug report {string} with token {string} and save response as {string}', async function (idKey, tokenKey, varName) {
  this.save(varName, await bugs.getReport(this.str(idKey), this.bearer(tokenKey)));
});

When('Get bug report {string} with no auth token and save response as {string}', async function (idKey, varName) {
  this.save(varName, await bugs.getReport(this.str(idKey), auth.none()));
});

// ─── Score (/100: has_steps 25, steps_reproducible 20, expected_actual 25, severity_reasonable 15, title_quality 15) ──

function feedback(body) {
  assertContract('BugReportSubmitted', body);
  return body.score.feedback;
}

Then('Assert score criterion {string} is {string} in response {string}', function (criterion, ok, varName) {
  const item = feedback(this.body(varName)).find((f) => f.criterion === criterion);
  if (!item) throw new Error(`no feedback for criterion '${criterion}'. Body: ${show(this.body(varName))}`);
  if (item.ok !== (ok === 'true')) throw new Error(`criterion '${criterion}' ok=${item.ok}, expected ${ok}: ${show(item)}`);
});

/** All five criteria share the verdict; a failed one explains itself with `params`, a passed one has none. */
Then('Assert every score criterion is {string} in response {string}', function (ok, varName) {
  const expected = ok === 'true';
  const items = feedback(this.body(varName));
  if (items.length !== 5) throw new Error(`expected 5 feedback items, got ${items.length}`);
  const wrong = items.filter((f) => f.ok !== expected).map((f) => f.criterion);
  if (wrong.length > 0) throw new Error(`criteria not ok=${ok}: ${wrong}`);
  const leaky = items.filter((f) => (f.params !== undefined) === expected).map((f) => f.criterion);
  if (leaky.length > 0) throw new Error(`criteria with unexpected params presence: ${leaky}`);
});
