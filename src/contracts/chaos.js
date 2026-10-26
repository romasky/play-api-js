/**
 * /chaos/* contracts. Flaky endpoints return their OWN body on every status (even 4xx/5xx from the roll), so the
 * 2xx contract covers only the success half — the failure half is asserted field by field.
 */
const { str, int, num, bool, any, object, arr, nullable, obj, entry } = require('./schema');

const CacheResponse = obj({ etag: str });

const DelayResponse = obj({ delayed_seconds: num, clamped: bool });

const EchoResponse = obj({
  method: str, path: str, headers: object, query: object,
  body: any, // parsed JSON, or null — but always present
  raw_body: nullable(str), truncated: bool, client_ip: str, request_id: str,
});

const FlakyResponse = obj({ ok: bool, failed: bool, deterministic: bool, seed: nullable(str), roll: num });

const FLAKY_STEP = { index: int, roll: num, status: int, failed: bool };

const FlakySequenceResponse = obj({
  seed: str, count: int, fail_rate: num, fail_status: int, steps: arr(obj(FLAKY_STEP)),
  first_success_index: int, fails_total: int,
});

const FlakyStepResponse = obj({ ...FLAKY_STEP, seed: str });

const GzipResponse = obj({ gzipped: bool, origin: str, method: str });

const RedirectDoneResponse = obj({ redirected: bool, method: str, body_length: int, body_sha256: str, message: str });

const StatusResponse = obj({ status_code: int, message: str });

const CONTRACTS_2XX = [
  entry('GET',  '/chaos/cache',            'CacheResponse',         CacheResponse),
  entry('GET',  '/chaos/delay/[^/]+',      'DelayResponse',         DelayResponse),
  entry('GET',  '/chaos/echo',             'EchoResponse',          EchoResponse),
  entry('POST', '/chaos/echo',             'EchoResponse',          EchoResponse),
  entry('GET',  '/chaos/flaky',            'FlakyResponse',         FlakyResponse),
  entry('GET',  '/chaos/flaky/sequence',   'FlakySequenceResponse', FlakySequenceResponse),
  entry('GET',  '/chaos/flaky/step/[^/]+', 'FlakyStepResponse',     FlakyStepResponse),
  entry('GET',  '/chaos/gzip',             'GzipResponse',          GzipResponse),
  entry('GET',  '/chaos/redirect/done',    'RedirectDoneResponse',  RedirectDoneResponse),
  entry('POST', '/chaos/redirect/done',    'RedirectDoneResponse',  RedirectDoneResponse),
  entry('GET',  '/chaos/status/[^/]+',     'StatusResponse',        StatusResponse),
];

module.exports = { CONTRACTS_2XX };
