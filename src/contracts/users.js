/** /users/* contracts. */
const { str, int, bool, object, arr, obj, entry } = require('./schema');

const UserResponse = obj({ id: str, email: str, username: str, profile: object, metadata: object });

const UsersListResponse = obj({ users: arr(object), page: int, per_page: int, total: int, total_pages: int });

const LogoutResponse = obj({ success: bool, message: str });

const CONTRACTS_2XX = [
  entry('POST',  '/users/create',       'UserResponse',      UserResponse),
  entry('GET',   '/users/list',         'UsersListResponse', UsersListResponse),
  entry('GET',   '/users/get/[^/]+',    'UserResponse',      UserResponse),
  entry('PUT',   '/users/update/[^/]+', 'UserResponse',      UserResponse),
  entry('PATCH', '/users/patch/[^/]+',  'UserResponse',      UserResponse),
  entry('POST',  '/users/logout/[^/]+', 'LogoutResponse',    LogoutResponse),
];

module.exports = { CONTRACTS_2XX };
