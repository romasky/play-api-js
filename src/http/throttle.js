/**
 * Rate-limit pacing — the server runs a per-IP token bucket per endpoint; we PACE, never retry.
 *
 * None of the API's 429 responses carries `Retry-After` / `X-RateLimit-*`, so the intervals come from the
 * server's limiter configuration (refill period of each bucket + a small margin). `client.request()` calls
 * `throttle()` before every request: if the previous call to the same bucket was less than one refill period
 * ago, it sleeps the remainder. Consuming no faster than the refill rate can never drain a bucket, whatever
 * state an earlier run left it in — and scenarios that never touch a limited endpoint never wait.
 *
 * Rate limits are per IP and this state is per process: keep cucumber `parallel: 1` and scale through the
 * CI matrix (one runner = one IP = its own buckets).
 */

// [method, path regex under /api/v1, bucket name, minimum ms between two calls]
const BUCKETS = [
  ['POST', /\/users\/create(-admin)?$/,      'create-user',   700],   // 1 per 600 ms, burst 100 (shared)
  ['POST', /\/challenges\/[^/]+\/start$/,    'create-user',   700],   // creates a sandbox user → same bucket
  ['POST', /\/api\/v1\/login$/,              'login',         12500], // 1 per 12 s, burst 5
  ['POST', /\/jwt\/login$/,                  'jwt-login',     12500], // separate bucket from /login; 400s count too
  ['POST', /\/jwt\/decode$/,                 'jwt-decode',    2100],  // 1 per 2 s, burst 10
  ['POST', /\/files\/upload$/,               'file-upload',   6100],  // 10 per minute, burst 5
  ['POST', /\/webhooks\/inbox$/,             'webhook-inbox', 6100],  // 10 per minute, burst 5
  ['POST', /\/store\/login$/,                'store-login',   2100],  // 30 per minute, burst 10
  ['POST', /\/bug-reports$/,                 'bug-report',    2100],  // 30 per minute, burst 10; 400s count too
];

const lastCall = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wait until the bucket of `method path` (if any) may be hit again; record the call. */
async function throttle(method, path) {
  const pathname = path.split('?')[0];
  const bucket = BUCKETS.find(([m, rx]) => m === method && rx.test(pathname));
  if (!bucket) return;
  const [, , name, interval] = bucket;
  const wait = (lastCall.get(name) ?? -Infinity) + interval - Date.now();
  // reserve the slot BEFORE sleeping, so a second caller queues behind this one
  lastCall.set(name, Date.now() + Math.max(wait, 0));
  if (wait > 0) await sleep(wait);
}

module.exports = { throttle, sleep };
