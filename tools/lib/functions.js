/**
 * Every function of a JS source with its name, 1-based line span and cyclomatic complexity — the shared input
 * of the quality gates (tools/crap.js, tools/dry.js, tools/mutate.js).
 *
 * Complexity = 1 + one per decision point (if, ?:, && || ??, loops, non-default case, catch). A nested function
 * is its own unit: its decisions do not count for its parent.
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const { ROOT } = require('../spec');

/** The code the gates judge: every .js under src/ and tools/, repo-relative. */
const sourceFiles = () => ['src', 'tools']
  .flatMap((dir) => fs.readdirSync(path.join(ROOT, dir), { recursive: true }).map((file) => path.join(dir, file)))
  .filter((file) => file.endsWith('.js'))
  .sort();

const PARSE = { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true, locations: true };
const FUNCTION = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const DECISION = new Set([
  'IfStatement', 'ConditionalExpression', 'LogicalExpression', 'CatchClause',
  'ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement',
]);

const parse = (source) => acorn.parse(source, PARSE);

const isDecision = (node) => DECISION.has(node.type) || (node.type === 'SwitchCase' && node.test !== null);

/** The AST children of a node, in source order. */
function* children(node) {
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc') continue;
    for (const child of [value].flat()) if (typeof child?.type === 'string') yield child;
  }
}

const keyName = (key) => key?.name ?? key?.value;

/** How the parent of a function expression names it: `const x =`, a method, a property, `a.x =`, `Given('…',`. */
const NAMED_BY_PARENT = {
  VariableDeclarator: (parent) => parent.id.name,
  MethodDefinition: (parent, className) => `${className}.${keyName(parent.key)}`,
  Property: (parent) => keyName(parent.key),
  PropertyDefinition: (parent) => keyName(parent.key),
  AssignmentExpression: (parent) => keyName(parent.left.property ?? parent.left),
  CallExpression: ({ callee, arguments: [first] }) =>
    (first?.type === 'Literal' ? `${keyName(callee.property ?? callee)} '${first.value}'` : undefined),
};

const TOP = '<top>';

/**
 * The name a reader would give the function, from where it is defined, prefixed by its owner when nested
 * (`request>attach`). An anonymous one is `<owner>>λ<n>`, the n-th anonymous function directly inside its owner.
 * Neither depends on line numbers or on functions elsewhere in the file, so baselines can key on them.
 */
function nameOf(fn, parent, className, owner) {
  const name = fn.id?.name ?? NAMED_BY_PARENT[parent.type]?.(parent, className);
  if (!name) owner.anonymous += 1;
  const local = name ?? `λ${owner.anonymous}`;
  return owner.name === TOP && name ? local : `${owner.name}>${local}`;
}

function functions(source) {
  const found = [];
  const top = { name: TOP, anonymous: 0 };
  const visit = (node, parent, owner, className) => {
    let unit = owner;
    if (FUNCTION.has(node.type)) {
      const name = nameOf(node, parent, className, owner);
      unit = { name, start: node.loc.start.line, end: node.loc.end.line, complexity: 1, anonymous: 0, node };
      found.push(unit);
    } else if (unit !== top && isDecision(node)) {
      unit.complexity += 1;
    }
    const inClass = node.type === 'ClassDeclaration' || node.type === 'ClassExpression' ? node.id?.name : className;
    for (const child of children(node)) visit(child, node, unit, inClass);
  };
  visit(parse(source), null, top, undefined);
  return distinct(found);
}

/** A true clash in one owner (a getter and its setter) becomes `name#2`, `name#3` — gate keys must never merge. */
function distinct(fns) {
  const seen = new Map();
  for (const fn of fns) {
    const count = (seen.get(fn.name) ?? 0) + 1;
    seen.set(fn.name, count);
    if (count > 1) fn.name = `${fn.name}#${count}`;
  }
  return fns;
}

/** functions() of every source file, each tagged with its `file` and that file's `source`. */
const allFunctions = () => sourceFiles().flatMap((file) => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return functions(source).map((fn) => ({ file, source, ...fn }));
});

module.exports = { parse, children, functions, sourceFiles, allFunctions };
