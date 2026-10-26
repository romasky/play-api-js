/**
 * Authorization header builders — the heart of the negative coverage. The BearerAuth middleware checks:
 *
 *   bearer(token) → "Bearer <token>"   unknown / revoked → 401 INVALID_TOKEN, another user's → 403 FORBIDDEN
 *   raw(value)    → verbatim value     malformed         → 401 INVALID_TOKEN_FORMAT
 *   none()        → no header          missing           → 401 MISSING_TOKEN
 *
 * axios (like RFC 7230 servers) trims surrounding whitespace, so raw "Bearer " and "Bearer" are the same
 * request on the wire.
 */
function bearer(token) {
  if (token == null) throw new Error('auth.bearer: token is null/undefined');
  return { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` };
}

const raw   = (value) => ({ Authorization: value });
const none  = () => ({});
const basic = (userPass) => ({ Authorization: `Basic ${Buffer.from(userPass).toString('base64')}` });

module.exports = { bearer, raw, none, basic };
