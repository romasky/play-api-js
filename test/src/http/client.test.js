const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { request } = require('../../../src/http/client');

/** A local server whose `nth` requests (1-based) get their socket destroyed instead of an answer. */
async function serverResetting(...nth) {
  let seen = 0;
  const server = http.createServer((req, res) => {
    seen += 1;
    if (nth.includes(seen)) req.socket.destroy();
    else res.end('{"ok":true}');
  });
  server.keepAliveTimeout = 60_000;
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen: () => seen, close: () => { server.closeAllConnections(); server.close(); } };
}

test('a reset on a reused keep-alive socket is resent once and answers', async () => {
  const server = await serverResetting(2);
  try {
    assert.equal((await request('GET', `${server.url}/a`)).status, 200);
    const res = await request('POST', `${server.url}/b`, { json: { x: 1 } }); // reuses the socket of /a
    assert.equal(res.status, 200);
    assert.equal(server.seen(), 3);
  } finally {
    server.close();
  }
});

test('a reset on a fresh socket is not resent', async () => {
  const server = await serverResetting(1);
  try {
    await assert.rejects(request('GET', `${server.url}/a`), (err) => err.code === 'ECONNRESET' || err.message === 'socket hang up');
    assert.equal(server.seen(), 1);
  } finally {
    server.close();
  }
});
