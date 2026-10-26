/** /mail/* — temporary mailboxes, message injection and the SMTP response simulator. */
const { request } = require('../http/client');
const paths = require('../http/paths');

module.exports = {
  createMailbox: (body = {})      => request('POST',   paths.MAIL_CREATE, { json: body }),
  getMailbox:    (token)          => request('GET',    paths.mailGet(token)),
  deleteMailbox: (token)          => request('DELETE', paths.mailGet(token)),
  listMessages:  (token)          => request('GET',    paths.mailMessages(token)),
  getMessage:    (token, id)      => request('GET',    paths.mailMessage(token, id)),
  send:          (token, body)    => request('POST',   paths.mailSend(token), { json: body }),
  // SMTP response simulator — always 200; `accepted` tells the delivery outcome
  sendTo:        (token, body)    => request('POST',   paths.mailSendTo(token), { json: body }),
};
