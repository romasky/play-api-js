const { hasPath } = require('../utils/jsonPath');

/**
 * Assertions for GET /users/list response shape: { users: [...], page, per_page, total_pages }
 */

const getUsers = (res) => res.data?.users ?? [];

function assertNotEmpty(res) {
  const users = getUsers(res);
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('Expected non-empty users list');
  }
}

/** Every list item must NOT expose `field` (e.g. access_token, password). */
function assertItemsHaveNoField(res, field) {
  const offenders = getUsers(res).filter((user) => hasPath(user, field));
  if (offenders.length > 0) {
    throw new Error(`${offenders.length} user(s) in list expose '${field}'. First: ${JSON.stringify(offenders[0])}`);
  }
}

module.exports = { assertNotEmpty, assertItemsHaveNoField };
