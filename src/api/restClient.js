const { request } = require('../http/client');

/**
 * Transitional shim: the legacy positional helpers over the one HTTP choke point (http/client.js), so the
 * original step files run through the throttle, the contracts and the scrubbed attachments unchanged.
 * Removed once those steps call services.
 */
function bearerHeader(token) {
  if (token == null) throw new Error('bearerHeader: token is null/undefined');
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

const json = (body) => (body === null ? undefined : body);

const post       = (path, body = null, headers = {}) => request('POST',    path, { json: json(body), headers });
const postNoBody = (path, headers = {})              => request('POST',    path, { headers });
const get        = (path, params = {}, headers = {}) => request('GET',     path, { params, headers });
const put        = (path, body, headers = {})        => request('PUT',     path, { json: body, headers });
const patch      = (path, body, headers = {})        => request('PATCH',   path, { json: body, headers });
const del        = (path, headers = {})              => request('DELETE',  path, { headers });
const head       = (path, headers = {})              => request('HEAD',    path, { headers });
const options    = (path, headers = {})              => request('OPTIONS', path, { headers });

module.exports = { post, postNoBody, get, put, patch, del, head, options, bearerHeader };
