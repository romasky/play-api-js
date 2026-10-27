#!/usr/bin/env node
/**
 * Mutation testing of one source file against its unit tests — do the tests notice when the code is wrong?
 *
 * Each mutant is one small fault (a flipped comparison, a dropped `!`, a negated condition, a return emptied).
 * The tests run once per mutant: a failure KILLS it, a pass means it SURVIVED — a behavior nothing checks. Survivors
 * on lines no test reaches are uncovered code; survivors that no test could ever kill are dead code.
 * Mutants are injected at compile time (tools/lib/mutant-hook.js), never written to disk.
 *
 *   node tools/mutate.js src/assertions/body.js                  # tests: every test/**\/*.test.js requiring it
 *   node tools/mutate.js src/assertions/body.js --fn assertSorted
 *   node tools/mutate.js src/utils/sse.js --tests test/src/utils/sse.test.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT } = require('./spec');
const { parse, children, functions } = require('./lib/functions');
const { apply } = require('./lib/mutant-hook');

const HOOK = path.join(__dirname, 'lib', 'mutant-hook.js');
const FLIPS = {
  '===': ['!=='], '!==': ['==='], '==': ['!='], '!=': ['=='],
  '<': ['>=', '<='], '<=': ['>', '<'], '>': ['<=', '>='], '>=': ['<', '>'],
  '+': ['-'], '-': ['+'], '*': ['/'], '/': ['*'],
  '&&': ['||'], '||': ['&&'], '??': ['&&'], // `?? → ||` is equivalent whenever the left side is never 0 / ''
};

/** The CLI entry guard of a tool: plumbing, not behavior — its mutants say nothing about the tests. */
const isEntryGuard = (node, source) => node.type === 'IfStatement' && text(source, node.test) === 'require.main === module';

const text = (source, node) => source.slice(node.start, node.end);

function flipOperator(node, source) {
  const at = node.left.end + source.slice(node.left.end, node.right.start).indexOf(node.operator);
  return (FLIPS[node.operator] ?? []).map((op) => [at, at + node.operator.length, op, `${node.operator} → ${op}`]);
}

const negateCondition = (what) => (node, source) =>
  [[node.test.start, node.test.end, `!(${text(source, node.test)})`, `${what} condition negated`]];

function emptyReturn(node, source) {
  if (!node.argument || text(source, node.argument) === 'undefined') return [];
  const statement = text(source, node).replace(/;$/, '');
  return [[node.argument.start, node.argument.end, 'undefined', `${statement} → return undefined`]];
}

/** Mutants of one node by its type, as [start, end, replacement, description]. */
const MUTATIONS = {
  BinaryExpression: flipOperator,
  LogicalExpression: flipOperator,
  UnaryExpression: (node, source) => (node.operator === '!' ? [[node.start, node.end, text(source, node.argument), '! removed']] : []),
  Literal: (node) => (typeof node.value === 'boolean' ? [[node.start, node.end, String(!node.value), `${node.value} → ${!node.value}`]] : []),
  IfStatement: negateCondition('if'),
  ConditionalExpression: negateCondition('?:'),
  ReturnStatement: emptyReturn,
};

const mutationsOf = (node, source) => MUTATIONS[node.type]?.(node, source) ?? [];

/** Every mutant of the source, in source order: { start, end, replacement, description, line }. */
function mutants(source) {
  const lineOf = (offset) => source.slice(0, offset).split('\n').length;
  const found = [];
  const visit = (node) => {
    if (isEntryGuard(node, source)) return;
    for (const [start, end, replacement, description] of mutationsOf(node, source)) {
      found.push({ start, end, replacement, description, line: lineOf(start) });
    }
    for (const child of children(node)) visit(child);
  };
  visit(parse(source));
  return found;
}

/** 'killed' | 'survived' — the tests run with the mutant compiled into `file`. */
function run({ file, mutant, tests, timeout = 60_000 }) {
  const { NODE_TEST_CONTEXT, ...env } = process.env; // a nested `node --test` must report as a top-level run
  const result = spawnSync(process.execPath, ['--test', ...tests], {
    cwd: ROOT,
    stdio: 'ignore',
    timeout,
    env: mutant
      ? { ...env, NODE_OPTIONS: `${env.NODE_OPTIONS ?? ''} --require ${HOOK}`, UB_MUTANT: JSON.stringify({ file, ...mutant }) }
      : env,
  });
  return result.status === 0 ? 'survived' : 'killed';
}

const REQUIRE = /require\(['"](\.[^'"]+)['"]\)/g;

/** The unit tests with a relative `require(…)` that resolves to `file`. */
function testsFor(file) {
  const module = file.replace(/\.js$/, '');
  const requires = (test) => [...fs.readFileSync(test, 'utf8').matchAll(REQUIRE)]
    .map(([, spec]) => path.resolve(path.dirname(test), spec).replace(/\.js$/, ''));
  return fs.readdirSync(path.join(ROOT, 'test'), { recursive: true })
    .filter((name) => name.endsWith('.test.js'))
    .map((name) => path.join(ROOT, 'test', name))
    .filter((test) => requires(test).includes(module));
}

/** The mutants of the source, or only those inside the function named `fnName` (which must exist). */
function inFunction(source, fnName) {
  if (fnName === undefined) return mutants(source);
  const fn = functions(source).find(({ name }) => name === fnName);
  if (!fn) throw new Error(`no function named '${fnName}'`);
  return mutants(source).filter(({ line }) => line >= fn.start && line <= fn.end);
}

/** Percent of mutants killed, rounded; nothing to mutate counts as fully killed. */
const score = (total, survived) => (total === 0 ? 100 : Math.round(((total - survived) / total) * 100));

function main(argv) {
  const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  const file = path.resolve(argv[0] ?? '');
  const tests = arg('--tests')?.split(',').map((test) => path.resolve(test)) ?? testsFor(file);
  if (!fs.existsSync(file) || tests.length === 0) {
    console.error(`no unit test requires ${argv[0]} — write one first (cover the uncovered)`);
    return 2;
  }
  if (run({ file, tests }) !== 'survived') {
    console.error('the unit tests fail without any mutant — make them green first');
    return 2;
  }
  const all = inFunction(fs.readFileSync(file, 'utf8'), arg('--fn'));
  const survivors = all.filter((mutant) => run({ file, mutant, tests }) === 'survived');
  for (const m of survivors) console.log(`SURVIVED  ${path.relative(ROOT, file)}:${m.line}  ${m.description}`);
  const killed = all.length - survivors.length;
  console.log(`${all.length} mutant(s): ${killed} killed, ${survivors.length} survived (${score(all.length, survivors.length)} %)`);
  return survivors.length ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { mutants, apply, run, inFunction, score, testsFor, main };
