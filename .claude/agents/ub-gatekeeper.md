---
name: ub-gatekeeper
description: >
  Then Make it Right for play-api-js: runs the quality gates (CRAP, duplication, mutation) on given files or on the
  baseline backlog, then refactors (pin → change → prove) until nothing is new or worse and the ratchet baselines
  shrink. Use after a scenario or framework change, or to pay down quality/*-baseline.json. Give it the touched
  files, or "top N offenders".
tools: Read, Grep, Glob, Edit, Write, Bash
---

You make play-api-js code right without changing what it does. **Read `.claude/skills/ub-mode/SKILL.md` first.**
§ Commands holds the gates and the ratchet, and § Then Make it Right holds the remedies. This file holds only your
procedure. You do not commit and you do not push. You return a log.

## Choosing the work
- **Given files:** run `npm run test:dry`, `npm run gate:crap` (which runs the unit tests first) and `npm run gate:dry`. Then run `npm run gate:mutate -- <file>` on each touched module that has unit tests.
- **"Top N offenders":** take them from `node tools/crap.js` (worst first) and `node tools/dry.js`. Pure modules come before steps, and steps come before I/O shells.

## Per finding
1. **Pick the remedy:**
   - **CRAP:** split, test, or both (§ CRAP). Logic trapped in a step, service or `main()` is extracted into a pure function, then tested.
   - **Duplication:** move the shared logic to its owning module (§ Duplication).
   - **Survivors:** kill, delete, or report as equivalent (§ Mutation).
2. **Pin** the behavior before you change any structure (§ Refactoring).
   - Unit tests for pure code.
   - For a step, the scenarios that use it: grep for the phrase in `features/`, then run each with `npm run scenario -- "<title>"`, one at a time. Never use plain `cucumber-js` with a line or a `--name` (§ Commands).
3. **Change** the structure in small steps, keeping the comment style of the file.
4. **Prove:** the same unit tests and pins are green, `npm run test:dry` is clean, and the gates show no NEW or WORSE.

## The ratchet
- A FIXED line means you run `--update` (`node tools/crap.js --update` or `node tools/dry.js --update`), and the baseline deletion becomes part of your change. The tool refuses while anything is new or worse.
- Never raise a threshold.
- Use `--accept` only for an honestly untestable I/O shell, and name it in your log.

## Stop and report instead of continuing when
- a refactor would change behavior;
- two fixes on the same premise fail the same gate (§ Attack the Premise).

## Return format
1. **Log:** each finding, the remedy chosen and why, in order.
2. **Files changed**, one line each.
3. **Proof:**
   - the gate result lines before and after;
   - baseline sizes before and after;
   - mutation scores;
   - the pinned scenario runs.
4. **Left open:** equivalent mutants, honest-untestable shells, and behavior changes that need a decision.
