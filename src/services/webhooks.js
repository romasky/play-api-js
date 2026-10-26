/** /webhooks/* — inbox lifecycle (private `token`) and capture via any method on the public `ingest_token`. */
const { request } = require('../http/client');
const paths = require('../http/paths');

module.exports = {
  createInbox: ()           => request('POST',   paths.WEBHOOKS_INBOX),
  getInbox:    (token)      => request('GET',    paths.webhook(token)),
  deleteInbox: (token)      => request('DELETE', paths.webhook(token)),
  /** `content` is sent as is (string or bytes) — events are compared byte-for-byte later. */
  ingest: (ingestToken, method = 'POST', { content, contentType, headers, params } = {}) =>
    request(method, paths.webhookIngest(ingestToken), { content, contentType, headers, params }),
  listEvents:  (token, params)    => request('GET', paths.webhookEvents(token), { params }),
  getEvent:    (token, eventId)   => request('GET', paths.webhookEvent(token, eventId)),
};
