const { test } = require('node:test');
const assert = require('node:assert/strict');
const { option, flag } = require('../../../tools/lib/args');

test('an option is the value after its name, or the fallback when absent', () => {
  assert.equal(option(['--max', '12', 'x'], '--max', '10'), '12');
  assert.equal(option(['x'], '--max', '10'), '10');
  assert.equal(option([], '--fn'), undefined);
});

test('an option given without a value fails loudly instead of becoming NaN or the next flag', () => {
  assert.throws(() => option(['--max'], '--max', '10'), /--max needs a value/);
  assert.throws(() => option(['--max', '--update'], '--max', '10'), /--max needs a value/);
});

test('a numeric option must be a number', () => {
  assert.equal(option(['--max', '12'], '--max', 10, Number), 12);
  assert.equal(option([], '--max', 10, Number), 10);
  assert.throws(() => option(['--max', 'ten'], '--max', 10, Number), /--max must be a number, got 'ten'/);
});

test('a flag is present or not', () => {
  assert.equal(flag(['--update'], '--update'), true);
  assert.equal(flag([], '--update'), false);
});
