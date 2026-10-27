/**
 * Every function of a JS source with its name, 1-based line span and cyclomatic complexity — the shared input
 * of the quality gates (tools/crap.js, tools/dry.js, tools/mutate.js).
 *
 * Complexity = 1 + one per decision point (if, ?:, && || ??, loops, non-default case, catch). A nested function
 * is its own unit: its decisions do not count for its parent.
 */
const acorn = require('acorn');

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

/** The name a reader would give the function, from where it is defined. */
function nameOf(fn, parent, className) {
  if (fn.id) return fn.id.name;
  if (parent?.type === 'VariableDeclarator') return parent.id.name;
  if (parent?.type === 'MethodDefinition') return `${className}.${keyName(parent.key)}`;
  if (parent?.type === 'Property' || parent?.type === 'PropertyDefinition') return keyName(parent.key);
  if (parent?.type === 'AssignmentExpression') return parent.left.property?.name ?? parent.left.name;
  if (parent?.type === 'CallExpression' && parent.arguments[0]?.type === 'Literal') {
    return `${parent.callee.name ?? keyName(parent.callee.property)} '${parent.arguments[0].value}'`;
  }
  return `<anonymous>@${fn.loc.start.line}`;
}

function functions(source) {
  const found = [];
  const visit = (node, parent, owner, className) => {
    let unit = owner;
    if (FUNCTION.has(node.type)) {
      unit = { name: nameOf(node, parent, className), start: node.loc.start.line, end: node.loc.end.line, complexity: 1, node };
      found.push(unit);
    } else if (unit && isDecision(node)) {
      unit.complexity += 1;
    }
    const inClass = node.type === 'ClassDeclaration' || node.type === 'ClassExpression' ? node.id?.name : className;
    for (const child of children(node)) visit(child, node, unit, inClass);
  };
  visit(parse(source), null, null, undefined);
  return found;
}

module.exports = { parse, children, functions };
