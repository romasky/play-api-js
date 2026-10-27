#!/usr/bin/env node
/**
 * CRAP gate — Change Risk Anti-Patterns per function: complexity² × (1 − coverage)³ + complexity.
 *
 * A function scores under 10 when it is simple, or tested, or both. Coverage comes from the unit tests
 * (`npm run unit` with Node's built-in coverage, never the live-API Cucumber run); a file no unit test loads
 * counts as uncovered. Fails on an offender (CRAP ≥ --max) beyond quality/crap-baseline.json (tools/lib/baseline.js).
 *
 *   node tools/crap.js                    # run the unit tests with coverage, then gate
 *   node tools/crap.js --update           # shrink the baseline (refused while anything is new or worse)
 *   node tools/crap.js --update --accept  # record today's offenders — say why in the commit
 *   node tools/crap.js --lcov <file>      # reuse a coverage report instead of running the tests
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT } = require('./spec');
const { allFunctions } = require('./lib/functions');
const { gate } = require('./lib/baseline');
const { option, flag } = require('./lib/args');

const BASELINE = path.join(ROOT, 'quality', 'crap-baseline.json');

/** file → { lines: line → hits, calls: start line → [calls of each function starting there] } */
function parseLcov(text) {
  const files = new Map();
  let file;
  let starts;
  for (const row of text.split('\n')) {
    if (row.startsWith('SF:')) {
      file = { lines: new Map(), calls: new Map(), fnda: 0 };
      starts = []; // FN start lines; the FNDA rows that follow come in the same order (names may repeat)
      files.set(row.slice(3), file);
    }
    const [, kind, a, b] = /^(DA|FN|FNDA):(\d+|[^,]*),(.*)$/.exec(row) ?? [];
    if (kind === 'DA') file.lines.set(Number(a), Number(b));
    if (kind === 'FN') starts.push(Number(a));
    if (kind === 'FNDA') {
      const start = starts[file.fnda++];
      file.calls.set(start, [...(file.calls.get(start) ?? []), Number(a)]);
    }
  }
  return files;
}

/**
 * Share of the function's instrumented lines that ran (0 when its file was never loaded). A line runs when ANY code
 * on it does, so a function whose start line holds only never-called functions is uncovered whatever DA says —
 * `const f = (a) => …;` runs its line at module load without ever calling f.
 */
function lineCoverage({ start, end }, file) {
  if (file?.calls.get(start)?.every((calls) => calls === 0)) return 0;
  const span = [...(file?.lines ?? [])].filter(([line]) => line >= start && line <= end);
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
  const max = option(argv, '--max', 10, Number);
  const lcovFile = option(argv, '--lcov') ?? measure();
  const rows = offenders(allFunctions(), parseLcov(fs.readFileSync(lcovFile, 'utf8')), max);
  console.log(`\nCRAP ≥ ${max}: ${rows.length} function(s)`);
  for (const row of rows) {
    console.log(`${String(row.crap).padStart(7)}  cc ${String(row.complexity).padStart(2)}  cov ${String(Math.round(row.coverage * 100)).padStart(3)}%  ${row.key}`);
  }
  return gate(BASELINE, Object.fromEntries(rows.map((row) => [row.key, row.crap])), { update: flag(argv, '--update'), accept: flag(argv, '--accept') });
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { parseLcov, lineCoverage, crap, offenders };
