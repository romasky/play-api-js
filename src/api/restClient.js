const axios = require('axios');
const { step, attachment } = require('allure-js-commons');
const config = require('../config/config');

const client = axios.create({
  baseURL: config.baseUrl,
  timeout: config.requestTimeout,
  validateStatus: () => true, // never throw on non-2xx — steps assert the status themselves
});

function bearerHeader(token) {
  if (token == null) throw new Error('bearerHeader: token is null/undefined');
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

/**
 * Single choke point for every HTTP call: one nested Allure step per request,
 * with path / params / headers / body / status as step parameters and the
 * request + response bodies attached. `headers` is passed to axios verbatim,
 * so callers can send a raw `Authorization` value or omit the header entirely.
 *
 * `attachment()` is async in allure-js-commons v3 and MUST be awaited inside the
 * step — otherwise it can land after the step closed and break the next hook
 * ("Cannot attach when a step/hook is not running").
 */
async function request(method, path, { body, params, headers } = {}) {
  return step(`${method} ${path}`, async (ctx) => {
    ctx.parameter('path', path);
    if (params && Object.keys(params).length > 0) ctx.parameter('params', JSON.stringify(params));
    if (headers && Object.keys(headers).length > 0) ctx.parameter('headers', JSON.stringify(headers));
    if (body !== undefined && body !== null) {
      ctx.parameter('body', JSON.stringify(body));
      await attachment('Request Body', JSON.stringify(body, null, 2), 'application/json');
    }

    const response = await client.request({ method, url: path, data: body, params, headers });

    ctx.parameter('status', String(response.status));
    if (response.data) {
      await attachment('Response Body', JSON.stringify(response.data, null, 2), 'application/json');
    }
    return response;
  });
}

const post       = (path, body = null, headers = {}) => request('POST',    path, { body, headers });
const postNoBody = (path, headers = {})              => request('POST',    path, { headers });
const get        = (path, params = {}, headers = {}) => request('GET',     path, { params, headers });
const put        = (path, body, headers = {})        => request('PUT',     path, { body, headers });
const patch      = (path, body, headers = {})        => request('PATCH',   path, { body, headers });
const del        = (path, headers = {})              => request('DELETE',  path, { headers });
const head       = (path, headers = {})              => request('HEAD',    path, { headers });
const options    = (path, headers = {})              => request('OPTIONS', path, { headers });

module.exports = { post, postNoBody, get, put, patch, del, head, options, bearerHeader };
