#!/usr/bin/env node
/**
 * Step reference — every Gherkin phrase defined under src/steps/, as Markdown (the wiki's Step Definitions
 * Reference page is generated from this, so it cannot drift from the code).
 *
 *   node tools/step-reference.js > Step-Definitions-Reference.md
 *
 * Grouped by domain folder → file → the `// ─── Section ───` comments the step files already use.
 */
const fs = require('fs');
const path = require('path');

const STEPS = path.resolve(__dirname, '..', 'src', 'steps');
const SECTION = /^\/\/ ─── (.+?) ─+\s*$/;
const STEP = /^(Given|When|Then)\(\s*(?:'((?:[^'\\]|\\.)*)'|\/\^?(.+?)\$?\/)\s*,/;

const escapeCell = (s) => s.replace(/\|/g, '\\|');

function steps(file) {
  const out = [];
  let section = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const heading = SECTION.exec(line.trim());
    if (heading) section = heading[1];
    const step = STEP.exec(line.trim());
    if (step) out.push({ section, keyword: step[1], phrase: step[2] ?? step[3], regex: step[2] === undefined });
  }
  return out;
}

function main() {
  const lines = [
    '# Step Definitions Reference',
    '',
    '> Generated from `src/steps/` by `node tools/step-reference.js` — do not edit by hand.',
    '',
    'Every step is available in every feature file; `Given` / `When` / `Then` / `And` are interchangeable.',
    '`{string}` is a double-quoted argument (`\\"` inside it is an escaped quote), `{int}` an unquoted integer.',
    'A regex phrase (marked *regex*) takes a quoted value that may itself contain quotes.',
    '',
    '**Context resolution.** A `{string}` naming a variable or a value is looked up in the scenario\'s World',
    'first; when no such key exists the literal text is used. Raw bodies, raw `Authorization` values and query',
    'strings interpolate `${key}` placeholders (an unknown key fails the step). See [Scenario Context](Scenario-Context).',
    '',
  ];
  let total = 0;
  for (const domain of fs.readdirSync(STEPS).sort()) {
    const dir = path.join(STEPS, domain);
    if (!fs.statSync(dir).isDirectory()) continue;
    lines.push(`## ${domain}`, '');
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
      const defs = steps(path.join(dir, file));
      total += defs.length;
      lines.push(`### \`${domain}/${file}\``, '');
      let current;
      for (const def of defs) {
        if (def.section !== current) {
          current = def.section;
          if (current) lines.push('', `**${current}**`, '');
          lines.push('| Keyword | Phrase |', '|---|---|');
        }
        const phrase = escapeCell(def.phrase.replace(/\\'/g, "'"));
        lines.push(`| ${def.keyword} | \`${phrase}\`${def.regex ? ' *(regex)*' : ''} |`);
      }
      lines.push('');
    }
  }
  lines.splice(4, 0, `**${total} step phrases.**`, '');
  console.log(lines.join('\n'));
}

main();
