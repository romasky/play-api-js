/**
 * `X-PlayQA-Signature: t=<unix>,v1=<hex hmac_sha256(secret, "<t>.<raw body>")>` — Stripe-style.
 *
 * The server accepts a timestamp within ±300 s (undocumented; verified live: ±240 s valid, ±310 s invalid).
 */
const crypto = require('crypto');
const { choose } = require('./lookup');

// the payload the signature scenarios send (signed over these exact bytes)
const SIGNED_BODY = '{"event":"signed"}';

function signature(secret, body, timestamp) {
  return `t=${timestamp},v1=${crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

/** valid | wrong hmac | stale timestamp | future timestamp | garbage | empty | none */
function headerFor(kind, secret, body) {
  if (kind === 'none') return {};
  const now = Math.floor(Date.now() / 1000);
  const values = {
    'valid':            () => signature(secret, body, now),
    'wrong hmac':       () => signature(`whsec_${'0'.repeat(32)}`, body, now),
    'stale timestamp':  () => signature(secret, body, now - 600),
    'future timestamp': () => signature(secret, body, now + 600),
    'garbage':          () => 'garbage',
    'empty':            () => '',
  };
  return { 'X-PlayQA-Signature': choose(values, kind, 'signature kind (or none)')() };
}

module.exports = { SIGNED_BODY, headerFor };
