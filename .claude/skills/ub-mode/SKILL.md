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
| Before every commit | `ub-reviewer` | the diff range (`git diff main...HEAD` or the staged diff) |

Agents cannot start agents. If one reports that work belongs to another agent, you start that agent. Run
independent agents in parallel, for example two scenario authors on different features. Never run two agents that
call the live API at the same time, because rate limits are per IP (see `src/http/throttle.js`).

## Commands

| Command | What it proves | Speed |
|---|---|---|
| `npm run test:dry` | every Gherkin step is defined once, with no undefined or ambiguous steps | seconds, offline |
| `npm run unit` | `node:test` behavior tests under `test/` | seconds, offline |
| `npm run gate:crap` | no function beyond `quality/crap-baseline.json` at CRAP ≥ 10 (complexity² × (1−cov)³ + complexity) | seconds, offline |
| `npm run gate:dry` | no function pair beyond `quality/dry-baseline.json` at structural similarity ≥ 0.8 (60+ tokens) | < 1 s, offline |
| `npm run gate:mutate -- <file> [--fn <name>]` | the unit tests notice faults in that file | ~0.2 s per mutant, offline |
| `npx cucumber-js <feature>:<line>` | one scenario against the live API | live, rate-limited |

The baselines are a ratchet. A gate fails only on a **new** offender or a **worse** one. A FIXED line means
"shrink the baseline": run `--update` and commit the deletion. Never use `--update` to accept a new offender
unless it is an I/O shell that cannot be tested honestly, and if so, say that in the commit message.

# First Make it Work

## Laziness Protocol
- Each decision has one owner:
  - endpoints live in `src/http/paths.js`;
  - rate limits live in the `BUCKETS` table in `src/http/throttle.js`;
  - `src/config/config.js` is the only module that reads env;
  - `src/http/client.js` is the only HTTP choke point;
  - `src/http/attach.js` is the only path to Allure attachments.
- Make the smallest edit that solves the problem. Reuse an existing step phrase before you write a new one (`npm run docs:steps`).

## Foundational Thinking
- Get the data shape right first: the response schema in `src/contracts/<domain>.js` and the request builder in `src/builders/`, then the step logic.
- Do first whatever helps every later step, for example a missing path constant or a shared assertion.
- Do not share state that a concurrent writer could touch.

## TDD
- **Scenarios.** Write the scenario first. `npm run test:dry` must show its new steps as *undefined*. A live run must then fail *for the reason you expect* (the status or field you are asserting), not with a TypeError. Implement until it passes.
- **Framework code.** Write a failing `node:test` test in `test/<same path>.test.js`, watch it fail for the expected reason, then make the smallest change that passes.
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

### Model the Domain
- Encode the domain where an illegal state cannot be expressed. Examples: a contract for every 2xx response, which the client checks, and a builder that only emits valid bodies (scenarios override single fields through context keys).
- Domain terms such as epic, bucket, contract, context key and quota go in the README Tag Reference and Configuration sections, so they keep one meaning.
- If the code is already clear and local, leave it alone.

### Boundary Discipline
- Check data where it enters:
  - the client validates every 2xx JSON body against its contract;
  - `World.res()` and `World.render()` fail loudly on a missing key;
  - config is parsed once.
- Once data is inside, trust it.
- Keep the logic in pure functions (`src/assertions`, `src/utils`, the `tools/` cores). Steps, services and `main()` functions stay thin shells.

### Type System Discipline (JS edition)
- Make a wrong value impossible to write:
  - write contracts with the `src/contracts/schema.js` vocabulary;
  - keep them strict on types (an integer rejects `"900"`, a boolean rejects `"true"`) and open to extra fields, so the API may add fields;
  - use builders instead of hand-written bodies.
- Do not silence failures:
  - no `catch` that swallows an error;
  - no `?? {}` that hides missing data;
  - never weaken the failed-vs-broken classification in `src/support/hooks.js`.

### Make Operations Idempotent
- A scenario run twice, or rerun after a crash, must end in the same state:
  - generate unique data (`src/utils/generator.js`) and never use fixed emails or usernames;
  - register deletion of anything that counts against a per-IP quota (webhook inboxes, uploads) with `saveCreated` or `this.defer`, so it is cleaned up even when the scenario fails.

### Separate Before Serializing Shared State
- Per-scenario state lives on the World, which Cucumber builds fresh for every scenario.
- Run-wide state is limited to `support/session.js` and the throttle's `lastCall`. Each has exactly one writer and depends on `parallel: 1`, and the CI matrix provides the scaling. Do not add more run-wide state.

# Then Make it Right

## Fix Root Causes
- Reproduce the problem first: a unit test, or one live scenario.
- Fix the cause. A guard that only hides the crash is not a fix.
- When the API itself is wrong:
  - tag the scenario `@Bug` and add a comment naming the defect;
  - never change the expected value to match the bug.

## Sequence Work into Verifiable Units
- Finish one small unit, prove it with its command from the table above, then start the next.

## Test Behavior, Not Implementation
- Call the code the way its user does (a step, another module, a CLI) and check what that user would see: the value, or the failure message in the report.
- If a test would still pass when every function returned nothing, throw it out. `gate:mutate` is how you check that.

## CRAP (`npm run gate:crap`)
- Get each function under 10 by splitting it, testing it, or both.
- A `switch` or an if-chain that dispatches on a type usually becomes a lookup table. See `NAMED_BY_PARENT` in `tools/lib/functions.js` and `MUTATIONS` in `tools/mutate.js`.

## Duplication (`npm run gate:dry`)
- Remove pairs at or above 0.8 by moving the shared logic to the module that owns it (`src/assertions`, `src/builders`, `src/support`).
- Three-line steps that look alike are normal Cucumber style. The 60-token minimum already ignores them.

## Mutation (`npm run gate:mutate -- <file>`)
- Cover what is uncovered.
- Kill the survivors.
- Delete dead code.
- Report equivalent mutants (for example `??` → `&&` where the left side is never nullish) instead of writing tests that contort around them.

## Refactoring
- **Pin** the current behavior with unit tests, or with the scenarios that use the step you are changing.
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
- Each message gives **Why**, **What changed**, and **Proof** (the commands that were run and their result).
- Run `ub-reviewer` before you commit.
- Push only when the user asks.
