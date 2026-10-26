/** /jwt/* — the second auth scheme: HS256 access + refresh pair, and a public token inspector. */
const { request } = require('../http/client');
const paths = require('../http/paths');

// The JWT endpoints cap request bodies at 16 KiB (→ 413 PAYLOAD_TOO_LARGE)
const BODY_LIMIT = 16 * 1024;

module.exports = {
  BODY_LIMIT,
  login:   (body)               => request('POST', paths.JWT_LOGIN, { json: body }),
  me:      (headers)            => request('GET',  paths.JWT_ME, { headers }),
  // the refresh token travels in the BODY; an Authorization header is ignored
  refresh: (body, headers = {}) => request('POST', paths.JWT_REFRESH, { json: body, headers }),
  decode:  (body)               => request('POST', paths.JWT_DECODE, { json: body }),
};
