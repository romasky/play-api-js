/**
 * JWT crafting for negative tests — node:crypto only: the server's secret is unknown, so every token built
 * here either has a WRONG signature or is malformed on purpose.
 *
 * `craft(kind, genuine)` derives a broken token from a genuine one (so claims such as `sub` stay real):
 *
 *   wrong secret | tampered payload | alg none | alg HS512 | forged expired  → 401 INVALID_SIGNATURE
 *   one/two/four segments | garbage | padded | bad base64 | non-JSON payload
 *   | oversized (> 8 KiB) | opaque                                            → 401 INVALID_TOKEN_FORMAT
 *                                                                              (400 INVALID_JWT_FORMAT on /decode)
 *   no exp | exp string | empty object                                       → decode-only shapes
 */
const crypto = require('crypto');
const { choose } = require('./lookup');

const WRONG_SECRET = 'not-the-server-secret';

const b64url     = (data) => Buffer.from(data).toString('base64url');
const b64urlJson = (obj) => b64url(JSON.stringify(obj));

/** [header, payload] of a JWT, signature NOT verified. */
function parts(token) {
  const [header, payload] = token.split('.');
  return [JSON.parse(Buffer.from(header, 'base64url')), JSON.parse(Buffer.from(payload, 'base64url'))];
}

/** HMAC with a secret that is NOT the server's — every token built here fails signature checks. */
function sign(header, payload) {
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const digest = header.alg === 'HS512' ? 'sha512' : 'sha256';
  return `${signingInput}.${crypto.createHmac(digest, WRONG_SECRET).update(signingInput).digest('base64url')}`;
}

/** Keep the genuine header + signature, swap the payload → the signature no longer matches. */
function withPayload(token, changes) {
  const [, payload] = parts(token);
  const [head, , signature] = token.split('.');
  return `${head}.${b64urlJson({ ...payload, ...changes })}.${signature}`;
}

/** Re-sign with some claims changed; a claim set to undefined is dropped. */
function claimsOnly(token, changes) {
  const [header, payload] = parts(token);
  return sign(header, JSON.parse(JSON.stringify({ ...payload, ...changes })));
}

const segment = (token, i) => token.split('.')[i];

const KINDS = {
  // wrong signature
  'wrong secret':     (t) => sign(...parts(t)),
  'tampered payload': (t) => withPayload(t, { email: 'attacker@play-qa.com' }),
  'alg none':         (t) => { const [h, p] = parts(t); return `${b64urlJson({ ...h, alg: 'none' })}.${b64urlJson(p)}.`; },
  'alg HS512':        (t) => { const [h, p] = parts(t); return sign({ ...h, alg: 'HS512' }, p); },
  'forged expired':   (t) => { const now = Math.floor(Date.now() / 1000); return claimsOnly(t, { iat: now - 7200, exp: now - 3600 }); },
  // malformed
  'one segment':      (t) => segment(t, 0),
  'two segments':     (t) => `${segment(t, 0)}.${segment(t, 1)}`,
  'four segments':    (t) => `${t}.${segment(t, 2)}`,
  'garbage':          () => 'not-a-jwt-at-all',
  'padded':           (t) => `${t}==`,
  'bad base64':       (t) => `!!!.${t.split('.').slice(1).join('.')}`,
  'non-JSON payload': (t) => `${segment(t, 0)}.${b64url('not json')}.${segment(t, 2)}`,
  'oversized':        (t) => `${segment(t, 0)}.${b64url('x'.repeat(6300))}.${segment(t, 2)}`, // ≈ 8.4 KiB < Cloudflare 520
  'opaque':           () => 'usr_1700000000_0123456789abcdef0123456789abcdef',
  // decode-only shapes
  'no exp':           (t) => claimsOnly(t, { exp: undefined }),
  'exp string':       (t) => claimsOnly(t, { exp: 'tomorrow' }),
  'empty object':     () => 'e30.e30.e30',
};

const craft = (kind, genuine) => choose(KINDS, kind, 'JWT kind')(genuine);

module.exports = { parts, craft };
