const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseSse } = require('../../../src/utils/sse');

test('each data line is one event, named by the event line before it', () => {
  const text = 'event: ping\ndata: {"n":1}\n\nevent: done\r\ndata: {"n":2}\r\n';
  assert.deepEqual(parseSse(text), [{ event: 'ping', data: { n: 1 } }, { event: 'done', data: { n: 2 } }]);
});

test('a data line without an event line is a "message", and the name does not carry over', () => {
  const text = 'event: ping\ndata: {"n":1}\ndata: {"n":2}\n: comment\nid: 3\n';
  assert.deepEqual(parseSse(text), [{ event: 'ping', data: { n: 1 } }, { event: 'message', data: { n: 2 } }]);
});

test('no data, no events', () => {
  assert.deepEqual(parseSse(''), []);
});

test('data that is not JSON fails loudly', () => {
  assert.throws(() => parseSse('data: not json'), SyntaxError);
});
