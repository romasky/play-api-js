/** Authentication contracts — POST /login, GET /auth/basic, /jwt/*, POST /store/login. */
const { str, int, bool, object, nullable, obj, entry } = require('./schema');

const LoginResponse = obj({ success: bool, access_token: str, user_id: str, email: str, username: str, expires_at: str });

// GET /auth/basic 200 (its 401 shape is non-standard: { error, message })
const BasicAuthResponse = obj({ success: bool, message: str, user: str });

const JwtLoginResponse = obj({
  success: bool, token_type: str, access_token: str, refresh_token: str,
  access_expires_in: int, refresh_expires_in: int, user_id: str, email: str,
});

const JwtRefreshResponse = obj({ success: bool, token_type: str, access_token: str, access_expires_in: int });

const JwtMeResponse = obj({ success: bool, sub: str, email: str, claims: object });

// the nullable keys are ALWAYS present (null, never missing) — so they are required
const JwtDecodeResponse = obj({
  success: bool, header: object, payload: object,
  signature_valid: nullable(bool), expired: nullable(bool), expires_at: nullable(str), issued_at: nullable(str),
});

const StoreLoginResponse = obj({
  success: bool, persona: str, session: str, message: str,
  behavior: obj({ login_latency_ms: int, catalog_latency_ms: int, visual_bugs: bool, flaky_add_to_cart: bool }),
});

const CONTRACTS_2XX = [
  entry('POST', '/login',       'LoginResponse',      LoginResponse),
  entry('GET',  '/auth/basic',  'BasicAuthResponse',  BasicAuthResponse),
  entry('POST', '/jwt/login',   'JwtLoginResponse',   JwtLoginResponse),
  entry('POST', '/jwt/refresh', 'JwtRefreshResponse', JwtRefreshResponse),
  entry('GET',  '/jwt/me',      'JwtMeResponse',      JwtMeResponse),
  entry('POST', '/jwt/decode',  'JwtDecodeResponse',  JwtDecodeResponse),
  entry('POST', '/store/login', 'StoreLoginResponse', StoreLoginResponse),
];

module.exports = { CONTRACTS_2XX, LoginResponse };
