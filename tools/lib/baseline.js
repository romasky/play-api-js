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

/** Print the comparison (or rewrite the baseline with `update`); the exit code of the gate. */
function gate(file, current, { update = false } = {}) {
  if (update) {
    const sorted = Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`baseline ${path.relative(process.cwd(), file)}: ${Object.keys(sorted).length} accepted offender(s)`);
    return 0;
  }
  const baseline = load(file);
  const { added, worsened, fixed } = compare(current, baseline);
  for (const key of added) console.log(`NEW    ${current[key]}  ${key}`);
  for (const key of worsened) console.log(`WORSE  ${baseline[key]} → ${current[key]}  ${key}`);
  for (const key of fixed) console.log(`FIXED  ${key}  (run with --update to shrink the baseline)`);
  const failed = added.length + worsened.length;
  console.log(failed ? `${failed} offender(s) beyond the baseline` : `OK — no offender beyond the baseline (${Object.keys(baseline).length} accepted)`);
  return failed ? 1 : 0;
}

module.exports = { compare, gate };
