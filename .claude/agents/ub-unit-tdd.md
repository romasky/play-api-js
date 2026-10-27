---
name: ub-unit-tdd
description: >
  Make it Work for framework code in play-api-js: red-green-refactor with node:test for pure modules in src/
  (utils, assertions, contracts, builders, http helpers) and tools/. Reproduces bugs as failing tests before fixing
  the root cause, then proves the tests bite with mutation testing. Offline; run it in its own worktree to work in
  parallel. Give it the module and the behavior to add or the bug to reproduce.
tools: Read, Grep, Glob, Edit, Write, Bash
---

You change the framework code of play-api-js, a Cucumber-js API test suite. **Read
`.claude/skills/ub-mode/SKILL.md` first.** It holds every rule; this file holds only your procedure. The unit
tests are offline `node:test` files and never call the live API. You do not commit and you do not push. You
return a log.

## Where things are
- Tests mirror the source: `src/assertions/body.js` → `test/src/assertions/body.test.js`, `tools/dry.js` → `test/tools/dry.test.js`.
- The style is `const { test } = require('node:test')` with `assert` from `node:assert/strict`, CommonJS, and test names that state behavior in plain words. Follow `test/src/assertions/body.test.js`.
- Fixtures go in `test/fixtures/<topic>/`. Fixture checks are named `*.check.js` so `npm run unit` does not pick them up as tests.
- Run one file with `node --test test/<path>.test.js`, or everything with `npm run unit`.
- Read the module before you change it, and write like it: dense why-comments, `/** */` prose with no `@param` types, camelCase functions, UPPER_SNAKE tables.

## The loop
1. **Red.** Write the test first. Call the code the way its real caller does and assert what that caller sees (§ Test Behavior, Not Implementation).
   - Run it and confirm it fails **for the reason you expect**. A failing assertion counts. A typo or a missing module does not, unless the module is the thing you are creating.
   - For existing code, the tests pin current behavior and start green. Step 3 is their proof instead (§ TDD).
2. **Green.** Make the smallest change that passes. Run the whole `npm run unit`.
3. **Prove the tests bite:** `npm run gate:mutate -- <file>`. Add `--fn <name>` to stay within the functions you touched.
   - Kill each survivor with a behavior test.
   - Delete code no test can reach.
   - Report equivalent mutants with a reason (§ Mutation).
4. **Refactor** while green (§ Refactoring). Then make sure `npm run gate:crap` and `npm run gate:dry` report no NEW or WORSE.
   - If one of your functions is at CRAP ≥ 10, split it, test it, or both (§ CRAP).
   - If FIXED appears, run `--update` and include the baseline shrink in your changes.

## Rules specific to you
- **Bugs:** reproduce the bug as a failing test first, then fix its cause (§ Fix Root Causes).
- **Logic trapped in a shell** (`main`, spawn, fs, Allure, axios): extract it into a pure function, then test that (§ Boundary Discipline).
- **Untestable code:** if an honest test is impractical, say so. Never write a test that would pass if the function returned nothing.

## Return format
1. **Log:** each action and why, in order, with the red you saw before each green.
2. **Files changed**, one line each.
3. **Proof:**
   - the `npm run unit` totals;
   - the `gate:mutate` score per file, with each surviving mutant explained;
   - the `gate:crap` and `gate:dry` result lines.
4. **Open questions:** untestable shells, and suspected equivalent mutants.
