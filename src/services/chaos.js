/**
 * /chaos/* — HTTP-semantics playground: conditional requests, delays, echo, seeded flakiness, gzip, redirect
 * chains, arbitrary status codes and a gateway timeout.
 *
 * Timeout-style calls take `readTimeoutMs`: the client then throws RequestTimeout instead of returning, which the
 * steps record as the outcome (client.timed).
 */
const { request } = require('../http/client');
const paths = require('../http/paths');

module.exports = {
  cache:        (headers = {}, method = 'GET')       => request(method, paths.CHAOS_CACHE, { headers }),
  delay:        (seconds, readTimeoutMs)              => request('GET', paths.chaosDelay(seconds), { timeout: readTimeoutMs }),
  timeout:      (params, readTimeoutMs)               => request('GET', paths.CHAOS_TIMEOUT, { params, timeout: readTimeoutMs }),
  echo:         (method, { params, headers, content, contentType } = {}) =>
    request(method, paths.CHAOS_ECHO, { params, headers, content, contentType }),
  flaky:        (params)                              => request('GET', paths.CHAOS_FLAKY, { params }),
  flakySequence: (params)                             => request('GET', paths.CHAOS_FLAKY_SEQUENCE, { params }),
  flakyStep:    (index, params)                       => request('GET', paths.chaosFlakyStep(index), { params }),
  gzip:         (headers, { decompress = true } = {}) => request('GET', paths.CHAOS_GZIP, { headers, decompress }),
  redirect:     (method, hops, { params, content, follow = false } = {}) =>
    request(method, paths.chaosRedirect(hops), { params, content, contentType: 'text/plain', follow }),
  // the chain's final destination, called directly (no redirect involved)
  redirectDone: (method, content)                     => request(method, paths.chaosRedirect('done'), { content, contentType: 'text/plain' }),
  status:       (code)                                => request('GET', paths.chaosStatus(code)),
};
