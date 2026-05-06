const axios = require('axios');
const config = require('../config/config');

const client = axios.create({
  baseURL: config.baseUrl,
  timeout: config.socketTimeout,
  validateStatus: () => true,
});

function bearerHeader(token) {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

async function post(path, body = null, headers = {}) {
  return await client.post(path, body, { headers });
}

async function postNoBody(path, headers = {}) {
  return await client.post(path, undefined, { headers });
}

async function get(path, params = {}, headers = {}) {
  return await client.get(path, { params, headers });
}

async function put(path, body, headers = {}) {
  return await client.put(path, body, { headers });
}

async function patch(path, body, headers = {}) {
  return await client.patch(path, body, { headers });
}

async function del(path, headers = {}) {
  return await client.delete(path, { headers });
}

async function head(path) {
  return await client.head(path);
}

async function options(path) {
  return await client.options(path);
}

module.exports = { post, postNoBody, get, put, patch, del, head, options, bearerHeader };
