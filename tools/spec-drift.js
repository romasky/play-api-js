#!/usr/bin/env node
/**
 * Swagger drift check — compares the LIVE OpenAPI spec with the committed snapshot spec/openapi.json.
 *
 * The suite's expectations were derived from the snapshot; when the API team changes the spec (e.g. 2026-10-23:
 * `403` added to PUT/PATCH/DELETE/logout), this fails with the exact operations and response codes that moved,
 * instead of three scenarios failing in the nightly run.
 *
 *   node tools/spec-drift.js            # exit 1 on drift
 *   node tools/spec-drift.js --update   # accept the live spec as the new snapshot
 *
 * Then update features / contracts for every reported line.
 */
const fs = require('fs');
const path = require('path');
const config = require('../src/config/config');
const { ROOT, SNAPSHOT, loadSnapshot, operations } = require('./spec');

// Swagger is served next to the API, not under /api/v1 — fetched directly (tooling, not a test: no Allure step)
const SPEC_PATH = '/swagger/doc.json';

/** { "GET /users/get/{id}": Set {"200", "401", "404", "500"}, … } */
const responseCodes = (spec) =>
  Object.fromEntries([...operations(spec)].map(([method, template, op]) => [`${method} ${template}`, new Set(Object.keys(op.responses ?? {}))]));

function diff(old, live) {
  const lines = [];
  for (const op of Object.keys(live).filter((k) => !(k in old)).sort()) lines.push(`+ ${op}  (new operation: ${[...live[op]].sort().join(', ')})`);
  for (const op of Object.keys(old).filter((k) => !(k in live)).sort()) lines.push(`- ${op}  (operation removed)`);
  for (const op of Object.keys(old).filter((k) => k in live).sort()) {
    const added = [...live[op]].filter((c) => !old[op].has(c)).sort().map((c) => `+${c}`);
    const removed = [...old[op]].filter((c) => !live[op].has(c)).sort().map((c) => `-${c}`);
    if (added.length || removed.length) lines.push(`~ ${op}  responses ${[...added, ...removed].join(' ')}`);
  }
  return lines;
}

async function main() {
  const res = await fetch(config.baseUrl.replace(/\/$/, '') + SPEC_PATH, { signal: AbortSignal.timeout(config.requestTimeout) });
  if (!res.ok) throw new Error(`GET ${SPEC_PATH} answered ${res.status}`);
  const live = await res.json();
  const relative = path.relative(ROOT, SNAPSHOT);

  if (process.argv.includes('--update')) {
    fs.writeFileSync(SNAPSHOT, `${JSON.stringify(live, null, 2)}\n`);
    console.log(`snapshot updated: ${relative} (${Object.keys(responseCodes(live)).length} operations)`);
    return 0;
  }

  const changes = diff(responseCodes(loadSnapshot()), responseCodes(live));
  changes.forEach((line) => console.log(line));
  console.log(changes.length ? `${changes.length} change(s) vs ${relative}` : 'OK — live spec matches snapshot');
  return changes.length ? 1 : 0;
}

main().then((code) => process.exit(code), (err) => { console.error(err.message); process.exit(2); });
