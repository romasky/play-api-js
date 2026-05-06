const axios = require('axios');
const allure = require('allure-js-commons');
const config = require('../config/config');

const client = axios.create({
  baseURL: config.baseUrl,
  timeout: config.socketTimeout,
  validateStatus: () => true,
});

function attachResponse(response) {
  const body = response.data;
  if (body && typeof body === 'object' && Object.keys(body).length > 0) {
    allure.attachment(
      `Response ${response.status}`,
      JSON.stringify(body, null, 2),
      'application/json'
    );
  }
}

function bearerHeader(token) {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

async function post(path, body = null, headers = {}) {
  return await allure.step(`POST ${path}`, async () => {
    const res = await client.post(path, body, { headers });
    attachResponse(res);
    return res;
  });
}

async function postNoBody(path, headers = {}) {
  return await allure.step(`POST ${path} (no body)`, async () => {
    const res = await client.post(path, undefined, { headers });
    attachResponse(res);
    return res;
  });
}

async function get(path, params = {}, headers = {}) {
  return await allure.step(`GET ${path}`, async () => {
    const res = await client.get(path, { params, headers });
    attachResponse(res);
    return res;
  });
}

async function put(path, body, headers = {}) {
  return await allure.step(`PUT ${path}`, async () => {
    const res = await client.put(path, body, { headers });
    attachResponse(res);
    return res;
  });
}

async function patch(path, body, headers = {}) {
  return await allure.step(`PATCH ${path}`, async () => {
    const res = await client.patch(path, body, { headers });
    attachResponse(res);
    return res;
  });
}

async function del(path, headers = {}) {
  return await allure.step(`DELETE ${path}`, async () => {
    const res = await client.delete(path, { headers });
    attachResponse(res);
    return res;
  });
}

async function head(path) {
  return await allure.step(`HEAD ${path}`, async () => {
    return await client.head(path);
  });
}

async function options(path) {
  return await allure.step(`OPTIONS ${path}`, async () => {
    const res = await client.options(path);
    attachResponse(res);
    return res;
  });
}

module.exports = { post, postNoBody, get, put, patch, del, head, options, bearerHeader };
