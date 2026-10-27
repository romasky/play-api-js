---
name: ub-mode
description: >
  Disciplined change workflow for play-api-js, adapted from Uncle Bob's ub-mode: every change goes First Make it
  Work, Then Make it Right, then Practice, with the work routed to the ub-* agents and checked by the repo's
  quality gates (npm run unit, gate:crap, gate:dry, gate:mutate). Use when the user runs /ub-mode or asks for a
  change "in ub-mode" / "the disciplined way".
---

# ub-mode for play-api-js

Adapted from [unclebob/ub-mode](https://github.com/unclebob/ub-mode) (itself reduced from @poteto's rules). The
principle headings are his; the wording and every repo-specific rule below are ours. The Clojure gates
(crapper, dryer, mutator) are replaced by `tools/crap.js`, `tools/dry.js` and `tools/mutate.js`.

**This file is the single source of the rules.** The agents in `.claude/agents/` carry only their role, procedure
and return format, and refer here by section name (for example "§ Make Operations Idempotent").

Every requested change runs the same three stages, in order:

1. **First Make it Work.** Write a failing check, then the smallest change that passes it.
2. **Then Make it Right.** Run the gates and refactor while the checks stay green.
3. **Practice.** Keep a log, keep the main thread small, and make small commits that state their proof.

## Who does what

You (the main thread) orchestrate and never do the bulk work yourself. Delegate it, keep the summaries, and
commit.

| Work | Agent | Hand it |
|---|---|---|
| A new or changed API behavior (feature, steps, service, contract, builder) | `ub-scenario-author` | the operation / behavior, the feature file, what "done" looks like |
| Framework code: pure `src/` modules (utils, assertions, contracts, builders, http helpers) or `tools/` | `ub-unit-tdd` | the module, the behavior to add or the bug to reproduce |
| Gates after either of the above, or paying down `quality/*-baseline.json` | `ub-gatekeeper` | the files touched, or "top N offenders" |
| Before every commit, and before a merge | `ub-reviewer` | `--staged` plus the proposed commit message, or a branch range `<base>...<head>` |

Agents cannot start agents. When one reports work for another agent, you start that agent.

**Run agents one at a time in this checkout.** Every one of them writes shared outputs:
- `gate:crap` writes `reports/lcov.info`;
- `test:dry` and every cucumber run write `reports/cucumber-report.*` and `allure-results/`, because the profile's formats always apply;
- live calls share per-IP rate limits (`src/http/throttle.js`).

**Parallel work needs separate git worktrees** (Agent `isolation: "worktree"`). Even then it must be offline only, because live calls from any worktree share one IP. A new worktree has no `node_modules`, so run `npm ci` there first. Without it, `npm run scenario` reports the spawn error.

## Commands

| Command | What it proves | Speed |
|---|---|---|
| `npm run test:dry` | every Gherkin step is defined once, with no undefined or ambiguous steps | seconds, offline |
| `npm run unit` | `node:test` behavior tests under `test/` | seconds, offline |
| `npm run gate:crap` | no function beyond `quality/crap-baseline.json` at CRAP ≥ 10 (complexity² × (1−cov)³ + complexity). Runs the unit tests first. | seconds, offline |
| `npm run gate:dry` | no function pair beyond `quality/dry-baseline.json` at structural similarity ≥ 0.8 (60+ tokens) | < 1 s, offline |
| `npm run gate:mutate -- <file> [--fn <name>]` | the unit tests notice faults in that file. Needs a unit test that requires the file. | ~0.2 s per mutant, offline |
| `npm run scenario -- "<scenario title>" [--dry]` | **one** scenario against the live API (an Outline title, `<placeholders>` included, runs every row). `--dry` only counts. | live, rate-limited |

**Running one live scenario: always `npm run scenario`** (`tools/scenario.js`). The plain cucumber commands lie:
- `npx cucumber-js <feature>:<line>` *adds* the line to the profile's `paths`, so it runs every other feature's scenarios against the live API as well.
- `--name` is a regex matched with Outline placeholders filled in. Titles with `( ) + ?`, and Outline titles, silently match nothing, and **0 scenarios exits 0**.
- The tool escapes the title, dry-runs first, and refuses a 0 match.
- Scenario titles are unique across the suite. Keep them unique.

The profile tag filter (`@Run and not @Ignore and not @Bug and not @NotImplemented`) applies to every run. A scenario without `@Run`, or with `@Bug`, cannot be selected, and `--tags` ANDs with the filter instead of bypassing it.

**The baselines are a ratchet.**
- A gate fails only on a **new** offender or a **worse** one.
- A FIXED line means you should shrink the baseline with `--update`. The tool refuses `--update` while anything is new or worse.
- `--update --accept` records offenders on purpose. Use it only for a first baseline or an I/O shell that cannot be tested honestly, and state the reason in the commit message.

# First Make it Work

## Laziness Protocol
- Each decision has one owner:
  - endpoints live in `src/http/paths.js`;
  - rate limits live in the `BUCKETS` table in `src/http/throttle.js`;
  - within `src/`, `src/config/config.js` is the only reader of `process.env`;
  - `src/http/client.js` is the only HTTP choke point;
  - `src/http/attach.js` is the only path to Allure *attachments*. Allure `step()` is opened in `client.js`, plus the WebSocket steps (connect, receive, echo) in `services/realtime.js`.
- Make the smallest edit that solves the problem. Reuse an existing step phrase before you write a new one (`npm run docs:steps`).

## Foundational Thinking
- Once the failing check exists, get the data shape right first: the response schema in `src/contracts/<domain>.js` and the request builder in `src/builders/`, then the step logic.
- Do first whatever helps every later step, for example a missing path constant or a shared assertion.
- Do not share state that a concurrent writer could touch.

## TDD
- **Scenarios.** Write the scenario first, before any contract, builder, path, service or step. Then:
  1. **Dry run.**
     - If every phrase is reused, `npm run test:dry` must pass.
     - If a new phrase is genuinely needed, it, and only it, shows as *undefined*. Never invent a phrase just to get a red dry run.
  2. **When the first live check runs.**
     - With every phrase reused, run it **right after the dry run**, before any contract, builder or path change. Make such a change only when the check shows it is needed (for example, a 2xx body with no registered contract), then re-run the check live.
     - With a new phrase, the data shape is the first implementation slice (§ Foundational Thinking). Then comes the glue, then the live check.
  3. **Behavioral red.** An undefined step proves only that glue is missing. The red that counts is the live run (`npm run scenario`) failing **for the reason you expect**: the assertion on a status or field, not a TypeError or an undefined step. Such a red is real when the API has a defect (§ Fix Root Causes) or a contract or builder does not match yet.
  4. **Whenever the first live run is green,** which is common because this suite tests an existing API, prove the scenario's assertions bite:
     - change the expected value of each assertion that decides the outcome, one at a time (for a negative scenario, both the status and the error code), for example `201` → `200`;
     - check that the failure message names the wrong value;
     - restore it.
     The green that counts is the run after the restore.
- **Framework code.** Write a failing `node:test` test in `test/<same path>.test.js`, watch it fail for the expected reason, then make the smallest change that passes.
- **Existing code.** When you test code that already exists, the tests pin current behavior and are green from the start. `gate:mutate` is their proof that they actually detect faults.
- If an honest test is impractical, for example an I/O shell or live-only behavior, do not write a bad test. Say so instead.

## Redesign From First Principles
- Do not bolt a requirement onto the old shape. Ask how the step, service or contract would look if the requirement had always been there, then deliver that in verifiable pieces.

## Attack the Premise
- When two fixes with the same premise fail the same gate or scenario, write that premise in one sentence. Then find which part holds the imbalance, for example the step layer doing the service's job. Remove that misplaced responsibility before you try a third fix.

## Subtract Before You Add
- Remove complexity first: dead steps, unused exports, an optimization that buys nothing.

## Outcome-Oriented Execution
- Aim at an end state you can check: a green scenario, a passing gate, or a shrunk baseline.
- Breaking things in the middle is fine only when you planned it and can undo it.

## Build the Lever
- If the work is not obvious at a glance, build a tool for it under `tools/`, like `spec-drift`, `spec-coverage` or the gates.
- Do one unit by hand first, then make the tool reproduce that unit.

## Architecture

### Layers
Calls go one way: feature → step (`src/steps/<domain>`) → service (`src/services/<domain>.js`) → `src/http/client.js`.

- **Steps** are thin function-style definitions on the World:
  - they resolve context keys (`this.str`, `this.opt`, `this.render`, `this.query`, `this.bearer`);
  - they call builders and services, and save responses (`this.save`), with sections under `// ─── Section ───` comments;
  - they never import axios, call `request()`, or use `paths`. Importing the helpers `rawBody` and `timed` from the client is fine.
- **Services** are thin: plain values in, raw response out. They never see the World.
  - Most are one line per operation: `(…) => request(METHOD, paths.X, { json | params | headers })`.
  - `services/realtime.js`, the WebSocket/SSE I/O shell, is the known exception.
- **Logic** beyond a line lives in pure functions in `src/assertions/` or `src/utils/`, or in a tool's core, and gets unit tests.

### Model the Domain
- Encode the domain where an illegal state cannot be expressed:
  - the client checks every 2xx body that has a registered contract (`CONTRACTS_2XX`);
  - builders only emit valid bodies, and scenarios override single fields through context keys.
- Domain terms such as epic, bucket, contract, context key and quota go in the README Tag Reference and Configuration sections, so they keep one meaning.
- If the code is already clear and local, leave it alone.

### Boundary Discipline
- Check data where it enters:
  - registered contracts check 2xx bodies;
  - `World.res()` and `World.render()` fail loudly on a missing key;
  - config is parsed once.
- Once data is inside, trust it.
- Keep the logic in pure functions. Steps, services and `main()` stay thin shells.

### Type System Discipline (JS edition)
- Make a wrong value impossible to write:
  - write contracts with the `src/contracts/schema.js` vocabulary;
  - keep them strict on types (an integer rejects `"900"`, a boolean rejects `"true"`) and open to extra fields, so the API may add fields;
  - use builders instead of hand-written bodies.
- Do not silence failures:
  - no `catch` that swallows an error;
  - no `?? {}` or `|| []` that hides missing data;
  - never weaken the failed-vs-broken classification in `src/support/hooks.js`.

### Make Operations Idempotent
- A scenario run twice, or rerun after a crash, must end in the same state:
  - generate unique data (the `Generate … and save as` steps, `src/utils/generator.js`) and never use fixed emails, usernames or IDs;
  - register deletion of anything that counts against a per-IP quota (webhook inboxes, uploads, sessions) with `saveCreated(world, key, create, cleanup)` (`src/support/cleanup.js`) or `this.defer(fn)`, so it is cleaned up even when the scenario fails.

### Separate Before Serializing Shared State
- Per-scenario state lives on the World, which Cucumber builds fresh for every scenario.
- Run-wide state is limited to `support/session.js` and the throttle's `lastCall`. Each has exactly one writer and depends on `parallel: 1`, and the CI matrix provides the scaling. Do not add more module-level mutable state.

## Scenario Conventions
- Feature files are `features/play_qa_api/<Thing>Tests.feature`. The names are shared with the Java and Python ports, so never rename one.
- **Tags:**
  - `@Run`, plus `@Positive`/`@Negative`/`@Flow`, plus `@allure.label.story:Positive_Scenario` or `Negative_Scenario`;
  - `@Smoke` plus `@allure.label.severity:critical` only for the critical path;
  - the feature's `@allure.label.epic:X` must appear in the CI matrix (`.github/workflows/test.yml`).
- **Titles** state the outcome (`… returns 201`, `… returns 401 MISSING_TOKEN`) and are unique across the suite, because `npm run scenario` selects by title.
- **Negative scenarios** assert the status **and** `Assert error code is "<CODE>" in response "<key>"`.
- **Layout:** follow the section dividers of the file you edit, if it has any. Use `Scenario Outline` with `Examples:` for data variants.
- **Context keys:** data passes through them (`save as "x"`, then `"x"`). A literal that is also an existing key resolves to that key's value, so pick literals that cannot collide.

# Then Make it Right

## Fix Root Causes
- Reproduce the problem first: a unit test, or one live scenario.
- Fix the cause. A guard that only hides the crash is not a fix.
- When the API itself is wrong:
  1. Keep the correct expectation.
  2. Record the red live run, which is your proof.
  3. Then tag the scenario `@Bug`, with a comment above it naming the defect and the observed response.
  4. Never weaken the assertion to match the bug.
- A `@Bug` scenario cannot be selected while it carries the tag (see § Commands). To recheck it later, remove the tag first.

## Sequence Work into Verifiable Units
- Finish one small unit, prove it with its command from § Commands, then start the next.

## Test Behavior, Not Implementation
- Call the code the way its user does (a step, another module, a CLI `main`) and check what that user would see: the value, or the failure message in the report.
- If a test would still pass when every function returned nothing, throw it out. `gate:mutate` is how you check that.
- For time and randomness (`generator.js`, `jwtTools.js`, `webhookSign.js`), assert shapes and invariants, or use `node:test`'s `mock.timers`. Never assert one random value.
- Do not export test-only hooks from production modules.

## CRAP (`npm run gate:crap`)
- Get each function under 10 by splitting it, testing it, or both.
- A `switch` or an if-chain that dispatches on a type usually becomes a lookup table. See `NAMED_BY_PARENT` in `tools/lib/functions.js` and `MUTATIONS` in `tools/mutate.js`.
- Coverage comes from the unit tests only, never the live run. A file that no unit test loads counts as uncovered.

## Duplication (`npm run gate:dry`)
- Remove pairs at or above 0.8 by moving the shared logic to the module that owns it:
  - assertions to `src/assertions/`;
  - request bodies to `src/builders/`;
  - World plumbing to `src/support/`.
- Keep a step phrase unchanged when its body moves.
- Three-line steps that look alike are normal Cucumber style. The 60-token minimum already ignores them.

## Mutation (`npm run gate:mutate -- <file>`)
- Cover what is uncovered.
- Kill the survivors.
- Delete dead code.
- Report equivalent mutants with a reason instead of contorting a test around them. The known kinds are:
  - a `return []` that a caller normalizes;
  - `??` → `&&` where the left side is never nullish;
  - mutants in an untested `main()` shell, which are untested code, not equivalent mutants. Say which they are.
- "No unit test requires <file>" is not a gate failure. For new behavior it is a missing test, so write one. For untouched legacy code it is backlog.

## Refactoring
- **Pin** the current behavior with unit tests, or with the scenarios that use the step you are changing (`npm run scenario`, one at a time).
- **Change** the structure.
- **Prove** nothing changed: the same tests are green, plus `npm run test:dry` and the gates.

# Practice

## Keep a Log
- Record every action you take and the reason for it, in the conversation or in `reports/ub-log.md` (git-ignored).
- Report the log when the work is done. Every agent returns its own log, and you merge them.

## Guard the Context Window
- Keep the main thread small. Delegate exploration, live runs and gate triage to agents, and keep their summaries.

## Worktree Cleanup
- Find what is safe to remove: stale `reports/` and `allure-results/`, and worktrees of merged branches. Check that nothing still uses it, then delete it.
- Uncommitted work waits for the user's decision.

## Commit and Push
- Commit often, in small ordered commits, on a feature branch, never on `main`.
- Each message gives **Why**, **What changed**, and **Proof** (the commands that were run and their result). Write the proof only once it exists.
- Run `ub-reviewer` before you commit.
- Push only when the user asks. This is a deliberate departure from upstream ub-mode, which pushes to the main line at the end.
