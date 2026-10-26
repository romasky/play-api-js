/** Streaming steps — Server-Sent Events and the WebSocket echo (all transport in services/realtime.js). */
const { When, Then } = require('@cucumber/cucumber');
const realtime = require('../../services/realtime');
const { show } = require('../../http/attach');

// ─── Server-Sent Events ───────────────────────────────────────────────────

When('Stream SSE progress with query {string} and save the events as {string}', async function (query, key) {
  this.save(key, await realtime.sseProgress(new URLSearchParams(this.render(query))));
});

When('Request SSE progress with query {string} and save response as {string}', async function (query, varName) {
  this.save(varName, await realtime.sseProgressResponse(new URLSearchParams(this.render(query))));
});

/** `count` progress events, steps 1..count, each with total == count, the last at 100 %. */
Then('Assert SSE {string} has {int} progress events counting up to 100 percent', function (key, count) {
  const progress = this.get(key, true).filter((e) => e.event === 'progress').map((e) => e.data);
  const steps = progress.map((p) => p.step).join(',');
  const expected = Array.from({ length: count }, (_, i) => i + 1).join(',');
  if (steps !== expected) throw new Error(`progress steps: ${show(progress)}`);
  if (!progress.every((p) => p.total === count)) throw new Error(`progress totals: ${show(progress)}`);
  if (progress.at(-1).percent !== 100) throw new Error(`last progress event: ${show(progress.at(-1))}`);
});

Then('Assert SSE {string} ends with a done event with status {string} and total {int}', function (key, status, total) {
  const last = this.get(key, true).at(-1);
  if (last?.event !== 'done' || last.data.status !== status || last.data.total !== total || Object.keys(last.data).length !== 2) {
    throw new Error(`last event: ${show(last)}`);
  }
});

// ─── WebSocket ────────────────────────────────────────────────────────────

When('Open the WebSocket echo and save the welcome as {string}', async function (key) {
  const session = await realtime.wsConnect();
  this.defer(() => session.close());
  this.save('websocket', session);
  this.save(key, await session.receiveJson());
});

When('Send the text {string} over the WebSocket and save the reply as {string}', async function (text, key) {
  this.save(key, await this.get('websocket', true).echo(text));
});

When('Send the bytes {string} over the WebSocket and save the reply as {string}', async function (hex, key) {
  const reply = await this.get('websocket', true).echo(Buffer.from(hex, 'hex'));
  if (typeof reply === 'string') throw new Error(`binary frame expected, got text '${reply}'`);
  this.save(key, reply.toString('hex'));
});

Then('Assert WebSocket welcome {string} field {string} equals {string}', function (key, field, expected) {
  const actual = String(this.get(key, true)[field]).toLowerCase();
  if (actual !== expected) throw new Error(`welcome '${field}' = '${actual}', expected '${expected}'`);
});

Then('Assert WebSocket welcome {string} field {string} starts with {string}', function (key, field, prefix) {
  const actual = String(this.get(key, true)[field]);
  if (!actual.startsWith(prefix)) throw new Error(`welcome '${field}' = '${actual}', expected prefix '${prefix}'`);
});

When('Send a plain GET to the WebSocket echo and save response as {string}', async function (varName) {
  this.save(varName, await realtime.wsPlainGet());
});
