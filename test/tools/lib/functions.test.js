const { test } = require('node:test');
const assert = require('node:assert/strict');
const { functions, sourceFiles, allFunctions } = require('../../../tools/lib/functions');

const only = (source) => functions(source)[0];

test('a straight-line function has complexity 1', () => {
  assert.equal(only('function f(a) { return a + 1; }').complexity, 1);
});

test('every decision point adds one', () => {
  const source = `function f(a, b) {
    if (a) return 1;
    for (const x of b) { while (x) {} }
    const y = a ? 1 : 2;
    return (a && b || a) ?? b;
  }`;
  // if, for-of, while, ?:, &&, ||, ??
  assert.equal(only(source).complexity, 8);
});

test('switch cases count, default does not; catch counts', () => {
  const source = `function f(a) {
    switch (a) { case 1: break; case 2: break; default: break; }
    try { a(); } catch { return 0; }
  }`;
  assert.equal(only(source).complexity, 4);
});

test('a nested function is its own unit, not part of its parent', () => {
  const [outer, inner] = functions('function outer(a) { if (a) {} const inner = (b) => b && a; }');
  assert.deepEqual([outer.name, outer.complexity], ['outer', 2]);
  assert.deepEqual([inner.name, inner.complexity], ['inner', 2]);
});

test('names come from declarations, variables, methods and properties', () => {
  const source = `
    function decl() {}
    const arrow = () => 1;
    class K { method() {} }
    module.exports = { prop: function () {} };`;
  assert.deepEqual(functions(source).map((f) => f.name), ['decl', 'arrow', 'K.method', 'prop']);
});

test('a Cucumber step callback is named by its phrase', () => {
  const [step] = functions("Given('a user with token {string}', async function (key) {});");
  assert.equal(step.name, "Given 'a user with token {string}'");
});

test('an anonymous function is named by its owner and position, so the name survives moved lines', () => {
  const source = 'function f(xs) {\n  return xs.map((x) => x).filter(() => true);\n}\n[1].forEach(() => {});';
  assert.deepEqual(functions(source).map((f) => f.name), ['f', 'f>λ1', 'f>λ2', '<top>>λ1']);
  assert.deepEqual(functions(`\n\n${source}`).map((f) => f.name), ['f', 'f>λ1', 'f>λ2', '<top>>λ1']);
});

test('line spans are 1-based and inclusive', () => {
  const [f] = functions('\nfunction f() {\n  return 1;\n}\n');
  assert.deepEqual([f.start, f.end], [2, 4]);
});

test('assigned functions and method-call callbacks are named too', () => {
  const source = "exports.run = function () {};\nhandler = () => {};\nemitter.on('close', () => {});";
  assert.deepEqual(functions(source).map((f) => f.name), ['run', 'handler', "on 'close'"]);
});

test('a CLI script with a hashbang parses', () => {
  assert.equal(only('#!/usr/bin/env node\nfunction main() {}').name, 'main');
});

test('the gates judge every .js under src/ and tools/, nested folders included, and nothing else', () => {
  const files = sourceFiles();
  assert.ok(files.includes('src/http/client.js') && files.includes('tools/lib/functions.js'));
  assert.ok(files.every((file) => /^(src|tools)\/.*\.js$/.test(file)));
  const mine = allFunctions().find((fn) => fn.file === 'tools/lib/functions.js' && fn.name === 'functions');
  assert.match(mine.source, /^\/\*\*/);
});

test('a class field holding a function is named by the field', () => {
  assert.deepEqual(functions('class K { handler = () => {}; }').map((f) => f.name), ['handler']);
});

test('two functions with the same name in one file get distinct names, so gate keys never merge', () => {
  const source = 'function a() { const check = () => 1; }\nfunction b() { const check = () => 2; }\nclass K { get x() {} set x(v) {} }';
  assert.deepEqual(functions(source).map((f) => f.name), ['a', 'check', 'b', 'check#2', 'K.x', 'K.x#2']);
});
