/** Request bodies for /mail/*. Undefined fields are dropped. */
const compact = (fields) => JSON.parse(JSON.stringify(fields));

const createMailboxReq = ({ domain, localPart: local_part } = {}) => compact({ domain, local_part });

const sendMessageReq = ({ from, subject, body, htmlBody: html_body } = {}) => compact({ from, subject, body, html_body });

module.exports = { createMailboxReq, sendMessageReq };
