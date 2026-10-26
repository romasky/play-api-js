/** /admin/* — operator endpoints (TokenAuth → RequireAdmin → own-account scope). */
const { request } = require('../http/client');
const paths = require('../http/paths');

module.exports = {
  stats:      (headers)               => request('GET',    paths.ADMIN_STATS, { headers }),
  listUsers:  (headers, params)       => request('GET',    paths.ADMIN_USERS, { params, headers }),
  setRole:    (id, body, headers)     => request('PATCH',  paths.adminUserRole(id), { json: body, headers }),
  deleteUser: (id, headers)           => request('DELETE', paths.adminUser(id), { headers }),
};
