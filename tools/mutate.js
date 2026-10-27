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
const os = require('os');
const path = require('path');
const acorn = require('acorn');
const { spawnSync } = require('child_process');
const { ROOT } = require('./spec');
const { parse, children, functions } = require('./lib/functions');
const { apply } = require('./lib/mutant-hook');
const { option } = require('./lib/args');

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

/**
 * Offset of the operator token after the left operand — a token, so never a match inside a comment. Tokenizing from
 * the start of the whole expression keeps the context: in `(a + b) / 2` the `/` follows an expression, so it is
 * division, where a tokenizer starting inside the parentheses, or at `) / 2`, would read the start of a regex.
 * (`node.left` starts inside the parentheses; the expression itself starts at the `(`.)
 */
function operatorAt(node, source) {
  const tokens = acorn.tokenizer(source.slice(node.start, node.right.start), { ecmaVersion: 'latest' });
  const leftEnd = node.left.end - node.start;
  const token = [...tokens].find(({ start, value, type }) => start >= leftEnd && (value ?? type.label) === node.operator);
  return node.start + token.start;
}

function flipOperator(node, source) {
  const at = operatorAt(node, source);
  return (FLIPS[node.operator] ?? []).map((op) => [at, at + node.operator.length, op, `${node.operator} → ${op}`]);
}

/**
 * A logical operator is flipped by rewriting the whole expression with parenthesised operands: `a ?? b ?? c` with one
 * `??` turned `&&` would otherwise mix ?? and && without parentheses — a syntax error, i.e. a false kill.
 */
function flipLogical(node, source) {
  const at = operatorAt(node, source);
  const [left, right] = [text(source, node.left), text(source, node.right)];
  return (FLIPS[node.operator] ?? []).map((op) => [node.start, node.end, `((${left}) ${op} (${right}))`, `${node.operator} → ${op}`, at]);
}

const negateCondition = (what) => (node, source) =>
  [[node.test.start, node.test.end, `!(${text(source, node.test)})`, `${what} condition negated`]];

function emptyReturn(node, source) {
  if (!node.argument || text(source, node.argument) === 'undefined') return [];
  const statement = text(source, node).replace(/;$/, '');
  return [[node.argument.start, node.argument.end, 'undefined', `${statement} → return undefined`]];
}

/** `(a) => expr` returns expr without a return statement: empty it like one. */
function emptyArrowBody(node, source) {
  if (!node.expression || text(source, node.body) === 'undefined') return [];
  return [[node.body.start, node.body.end, 'undefined', `=> ${text(source, node.body)} → => undefined`]];
}

/** Mutants of one node by its type, as [start, end, replacement, description]. */
const MUTATIONS = {
  BinaryExpression: flipOperator,
  LogicalExpression: flipLogical,
  UnaryExpression: (node, source) => (node.operator === '!' ? [[node.start, node.end, text(source, node.argument), '! removed']] : []),
  Literal: (node) => (typeof node.value === 'boolean' ? [[node.start, node.end, String(!node.value), `${node.value} → ${!node.value}`]] : []),
  IfStatement: negateCondition('if'),
  ConditionalExpression: negateCondition('?:'),
  ReturnStatement: emptyReturn,
  ArrowFunctionExpression: emptyArrowBody,
};

const mutationsOf = (node, source) => MUTATIONS[node.type]?.(node, source) ?? [];

/** Every mutant of the source, in source order: { start, end, replacement, description, line }. */
function mutants(source) {
  const lineOf = (offset) => source.slice(0, offset).split('\n').length;
  const found = [];
  const visit = (node) => {
    if (isEntryGuard(node, source)) return;
    for (const [start, end, replacement, description, at = start] of mutationsOf(node, source)) {
      found.push({ start, end, replacement, description, line: lineOf(at) });
    }
    for (const child of children(node)) visit(child);
  };
  visit(parse(source));
  return found;
}

/**
 * The environment of a nested test run: top-level reporting (no NODE_TEST_CONTEXT), no coverage collection of the
 * outer run (mutated code must not count as covered — and NODE_V8_COVERAGE must be set EMPTY: when it is merely
 * absent, child_process re-adds the parent's value), and the hook when there is a mutant. The hook touches `mark`
 * once it compiled the mutant in, so a mutant that never reached the file cannot pass as survived.
 */
function runEnv(mutant, file, mark) {
  const { NODE_TEST_CONTEXT, ...rest } = process.env;
  const env = { ...rest, NODE_V8_COVERAGE: '' };
  if (!mutant) return env;
  return { ...env, NODE_OPTIONS: `${env.NODE_OPTIONS ?? ''} --require "${HOOK}"`, UB_MUTANT: JSON.stringify({ file, mark, ...mutant }) };
}

/**
 * 'killed' | 'survived' — the tests run with the mutant compiled into `file` (its real path: Node compiles modules
 * by realpath, so a symlinked path would never match). A run that times out counts as killed (an endless loop is a
 * fault the tests caught); a run that could not start, or a mutant that was never compiled in, throws.
 */
function run({ file, mutant, tests, timeout = 60_000 }) {
  const target = fs.realpathSync(file);
  const mark = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mutant-')), 'compiled');
  const result = spawnSync(process.execPath, ['--test', ...tests], { cwd: ROOT, stdio: 'ignore', timeout, env: runEnv(mutant, target, mark) });
  if (result.error && result.error.code !== 'ETIMEDOUT') throw result.error;
  if (mutant && !fs.existsSync(mark)) throw new Error(`the mutant was never compiled into ${file} — do the tests load it?`);
  return result.status === 0 ? 'survived' : 'killed';
}

const REQUIRE = /require\(['"](\.[^'"]+)['"]\)/g;

/** The real paths of the files a test's relative `require(…)` calls load (`'./pkg'` → pkg/index.js). */
const requires = (test) => [...fs.readFileSync(test, 'utf8').matchAll(REQUIRE)]
  .map(([, spec]) => fs.realpathSync(require.resolve(path.resolve(path.dirname(test), spec))));

/** The unit tests that require `file`. */
function testsFor(file) {
  const target = fs.realpathSync(file);
  return fs.readdirSync(path.join(ROOT, 'test'), { recursive: true })
    .filter((name) => name.endsWith('.test.js'))
    .map((name) => path.join(ROOT, 'test', name))
    .filter((test) => requires(test).includes(target));
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
  const file = path.resolve(argv[0] ?? '');
  const tests = option(argv, '--tests')?.split(',').map((test) => path.resolve(test)) ?? testsFor(file);
  if (!fs.existsSync(file) || tests.length === 0) {
    console.error(`no unit test requires ${argv[0]} — write one first (cover the uncovered)`);
    return 2;
  }
  if (run({ file, tests }) !== 'survived') {
    console.error('the unit tests fail without any mutant — make them green first');
    return 2;
  }
  const all = inFunction(fs.readFileSync(file, 'utf8'), option(argv, '--fn'));
  const survivors = all.filter((mutant) => run({ file, mutant, tests }) === 'survived');
  for (const m of survivors) console.log(`SURVIVED  ${path.relative(ROOT, file)}:${m.line}  ${m.description}`);
  const killed = all.length - survivors.length;
  console.log(`${all.length} mutant(s): ${killed} killed, ${survivors.length} survived (${score(all.length, survivors.length)} %)`);
  return survivors.length ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { mutants, apply, run, inFunction, score, testsFor, requires, main };
