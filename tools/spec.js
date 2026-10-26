/** Shared Swagger plumbing for tools/spec-drift.js and tools/spec-coverage.js. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(ROOT, 'spec', 'openapi.json');
const METHODS = ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'];

const loadSnapshot = () => JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));

/** [METHOD, path template, operation object] for every operation of the spec. */
function* operations(spec) {
  for (const [template, item] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(item)) {
      if (METHODS.includes(method.toUpperCase())) yield [method.toUpperCase(), template, operation];
    }
  }
}

module.exports = { ROOT, SNAPSHOT, METHODS, loadSnapshot, operations };
