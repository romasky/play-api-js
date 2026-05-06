const axios = require('axios');
const { step, attachment } = require('allure-js-commons');
const config = require('../config/config');

const client = axios.create({
  baseURL: config.baseUrl,
  timeout: config.socketTimeout,
  validateStatus: () => true,
});

function bearerHeader(token) {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

async function attachResponse(response) {
  await attachment(
    'Response',
    JSON.stringify({ status: response.status, data: response.data }, null, 2),
    'application/json',
  );
}

async function post(path, body = null, headers = {}) {
  return await step(`POST ${path}`, async () => {
    const response = await client.post(path, body, { headers });
    await attachResponse(response);
    return response;
  });
}

async function postNoBody(path, headers = {}) {
  return await step(`POST ${path}`, async () => {
    const response = await client.post(path, undefined, { headers });
    await attachResponse(response);
    return response;
  });
}

async function get(path, params = {}, headers = {}) {
  return await step(`GET ${path}`, async () => {
    const response = await client.get(path, { params, headers });
    await attachResponse(response);
    return response;
  });
}

async function put(path, body, headers = {}) {
  return await step(`PUT ${path}`, async () => {
    const response = await client.put(path, body, { headers });
    await attachResponse(response);
    return response;
  });
}

async function patch(path, body, headers = {}) {
  return await step(`PATCH ${path}`, async () => {
    const response = await client.patch(path, body, { headers });
    await attachResponse(response);
    return response;
  });
}

async function del(path, headers = {}) {
  return await step(`DELETE ${path}`, async () => {
    const response = await client.delete(path, { headers });
    await attachResponse(response);
    return response;
  });
}

async function head(path) {
  return await step(`HEAD ${path}`, async () => {
    const response = await client.head(path);
    await attachResponse(response);
    return response;
  });
}

async function options(path) {
  return await step(`OPTIONS ${path}`, async () => {
    const response = await client.options(path);
    await attachResponse(response);
    return response;
  });
}

module.exports = { post, postNoBody, get, put, patch, del, head, options, bearerHeader };
