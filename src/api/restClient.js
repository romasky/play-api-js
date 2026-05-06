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

async function callWithStep(method, path, body, headers) {
  return step(`${method} ${path}`, async (ctx) => {
    ctx.parameter('path', path);
    if (body !== undefined && body !== null) {
      ctx.parameter('body', JSON.stringify(body));
      attachment('Request Body', JSON.stringify(body, null, 2), 'application/json');
    }
    if (headers && Object.keys(headers).length > 0) {
      ctx.parameter('headers', JSON.stringify(headers));
    }

    let response;
    switch (method) {
      case 'POST':   response = await client.post(path, body, { headers }); break;
      case 'PUT':    response = await client.put(path, body, { headers }); break;
      case 'PATCH':  response = await client.patch(path, body, { headers }); break;
      case 'DELETE': response = await client.delete(path, { headers }); break;
    }

    ctx.parameter('status', String(response.status));
    if (response.data) {
      attachment('Response Body', JSON.stringify(response.data, null, 2), 'application/json');
    }
    return response;
  });
}

async function post(path, body = null, headers = {}) {
  return callWithStep('POST', path, body, headers);
}

async function postNoBody(path, headers = {}) {
  return callWithStep('POST', path, undefined, headers);
}

async function get(path, params = {}, headers = {}) {
  return step(`GET ${path}`, async (ctx) => {
    ctx.parameter('path', path);
    if (params && Object.keys(params).length > 0) {
      ctx.parameter('params', JSON.stringify(params));
    }
    if (headers && Object.keys(headers).length > 0) {
      ctx.parameter('headers', JSON.stringify(headers));
    }
    const response = await client.get(path, { params, headers });
    ctx.parameter('status', String(response.status));
    if (response.data) {
      attachment('Response Body', JSON.stringify(response.data, null, 2), 'application/json');
    }
    return response;
  });
}

async function put(path, body, headers = {}) {
  return callWithStep('PUT', path, body, headers);
}

async function patch(path, body, headers = {}) {
  return callWithStep('PATCH', path, body, headers);
}

async function del(path, headers = {}) {
  return step(`DELETE ${path}`, async (ctx) => {
    ctx.parameter('path', path);
    if (headers && Object.keys(headers).length > 0) {
      ctx.parameter('headers', JSON.stringify(headers));
    }
    const response = await client.delete(path, { headers });
    ctx.parameter('status', String(response.status));
    return response;
  });
}

async function head(path) {
  return step(`HEAD ${path}`, async (ctx) => {
    ctx.parameter('path', path);
    const response = await client.head(path);
    ctx.parameter('status', String(response.status));
    return response;
  });
}

async function options(path) {
  return step(`OPTIONS ${path}`, async (ctx) => {
    ctx.parameter('path', path);
    const response = await client.options(path);
    ctx.parameter('status', String(response.status));
    return response;
  });
}

module.exports = { post, postNoBody, get, put, patch, del, head, options, bearerHeader };
