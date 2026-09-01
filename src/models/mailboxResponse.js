const { hasPath } = require('../utils/jsonPath');

/**
 * Assertions for GET /mail/:token/messages → { messages: [...], count }
 */

const getMessages = (res) => res.data?.messages ?? [];

const FULL_BODY_FIELDS = ['body', 'html_body', 'headers'];

/**
 * List items carry only `body_preview`; the full `body` / `html_body` / `headers`
 * belong to the single-message endpoint. A substring check cannot express this
 * (`body_preview` contains the substring `body`), so check own-properties instead.
 */
function assertListItemsHaveNoFullBody(res) {
  const messages = getMessages(res);
  if (messages.length === 0) {
    throw new Error('Expected at least one message in the list to check its shape');
  }
  messages.forEach((message, index) => {
    if (!hasPath(message, 'body_preview')) {
      throw new Error(`messages[${index}] has no 'body_preview'. Item: ${JSON.stringify(message)}`);
    }
    const leaked = FULL_BODY_FIELDS.filter((field) => hasPath(message, field));
    if (leaked.length > 0) {
      throw new Error(`messages[${index}] exposes full-body fields [${leaked.join(', ')}]. Item: ${JSON.stringify(message)}`);
    }
  });
}

module.exports = { assertListItemsHaveNoFullBody };
