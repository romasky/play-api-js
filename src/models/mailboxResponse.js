/**
 * Helpers for mailbox and message response shapes.
 */

// POST /mail/create → 201 and GET /mail/:token → 200
function getToken(res) {
  return res.data?.token;
}

function getEmailAddress(res) {
  return res.data?.email_address;
}

function getDomain(res) {
  return res.data?.domain;
}

function getMailboxId(res) {
  return res.data?.id;
}

function getExpiresAt(res) {
  return res.data?.expires_at;
}

// GET /mail/:token/messages → 200
function getMessages(res) {
  return res.data?.messages ?? [];
}

function getCount(res) {
  return res.data?.count;
}

// GET /mail/:token/messages/:id → 200 and POST /mail/:token/send → 201
function getMessageId(res) {
  return res.data?.id;
}

function getFrom(res) {
  return res.data?.from;
}

function getSubject(res) {
  return res.data?.subject;
}

function getBody(res) {
  return res.data?.body;
}

function getHtmlBody(res) {
  return res.data?.html_body;
}

function getBodyPreview(res) {
  return res.data?.body_preview;
}

module.exports = {
  getToken, getEmailAddress, getDomain, getMailboxId, getExpiresAt,
  getMessages, getCount,
  getMessageId, getFrom, getSubject, getBody, getHtmlBody, getBodyPreview,
};
