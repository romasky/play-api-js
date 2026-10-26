#!/usr/bin/env node
/**
 * Spec coverage — which Swagger operations did a test run actually call?
 *
 * Every HTTP call is an Allure sub-step named `<METHOD> /api/v1/<path>` (src/http/client.js), so the results
 * directory is the evidence. Each called path is matched against the spec's path templates
 * (`/users/get/{id}` → `/users/get/[^/]+`) from the committed snapshot spec/openapi.json.
 *
 *   node tools/spec-coverage.js                          # reads allure-results/
 *   node tools/spec-coverage.js --min 100                # exit 1 below 100 % (CI report job)
 *   node tools/spec-coverage.js --results <dir>
 */
const fs = require('fs');
const path = require('path');
const { BASE } = require('../src/http/paths');
const { ROOT, METHODS, loadSnapshot, operations } = require('./spec');

const CALL = new RegExp(`^(${METHODS.join('|')}) (${BASE}/\\S*)$`);
const WS = new RegExp(`^WebSocket connect (${BASE}/\\S+)$`); // a WebSocket handshake is its own sub-step (services/realtime.js)

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** { "GET /users/get/{id}": /^\/api\/v1\/users\/get\/[^/]+$/, … } */
const templates = (spec) => Object.fromEntries([...operations(spec)].map(([method, template]) =>
  [`${method} ${template}`, new RegExp(`^${BASE}${escape(template).replace(/\\\{[^}]+\\\}/g, '[^/]+')}$`)]));

/**
 * The ONE operation a call belongs to — the most specific template wins (fewest `{…}`), so `/chaos/redirect/done`
 * counts for `…/done`, not also for `…/{n}`.
 */
function owner(method, callPath, ops) {
  const candidates = Object.entries(ops).filter(([op, rx]) => op.split(' ')[0] === method && rx.test(callPath)).map(([op]) => op);
  return candidates.sort((a, b) => a.split('{').length - b.split('{').length)[0];
}

function* stepNames(node) {
  for (const child of node.steps ?? []) {
    yield child.name ?? '';
    yield* stepNames(child);
  }
}

function called(resultsDir) {
  const calls = new Set();
  for (const file of fs.readdirSync(resultsDir).filter((f) => f.endsWith('-result.json'))) {
    for (const name of stepNames(JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8')))) {
      const call = CALL.exec(name);
      const ws = WS.exec(name);
      if (call) calls.add(`${call[1]} ${call[2].split('?')[0]}`);
      else if (ws) calls.add(`GET ${ws[1]}`);
    }
  }
  return calls;
}

function main() {
  const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
  const resultsDir = arg('--results', path.join(ROOT, 'allure-results'));
  const min = Number(arg('--min', '0'));

  const ops = templates(loadSnapshot());
  const covered = new Set([...called(resultsDir)].map((c) => owner(...c.split(' '), ops)).filter(Boolean));
  for (const op of Object.keys(ops).filter((o) => !covered.has(o)).sort()) console.log('NOT CALLED', op);
  const percent = (100 * covered.size) / Object.keys(ops).length;
  console.log(`${covered.size}/${Object.keys(ops).length} spec operations called (${percent.toFixed(1)} %)`);
  return percent < min ? 1 : 0;
}

process.exit(main());
