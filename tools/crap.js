#!/usr/bin/env node
/**
 * CRAP gate — Change Risk Anti-Patterns per function: complexity² × (1 − coverage)³ + complexity.
 *
 * A function scores under 10 when it is simple, or tested, or both. Coverage comes from the unit tests
 * (`npm run unit` with Node's built-in coverage, never the live-API Cucumber run); a file no unit test loads
 * counts as uncovered. Fails on an offender (CRAP ≥ --max) beyond quality/crap-baseline.json (tools/lib/baseline.js).
 *
 *   node tools/crap.js                    # run the unit tests with coverage, then gate
 *   node tools/crap.js --update           # accept today's offenders as the baseline
 *   node tools/crap.js --lcov <file>      # reuse a coverage report instead of running the tests
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT } = require('./spec');
const { allFunctions } = require('./lib/functions');
const { gate } = require('./lib/baseline');

const BASELINE = path.join(ROOT, 'quality', 'crap-baseline.json');

/** file → (line → hits) */
function parseLcov(text) {
  const files = new Map();
  let lines;
  for (const row of text.split('\n')) {
    if (row.startsWith('SF:')) files.set(row.slice(3), (lines = new Map()));
    const da = /^DA:(\d+),(\d+)/.exec(row);
    if (da) lines.set(Number(da[1]), Number(da[2]));
  }
  return files;
}

/** Share of the function's instrumented lines that ran (0 when its file was never loaded). */
function lineCoverage({ start, end }, lines) {
  const span = [...(lines ?? [])].filter(([line]) => line >= start && line <= end);
  return span.length === 0 ? 0 : span.filter(([, hits]) => hits > 0).length / span.length;
}

const crap = (complexity, coverage) => complexity ** 2 * (1 - coverage) ** 3 + complexity;

const round = (n) => Math.round(n * 10) / 10;

/** Functions scoring ≥ max as { key, complexity, coverage, crap }, worst first. */
function offenders(fns, lcov, max) {
  return fns
    .map((fn) => {
      const coverage = lineCoverage(fn, lcov.get(fn.file));
      return { key: `${fn.file}::${fn.name}`, complexity: fn.complexity, coverage: round(coverage), crap: round(crap(fn.complexity, coverage)) };
    })
    .filter((row) => row.crap >= max)
    .sort((a, b) => b.crap - a.crap);
}

/** Run the unit tests with coverage into reports/lcov.info; exits when a test fails (no gate on red tests). */
function measure() {
  const lcovFile = path.join(ROOT, 'reports', 'lcov.info');
  fs.mkdirSync(path.dirname(lcovFile), { recursive: true });
  const run = spawnSync(process.execPath, [
    '--test', '--experimental-test-coverage',
    '--test-reporter=lcov', `--test-reporter-destination=${lcovFile}`,
    '--test-reporter=dot', '--test-reporter-destination=stdout',
    'test/**/*.test.js',
  ], { cwd: ROOT, stdio: 'inherit' });
  if (run.status !== 0) process.exit(run.status ?? 1);
  return lcovFile;
}

function main(argv) {
  const arg = (name) => argv[argv.indexOf(name) + 1];
  const max = argv.includes('--max') ? Number(arg('--max')) : 10;
  const lcovFile = argv.includes('--lcov') ? arg('--lcov') : measure();
  const rows = offenders(allFunctions(), parseLcov(fs.readFileSync(lcovFile, 'utf8')), max);
  console.log(`\nCRAP ≥ ${max}: ${rows.length} function(s)`);
  for (const row of rows) {
    console.log(`${String(row.crap).padStart(7)}  cc ${String(row.complexity).padStart(2)}  cov ${String(Math.round(row.coverage * 100)).padStart(3)}%  ${row.key}`);
  }
  return gate(BASELINE, Object.fromEntries(rows.map((row) => [row.key, row.crap])), { update: argv.includes('--update') });
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { parseLcov, lineCoverage, crap, offenders };
