/**
 * Run-wide shared credentials, so rate-limited logins happen once per run (per process).
 *
 * `/jwt/login` allows 5 calls per minute and every call counts, so scenarios that only NEED a token pair
 * (me / refresh / decode) share one. Safe because the refresh token is reusable and access tokens live
 * 15 minutes; the session is rebuilt after 10 minutes. It also carries an access token minted with a
 * 1-second TTL — expired forever after the first 2 seconds, so all TOKEN_EXPIRED cases share it.
 */
const users = require('../services/users');
const jwt = require('../services/jwt');
const { minimalUser } = require('../builders/users');
const { sleep } = require('../http/throttle');
const { show } = require('../http/attach');

const MAX_AGE_MS = 10 * 60 * 1000; // well inside the 900 s access-token lifetime

let session = null;

function ok(res, what) {
  if (res.status !== 200 && res.status !== 201) throw new Error(`shared JWT session: ${what} failed ${res.status}: ${show(res.data)}`);
  return res.data;
}

async function sharedJwtSession() {
  if (session && Date.now() - session.created < MAX_AGE_MS) return session;
  const { email, password, body } = minimalUser();
  const created = ok(await users.create(body), 'create user');
  const pair = ok(await jwt.login({ email, password }), 'JWT login');
  const short = ok(await jwt.login({ email, password, access_ttl_seconds: 1 }), 'ttl login');
  await sleep(2000); // let the 1-second token expire
  session = {
    jwtUserId:        created.id,
    jwtEmail:         email,
    jwtOpaqueToken:   created.access_token,
    jwtAccess:        pair.access_token,
    jwtRefresh:       pair.refresh_token,
    jwtExpiredAccess: short.access_token,
    created:          Date.now(),
  };
  return session;
}

module.exports = { sharedJwtSession };
