/**
 * /users/* — create, read, list, exists, update, patch, delete, logout, options, create-admin.
 *
 * A service takes plain values (never the World) and returns the response untouched — assertions stay in the
 * steps and the contracts. `body` is any JSON value, or a RawJson for deliberately broken payloads.
 */
const { request } = require('../http/client');
const paths = require('../http/paths');

module.exports = {
  create:      (body)                 => request('POST',   paths.USERS_CREATE, { json: body }),
  createAdmin: (body)                 => request('POST',   paths.USERS_CREATE_ADMIN, { json: body }),
  get:         (id, headers = {})     => request('GET',    paths.usersGet(id), { headers }),
  list:        (params, headers = {}) => request('GET',    paths.USERS_LIST, { params, headers }),
  // HEAD or GET — both answer 200/404 with an X-User-Exists header
  exists:      (id, method)           => request(method,   paths.usersExists(id)),
  update:      (id, body, headers)    => request('PUT',    paths.usersUpdate(id), { json: body, headers }),
  patch:       (id, body, headers)    => request('PATCH',  paths.usersPatch(id), { json: body, headers }),
  delete:      (id, headers)          => request('DELETE', paths.usersDelete(id), { headers }),
  logout:      (id, headers)          => request('POST',   paths.usersLogout(id), { headers }),
  options:     ()                     => request('OPTIONS', paths.USERS_OPTIONS),
};
