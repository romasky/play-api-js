/**
 * The ratchet of the quality gates. The code base predates the gates, so the offenders of the day are recorded in
 * a committed baseline (quality/*.json, `key → score`). A gate fails only on a NEW offender or a known one that got
 * WORSE; an offender that was fixed is reported so `--update` can shrink the file. The baseline only goes down.
 */
const fs = require('fs');
const path = require('path');

/** { added, worsened, fixed } — keys of `current` (offenders now) against `baseline` (offenders accepted). */
function compare(current, baseline) {
  const keys = Object.keys(current);
  return {
    added: keys.filter((key) => !(key in baseline)),
    worsened: keys.filter((key) => key in baseline && current[key] > baseline[key]),
    fixed: Object.keys(baseline).filter((key) => !(key in current)),
  };
}

const load = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});

/** Write the baseline, keys sorted; exit code 0. */
function save(file, current) {
  const sorted = Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`baseline ${path.relative(process.cwd(), file)}: ${Object.keys(sorted).length} accepted offender(s)`);
  return 0;
}

function verdict(failed, accepted, update) {
  if (update) return `refusing to update: ${failed} offender(s) beyond the baseline (fix them, or --accept with a reason in the commit)`;
  return failed ? `${failed} offender(s) beyond the baseline` : `OK — no offender beyond the baseline (${accepted} accepted)`;
}

/**
 * Print the comparison; the exit code of the gate. `update` rewrites the baseline only when that shrinks it (nothing
 * new or worse); `accept` rewrites it regardless — the deliberate, justified exception (a first baseline, an I/O shell).
 */
function gate(file, current, { update = false, accept = false } = {}) {
  if (update && accept) return save(file, current);
  const baseline = load(file);
  const { added, worsened, fixed } = compare(current, baseline);
  const beyond = [
    ...added.map((key) => `NEW    ${current[key]}  ${key}`),
    ...worsened.map((key) => `WORSE  ${baseline[key]} → ${current[key]}  ${key}`),
  ];
  beyond.forEach((line) => console.log(line));
  if (update && beyond.length === 0) return save(file, current);
  fixed.forEach((key) => console.log(`FIXED  ${key}  (run with --update to shrink the baseline)`));
  console.log(verdict(beyond.length, Object.keys(baseline).length, update));
  return beyond.length ? 1 : 0;
}

module.exports = { compare, gate };
