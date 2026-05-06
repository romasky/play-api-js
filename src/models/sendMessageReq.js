module.exports = ({ from, subject, body, htmlBody: html_body } = {}) =>
  JSON.parse(JSON.stringify({ from, subject, body, html_body }));
