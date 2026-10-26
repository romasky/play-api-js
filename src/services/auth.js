/** Opaque-token login (POST /login), HTTP Basic (GET /auth/basic) and the Store persona login. */
const { request } = require('../http/client');
const paths = require('../http/paths');

module.exports = {
  login:      (body)         => request('POST', paths.LOGIN, { json: body }),
  basicAuth:  (headers = {}) => request('GET',  paths.AUTH_BASIC, { headers }),
  storeLogin: (body)         => request('POST', paths.STORE_LOGIN, { json: body }),
};
