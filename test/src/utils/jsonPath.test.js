const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPath, hasPath } = require('../../../src/utils/jsonPath');

const body = { metadata: { role: 'user', login_count: 0, avatar: null }, items: [{ id: 7 }] };

test('getPath reads a dotted path, array indexes included', () => {
  assert.equal(getPath(body, 'metadata.role'), 'user');
  assert.equal(getPath(body, 'items.0.id'), 7);
});

test('getPath of a missing or broken path is undefined, never a throw', () => {
  assert.equal(getPath(body, 'metadata.missing.deeper'), undefined);
  assert.equal(getPath(body, 'metadata.avatar.url'), undefined);
  assert.equal(getPath(null, 'a'), undefined);
});

test('hasPath is true for a present field, even when its value is null or 0', () => {
  assert.equal(hasPath(body, 'metadata.avatar'), true);
  assert.equal(hasPath(body, 'metadata.login_count'), true);
});

test('hasPath is false for an absent field, a path through a scalar or null, and inherited properties', () => {
  assert.equal(hasPath(body, 'metadata.password'), false);
  assert.equal(hasPath(body, 'metadata.role.length'), false);
  assert.equal(hasPath(body, 'metadata.avatar.url'), false);
  assert.equal(hasPath(body, 'metadata.toString'), false);
  assert.equal(hasPath(null, 'a'), false);
});
