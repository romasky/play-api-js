#!/usr/bin/env node
/**
 * Run ONE scenario (or every row of one Outline) against the live API, by its title — safely.
 *
 * Two cucumber-js traps make the obvious commands lie:
 * - `cucumber-js <feature>:<line>` ADDS the line to the profile's `paths` (cucumber.js), so it runs almost the
 *   whole suite against the live API;
 * - `--name` is a regex matched against the name with Outline placeholders filled in, so a title with ( ) + . ?
 *   or a <placeholder> silently matches nothing — and a run of 0 scenarios exits 0, i.e. reads as green.
 * This tool escapes the title, turns each <placeholder> into a wildcard, dry-runs first and refuses 0 matches.
 *
 *   node tools/scenario.js "Get user with non-existent ID returns 404"
 *   node tools/scenario.js "Events with page=<page> returns 400 VALIDATION_ERROR"   # every row of the Outline
 *   node tools/scenario.js "<title>" --dry                                          # count only, no live call
 */
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT } = require('./spec');
const { flag } = require('./lib/args');

const CUCUMBER = path.join(ROOT, 'node_modules', '.bin', 'cucumber-js');
const PLACEHOLDER = /<[^<>]+>/g;

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The --name regex selecting exactly this title; each Outline <placeholder> matches the value filled in. */
const namePattern = (title) => `^${title.split(PLACEHOLDER).map(escape).join('.+?')}$`;

/** Scenarios selected, from the summary formatter's "N scenario(s)" line. */
const scenarioCount = (summary) => Number(/^(\d+) scenarios?\b/m.exec(summary)?.[1] ?? 0);

/** cucumber-js with these args: the dry run is captured (to count), the live run streams to the terminal. */
const cucumber = (args) => spawnSync(CUCUMBER, args, { cwd: ROOT, encoding: 'utf8', stdio: args.includes('--dry-run') ? 'pipe' : 'inherit' });

/** `run` is the cucumber-js runner — injectable, so the decisions here are tested without the live API. */
function main(argv, run = cucumber) {
  const [title] = argv;
  if (!title) {
    console.error('usage: node tools/scenario.js "<scenario title>" [--dry]');
    return 2;
  }
  const name = namePattern(title);
  const count = scenarioCount(run(['--dry-run', '--format', 'summary', '--name', name]).stdout);
  if (count === 0) {
    console.error(`no scenario matches "${title}" — check the title; a missing @Run, or a @Bug / @Ignore / @NotImplemented tag, also hides it`);
    return 2;
  }
  console.log(`${count} scenario(s) match ${name}`);
  if (flag(argv, '--dry')) return 0;
  return run(['--name', name]).status ?? 1;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { namePattern, scenarioCount, main };
