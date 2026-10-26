/** /webhooks/* contracts — NO `success` field on any webhook 2xx body. */
const { str, int, bool, object, arr, nullable, obj, entry } = require('./schema');

const INBOX = {
  id: str, token: str, ingest_token: str, ingest_url: str, event_count: int,
  total_received: int, dropped_count: int, created_at: str, expires_at: str,
};

const WebhookInbox        = obj(INBOX);
const WebhookInboxCreated = obj({ ...INBOX, signing_secret: str }); // only in the 201 — GET never returns it

const IngestAccepted = obj({ received: bool, event_id: str });

const EventSummary = obj(
  { id: str, method: str, content_type: str, body_size: int, body_encoding: str, signature_valid: nullable(bool), received_at: str },
  { body_preview: nullable(str) },
);

const EventsListResponse = obj({
  events: arr(EventSummary), total: int, returned: int, page: int, per_page: int, dropped_count: int,
});

const WebhookEvent = obj(
  {
    id: str, method: str, path: str, headers: object, content_type: str, body_size: int,
    body_encoding: str, // "utf8" | "base64"
    signature_valid: nullable(bool), received_at: str,
  },
  // omitted when the request had no query string / an empty body (HEAD included)
  { query: object, body: str },
);

const CONTRACTS_2XX = [
  entry('POST', '/webhooks/inbox',                'WebhookInboxCreated', WebhookInboxCreated),
  entry('GET',  '/webhooks/[^/]+',                'WebhookInbox',        WebhookInbox),
  entry('GET',  '/webhooks/[^/]+/events',         'EventsListResponse',  EventsListResponse),
  entry('GET',  '/webhooks/[^/]+/events/[^/]+',   'WebhookEvent',        WebhookEvent),
  ...['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => entry(m, '/webhooks/in/[^/]+', 'IngestAccepted', IngestAccepted)),
];

module.exports = { CONTRACTS_2XX };
