/** /mail/* contracts. */
const { str, int, bool, object, arr, nullable, obj, entry } = require('./schema');

const MailboxResponse = obj({ id: str, token: str, email_address: str, domain: str, expires_at: str, created_at: str });

const MessagesListResponse = obj({ messages: arr(object), count: int });

// single message (GET /mail/:token/messages/:id and POST /mail/:token/send 201)
const MessageResponse = obj(
  { id: str, from: str, subject: str, body_preview: str, body: str, received_at: str },
  { html_body: nullable(str), headers: nullable(object) },
);

// no `success` field; magic recipients add `enhanced_status`, accepted ones add `message_id`
const SendToResponse = obj({ accepted: bool, to: str, smtp_code: str, category: str, message: str });

const CONTRACTS_2XX = [
  entry('POST', '/mail/create',                'MailboxResponse',      MailboxResponse),
  entry('GET',  '/mail/[^/]+',                 'MailboxResponse',      MailboxResponse),
  entry('GET',  '/mail/[^/]+/messages',        'MessagesListResponse', MessagesListResponse),
  entry('GET',  '/mail/[^/]+/messages/[^/]+',  'MessageResponse',      MessageResponse),
  entry('POST', '/mail/[^/]+/send',            'MessageResponse',      MessageResponse),
  entry('POST', '/mail/[^/]+/send-to',         'SendToResponse',       SendToResponse),
];

module.exports = { CONTRACTS_2XX };
