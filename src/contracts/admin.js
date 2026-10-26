/** /admin/* and /users/create-admin contracts. */
const { str, int, obj, entry } = require('./schema');
const { UserResponse, UsersListResponse } = require('./users');

const AdminStatsResponse = obj({
  total: int,
  by_role: obj({ admin: int, moderator: int, user: int }),
  with_active_token: int,
  generated_at: str,
});

// same envelope as /users/list (but no X-Total-Count / Link headers); rows add `has_active_token`
const AdminUsersListResponse = UsersListResponse;

const CONTRACTS_2XX = [
  entry('POST',  '/users/create-admin',     'UserResponse',           UserResponse),
  entry('GET',   '/admin/stats',            'AdminStatsResponse',     AdminStatsResponse),
  entry('GET',   '/admin/users',            'AdminUsersListResponse', AdminUsersListResponse),
  entry('PATCH', '/admin/users/[^/]+/role', 'UserResponse',           UserResponse),
];

module.exports = { CONTRACTS_2XX };
