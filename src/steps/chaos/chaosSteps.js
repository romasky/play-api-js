/**
 * /chaos/* steps. A client-side timeout is an OUTCOME here, not an error: `timed()` keeps the response — or a
 * `{ timedOut: true }` marker — under the response key, and the wall time under `<key>Seconds`.
 */
const { When, Then } = require('@cucumber/cucumber');
const chaos = require('../../services/chaos');
const { timed } = require('../../http/client');
const { header } = require('../../assertions/headers');
const { getPath } = require('../../utils/jsonPath');
const { show } = require('../../http/attach');

async function saveTimed(world, varName, call) {
  const outcome = await timed(call);
  world.save(varName, outcome.timedOut ? { timedOut: true } : outcome.response);
  world.save(`${varName}Seconds`, outcome.ms / 1000);
}

const query = (text) => new URLSearchParams(text);

// ─── Cache (conditional requests) ─────────────────────────────────────────

When('Get chaos cache and save response as {string}', async function (varName) {
  this.save(varName, await chaos.cache());
});

When('Send {string} chaos cache request and save response as {string}', async function (method, varName) {
  this.save(varName, await chaos.cache({}, method));
});

// ETag values carry quotes ("chaos-v1", W/"chaos-v1"): written as \" in the step, unescaped by {string}
When('Get chaos cache with header {string} value {string} and save response as {string}', async function (name, value, varName) {
  this.save(varName, await chaos.cache({ [name]: value }));
});

When('Get chaos cache with If-None-Match {string} and If-Modified-Since {string} and save response as {string}',
  async function (etag, since, varName) {
    this.save(varName, await chaos.cache({ 'If-None-Match': etag, 'If-Modified-Since': since }));
  });

// ─── Delay / timeout ──────────────────────────────────────────────────────

When('Get chaos delay {string} and save response as {string}', function (seconds, varName) {
  return saveTimed(this, varName, () => chaos.delay(seconds));
});

When('Get chaos delay {string} with a read timeout of {int} second and save response as {string}', function (seconds, limit, varName) {
  return saveTimed(this, varName, () => chaos.delay(seconds, limit * 1000));
});

When('Get chaos timeout with query {string} and save response as {string}', function (text, varName) {
  return saveTimed(this, varName, () => chaos.timeout(query(text)));
});

When('Get chaos timeout with query {string} and a read timeout of {int} second and save response as {string}',
  function (text, limit, varName) {
    return saveTimed(this, varName, () => chaos.timeout(query(text), limit * 1000));
  });

Then('Assert request {string} timed out', function (varName) {
  const outcome = this.get(varName, true);
  if (outcome.timedOut !== true) throw new Error(`Expected a client timeout, got HTTP ${outcome.status}`);
});

Then('Assert request {string} took between {int} and {int} seconds', function (varName, low, high) {
  const seconds = this.get(`${varName}Seconds`, true);
  if (seconds < low || seconds > high) throw new Error(`'${varName}' took ${seconds.toFixed(2)} s, expected ${low}..${high} s`);
});

// ─── Echo ─────────────────────────────────────────────────────────────────

When('Send {string} chaos echo with query {string} and save response as {string}', async function (method, text, varName) {
  this.save(varName, await chaos.echo(method, { params: query(text) }));
});

When('Send GET chaos echo with header {string} value {string} and save response as {string}', async function (name, value, varName) {
  this.save(varName, await chaos.echo('GET', { headers: { [name]: this.str(value) } }));
});

When('Post chaos echo as {string} with body {string} and save response as {string}', async function (contentType, body, varName) {
  this.save('sentBody', body);
  this.save(varName, await chaos.echo('POST', { content: body, contentType }));
});

When('Post chaos echo with the bytes {string} and save response as {string}', async function (hex, varName) {
  this.save(varName, await chaos.echo('POST', { content: Buffer.from(hex, 'hex'), contentType: 'application/octet-stream' }));
});

When('Post chaos echo with a text body of {int} bytes and save response as {string}', async function (size, varName) {
  this.save(varName, await chaos.echo('POST', { content: 'a'.repeat(size), contentType: 'text/plain' }));
});

// ─── Flaky (seeded) ───────────────────────────────────────────────────────

When('Get chaos flaky with query {string} and save response as {string}', async function (text, varName) {
  this.save(varName, await chaos.flaky(query(text)));
});

When('Get chaos flaky sequence with query {string} and save response as {string}', async function (text, varName) {
  this.save(varName, await chaos.flakySequence(query(text)));
});

When('Get chaos flaky step {string} with query {string} and save response as {string}', async function (index, text, varName) {
  this.save(varName, await chaos.flakyStep(index, query(text)));
});

Then('Assert flaky plan statuses are {string} in response {string}', function (statuses, varName) {
  const actual = (getPath(this.body(varName), 'steps') ?? []).map((s) => String(s.status)).join(',');
  if (actual !== statuses) throw new Error(`planned statuses ${actual}, expected ${statuses}`);
});

/** The client-side retry loop a flaky sequence exists for: every attempt must answer its PLANNED status. */
When('Retry chaos flaky steps of plan {string} with query {string} until success and save as {string}', async function (planVar, text, key) {
  const plan = getPath(this.body(planVar), 'steps');
  for (const [number, planned] of plan.entries()) {
    const res = await chaos.flakyStep(String(planned.index), query(text));
    if (res.status !== planned.status) throw new Error(`step ${planned.index} answered ${res.status}, the plan says ${planned.status}`);
    if (res.status === 200) {
      this.save(key, String(number + 1));
      return;
    }
  }
  throw new Error(`no successful step in the plan: ${show(plan)}`);
});

// ─── Gzip ─────────────────────────────────────────────────────────────────

When('Get chaos gzip with Accept-Encoding {string} and save response as {string}', async function (encoding, varName) {
  this.save(varName, await chaos.gzip({ 'Accept-Encoding': encoding }));
});

/** The first two body bytes exactly as sent on the wire (before the client decodes Content-Encoding). */
When('Read the raw chaos gzip body with Accept-Encoding {string} and save its first bytes as {string}', async function (encoding, key) {
  const res = await chaos.gzip({ 'Accept-Encoding': encoding }, { decompress: false });
  if (res.status !== 200) throw new Error(`GET /chaos/gzip answered ${res.status}`);
  this.save(key, res.raw.subarray(0, 2).toString('hex'));
});

// ─── Redirect (status = `type`; 301/302 turn POST into GET, 307/308 keep it) ──

When('Send {string} chaos redirect {string} with query {string} and save response as {string}', async function (method, hops, text, varName) {
  this.save(varName, await chaos.redirect(method, hops, { params: query(text) }));
});

When('Send {string} chaos redirect {string} with query {string} and body {string} following redirects and save response as {string}',
  async function (method, hops, text, body, varName) {
    this.save(varName, await chaos.redirect(method, hops, { params: query(text), content: body || undefined, follow: true }));
  });

When('Send {string} directly to chaos redirect done and save response as {string}', async function (method, varName) {
  this.save(varName, await chaos.redirectDone(method));
});

When('Post directly to chaos redirect done a body of {int} bytes and save response as {string}', async function (size, varName) {
  this.save(varName, await chaos.redirectDone('POST', 'a'.repeat(size)));
});

Then('Assert response {string} followed {int} redirects', function (varName, hops) {
  const { redirects } = this.res(varName);
  if (redirects !== hops) throw new Error(`followed ${redirects} redirects, expected ${hops}`);
});

// ─── Status ───────────────────────────────────────────────────────────────

When('Get chaos status {string} and save response as {string}', async function (code, varName) {
  this.save(varName, await chaos.status(code));
});

Then('Assert response {string} is plain text {string}', function (varName, expected) {
  const res = this.res(varName);
  const type = String(header(res, 'Content-Type') ?? '');
  if (!type.startsWith('text/')) throw new Error(`expected a text body, got Content-Type '${type}'`);
  const text = res.raw.toString('utf8').trim();
  if (text !== expected) throw new Error(`body '${text}', expected '${expected}'`);
});

/**
 * Cloudflare replaces the origin body of 502 / 504 / 52x — plain text, or an HTML page for a client that accepts
 * gzip. Either way it names the status and is NOT the origin's JSON.
 */
Then('Assert response {string} is a Cloudflare error page for status {int}', function (varName, code) {
  const res = this.res(varName);
  const type = String(header(res, 'Content-Type') ?? '');
  if (!type.startsWith('text/')) throw new Error(`expected a Cloudflare text/HTML page, got '${type}'`);
  const text = res.raw.toString('utf8');
  if (!new RegExp(`\\b${code}\\b`).test(text)) throw new Error(`page does not name status ${code}: ${show(text.slice(0, 200))}`);
  if (typeof res.data === 'object' && res.data !== null) throw new Error(`expected Cloudflare's page, got the origin JSON: ${show(res.data)}`);
});
