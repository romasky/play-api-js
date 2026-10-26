const axios = require('axios');
const { step } = require('allure-js-commons');
const config = require('../config/config');
const contracts = require('../contracts');
const { throttle } = require('./throttle');
const { scrub, attach, attachJson } = require('./attach');

/**
 * HTTP transport — the ONE choke point every service goes through.
 *
 * - One nested Allure step per call (`METHOD /path`), with path / params / headers / status as step
 *   parameters and the request + response bodies attached (scrubbed, see attach.js).
 * - Never throws on 4xx/5xx; steps assert the status. Redirects are NOT followed unless `follow: true`.
 * - `Accept-Encoding: identity` by default: with gzip, Cloudflare answers 5xx with an HTML page instead of
 *   plain text. Pass the header explicitly to test compression.
 * - Bodies: `json` (any JSON value, or a RawJson sent verbatim), `content` (raw text or bytes, sent as is;
 *   set `contentType`, default application/json) or `form` (a FormData — multipart).
 * - The response body is read as bytes (`res.raw`); `res.data` is the parsed JSON, the text, or '' when empty.
 * - Every 2xx JSON body is validated against its registered contract. A violation throws ContractError,
 *   which carries the response — so a create step can still register its cleanup (support/cleanup.js).
 * - `timeout` (ms) is a hard wall-clock deadline. A timeout is recorded inside the step (which stays green)
 *   and re-thrown after it: timeout scenarios catch it (see `timed()`).
 */
const http = axios.create({
  baseURL: config.baseUrl,
  validateStatus: () => true,
  responseType: 'arraybuffer',
  transformResponse: [(data) => data],
  paramsSerializer: { indexes: null }, // { filter: ['a', 'b'] } → filter=a&filter=b (repeated key, no [])
  headers: { 'Accept-Encoding': 'identity' },
});

/** A `json` value sent VERBATIM as application/json — deliberately malformed (truncated) payloads, or `null`. */
class RawJson {
  constructor(text) {
    this.text = text;
  }
}

/** A `… with raw body "{…}"` step argument: parsed JSON, or RawJson when it is not valid JSON (or is null). */
function rawBody(text) {
  try {
    const value = JSON.parse(text);
    return value === null ? new RawJson(text) : value;
  } catch {
    return new RawJson(text);
  }
}

class RequestTimeout extends Error {
  constructor(method, path, ms) {
    super(`${method} ${path} timed out after ${ms} ms`);
    this.name = 'RequestTimeout';
  }
}

function parseBody(res) {
  const raw = Buffer.from(res.data ?? []);
  res.raw = raw;
  if (raw.length === 0) return '';
  const type = String(res.headers['content-type'] ?? '');
  const text = raw.toString('utf8');
  if (type.includes('json') || /^\s*[[{]/.test(text)) {
    try { return JSON.parse(text); } catch { /* not JSON after all: keep the text */ }
  }
  return text;
}

const isJson = (value) => value !== null && typeof value === 'object';

async function attachRequest(s, { params, headers, json, content, form }) {
  if (params && Object.keys(params).length > 0) s.parameter('params', scrub(new URLSearchParams(params).toString()));
  if (headers && Object.keys(headers).length > 0) s.parameter('headers', scrub(JSON.stringify(headers)));
  if (json !== undefined) await attachJson('Request Body', json);
  if (typeof content === 'string') await attach('Request Body', content);
  else if (content != null) await attach('Request Body', `<${content.length} bytes>`);
  if (form) {
    const parts = [...form.entries()].map(([name, v]) =>
      (typeof v === 'string' ? { field: name, value: v } : { field: name, filename: v.name, bytes: v.size, type: v.type }));
    await attachJson('Multipart Body', parts);
  }
}

async function attachResponse(res) {
  if (res.raw.length === 0) return;
  if (isJson(res.data)) await attachJson('Response Body', res.data);
  else if (/^(text\/|application\/(x-)?yaml)/.test(String(res.headers['content-type'] ?? ''))) await attach('Response Body', res.data);
  else await attach('Response Body', `<${res.raw.length} bytes, ${res.headers['content-type']}>`);
}

async function request(method, path, opts = {}) {
  const { contentType = 'application/json', form, params, follow = false, timeout } = opts;
  const verbatim = opts.json instanceof RawJson;
  const json = verbatim ? undefined : opts.json;
  const content = verbatim ? opts.json.text : opts.content;
  const headers = { ...(content != null && { 'Content-Type': contentType }), ...opts.headers };
  const deadline = timeout ?? config.requestTimeout;

  let timedOut = false;
  const res = await step(`${method} ${path.split('?')[0]}`, async (s) => {
    s.parameter('path', path);
    await attachRequest(s, { params, headers: opts.headers, json, content, form });
    await throttle(method, path);
    const started = Date.now();
    let response;
    try {
      response = await http.request({
        method, url: path, params, headers,
        data: form ?? content ?? json,
        maxRedirects: follow ? 20 : 0,
        signal: AbortSignal.timeout(deadline),
      });
    } catch (err) {
      if (err.code !== 'ERR_CANCELED' && err.code !== 'ECONNABORTED') throw err;
      timedOut = true;
      s.parameter('status', 'timeout');
      await attach('Timeout', `no response within the ${deadline} ms client timeout`);
      return undefined;
    }
    response.elapsedMs = Date.now() - started;
    response.redirects = response.request?._redirectable?._redirectCount ?? 0;
    response.data = parseBody(response);
    s.parameter('status', String(response.status));
    await attachResponse(response);
    if (response.status >= 200 && response.status < 300 && isJson(response.data)) {
      contracts.check(method, path, response, response.data);
    }
    return response;
  });
  if (timedOut) throw new RequestTimeout(method, path, deadline);
  return res;
}

/** Run an HTTP call and keep its OUTCOME — the response or the client timeout — with the wall time. */
async function timed(call) {
  const started = Date.now();
  try {
    return { response: await call(), timedOut: false, ms: Date.now() - started };
  } catch (err) {
    if (!(err instanceof RequestTimeout)) throw err;
    return { response: undefined, timedOut: true, ms: Date.now() - started };
  }
}

module.exports = { request, timed, rawBody, RawJson, RequestTimeout };
