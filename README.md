# play-api-js — API Test Automation Framework

[![API Tests — play-qa.com](https://github.com/romasky/play-api-js/workflows/API%20Tests%20%E2%80%94%20play-qa.com/badge.svg)](https://github.com/romasky/play-api-js/actions)
[![Allure Report](https://img.shields.io/badge/Allure-Report-brightgreen?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNEg5VjhINnYtMmg2djJoLTF2OHptNS0yaC0ydi04aDJ2OHoiLz48L3N2Zz4=)](https://romasky.github.io/play-api-js/latest/)

**play-api-js** is a comprehensive API test automation framework for [play-qa.com](https://www.play-qa.com), built with JavaScript, Cucumber (BDD), Allure reporting, and axios. It is the JavaScript sibling of [play-api-java](https://github.com/romasky/play-api-java) and [play-api-python](https://github.com/romasky/play-api-python), which share its 45 feature files.

---

## 📊 Allure Report

🔗 **[View Latest Report](https://romasky.github.io/play-api-js/latest/)**

---

## ✨ Key Highlights

- **799 BDD scenarios across 45 feature files, calling all 79 operations of the Swagger spec** — users, auth (opaque token, Basic, JWT, store personas), admin, temp mail + SMTP simulator, files, webhooks, the intentionally buggy API, chaos endpoints, challenges, SSE / WebSocket and the API documents
- **Every negative scenario asserts both the HTTP status and `error.code`**; token-security guards cover absent / empty / malformed `Authorization` headers and cross-account attempts (`403 FORBIDDEN`)
- **Strict 2xx contracts** — every 2xx JSON body is validated against a JSON Schema (ajv, strict types) registered per `(method, path)`, whatever the scenario asserts afterwards
- **Per-endpoint rate-limit pacing** in the HTTP client — the server's per-IP token buckets are paced at their refill rate, never retried
- **Clean-up after every scenario** — uploads and webhook inboxes a scenario creates are deleted in an `After` hook, pass or fail
- **Allure HTML reports** — one nested step per HTTP call with scrubbed attachments (`whsec_` signing secrets masked), auto-published to GitHub Pages
- **Spec tooling** — `spec:drift` compares the live Swagger with the committed snapshot; `spec:coverage` fails CI below 100 % of operations called
- **CI matrix by epic** — six jobs, one runner (one IP, its own rate-limit buckets) each: ≈ 8 min wall time instead of ≈ 21 min serially (Authentication is the long pole)

---

## 🛠 Tech Stack

| Tool | Version | Role |
|---|---|---|
| Node.js | 22+ | Runtime (native `FormData`, `WebSocket`, `AbortSignal.timeout`) |
| `@cucumber/cucumber` | ^10.9 | BDD runner + Gherkin parser |
| `axios` | ^1.6 | HTTP client |
| `ajv` | ^8 | 2xx response contracts (JSON Schema) |
| `allure` | ^3.8 | Allure Report 3 CLI (Awesome UI) |
| `allure-cucumberjs` | ^3.8 | Allure formatter for Cucumber |
| `allure-js-commons` | ^3.8 | Allure step/attachment API |
| `dotenv` | ^16.4 | Environment config |

---

## 📁 Project Structure

```
play-api-js/
├── cucumber.js                    # Cucumber config (runner, formatters, tag filter, parallel: 1)
├── spec/openapi.json              # Swagger 2.0 snapshot the expectations are written against (79 operations)
├── tools/
│   ├── spec.js                    # shared snapshot loader for the two tools below
│   ├── spec-drift.js              # live Swagger vs snapshot — operations and response codes that moved
│   └── spec-coverage.js           # which operations a run called (from allure-results), --min 100 in CI
├── src/
│   ├── config/config.js           # BASE_URL, REQUEST_TIMEOUT, ADMIN_SEED_CODE (.env)
│   ├── http/
│   │   ├── client.js              # the ONE choke point: Allure step per call, bodies, timeouts, contracts
│   │   ├── throttle.js            # per-endpoint rate-limit pacing
│   │   ├── attach.js              # the only Allure attach path — scrubs secrets
│   │   └── paths.js               # every endpoint path
│   ├── contracts/<domain>.js      # 2xx JSON Schemas + the (method, path) registry (index.js)
│   ├── services/<domain>.js       # one module per API domain; plain values in, raw response out
│   ├── builders/                  # request bodies (users, mail, bug reports, carts)
│   ├── assertions/                # typed body / header assertions (lists, sorting, Link, error envelope)
│   ├── support/
│   │   ├── world.js               # per-scenario World: context store, ${key} interpolation, deferred cleanups
│   │   ├── hooks.js               # 60 s step timeout, After → run cleanups
│   │   ├── auth.js                # bearer / raw / none / basic Authorization headers
│   │   ├── cleanup.js             # saveCreated — register deletion even on a contract violation
│   │   └── session.js             # one shared JWT session per run
│   ├── utils/                     # generator, jsonPath, jwtTools, samples, webhookSign, lookup
│   └── steps/<domain>/*.js        # step definitions (function steps on the World)
└── features/play_qa_api/          # 45 feature files, one Allure epic each (see below)
```

---

## 🚀 Quick Start

```bash
npm install

npm test                    # the whole suite (≈ 21 min serially — rate limits)
npm run test:smoke          # critical path only
npm run test:dry            # offline: every step defined, none ambiguous

# one epic (what each CI matrix job runs)
npx cucumber-js --tags "@Run and @allure.label.epic:Webhooks"

npm run spec:drift          # live Swagger vs spec/openapi.json (--update accepts the live spec)
npm run spec:coverage       # operations called by the last run (reads allure-results/)

npm run allure:generate && npm run allure:open
```

---

## ⚙️ Configuration

```
BASE_URL=https://www.play-qa.com
REQUEST_TIMEOUT=20000
ADMIN_SEED_CODE=play-qa-admin
```

`REQUEST_TIMEOUT` is the single axios deadline (connect + response, in ms). `ADMIN_SEED_CODE` is published on
purpose in the play-qa.com UI. Keep `parallel: 1`: rate limits are per IP and paced in-process — scale through
the CI matrix instead.

---

## 🗂 API Coverage

All 79 operations of [`spec/openapi.json`](spec/openapi.json) are called (`npm run spec:coverage`).

| Epic | Feature files | Scenarios |
|---|---|---|
| User_Lifecycle | 10 | 189 |
| Authentication | 9 | 128 |
| Administration | 2 | 55 |
| Mail_Service | 6 | 95 |
| File_Storage | 2 | 38 |
| Webhooks | 2 | 39 |
| Bug_Hunting | 2 | 79 |
| Chaos_Engineering | 6 | 109 |
| Challenges | 2 | 39 |
| System | 4 | 28 |
| **Total** | **45** | **799** |

Scenario Outlines are counted per example row. Deliberately not tested: 429 responses (they would drain the
shared per-IP buckets), 503 "not configured", a real reCAPTCHA pass, the WebSocket 1009 close.

---

## 🏷 Tag Reference

| Tag | Meaning |
|---|---|
| `@Run` | Included in default CI run |
| `@Smoke` | Critical path — minimal fast subset |
| `@Positive` | Happy path scenario |
| `@Negative` | Error / validation scenario |
| `@Flow` | Multi-step end-to-end scenario |
| `@Ignore` | Excluded from run (known skip) |
| `@Bug` | Known failing — excluded from CI |
| `@NotImplemented` | Placeholder — excluded from CI |

---

## 📚 Documentation

Full documentation lives in the [project wiki](https://github.com/romasky/play-api-js/wiki):
[Getting Started](https://github.com/romasky/play-api-js/wiki/Getting-Started) ·
[Architecture](https://github.com/romasky/play-api-js/wiki/Architecture) ·
[Step Definitions Reference](https://github.com/romasky/play-api-js/wiki/Step-Definitions-Reference) ·
[Authorization Header Testing](https://github.com/romasky/play-api-js/wiki/Authorization-Header-Testing) ·
[Feature Files & Coverage](https://github.com/romasky/play-api-js/wiki/Feature-Files-and-Coverage) ·
[Comparison: JS vs Java](https://github.com/romasky/play-api-js/wiki/Comparison-JS-vs-Java)

---

## 🔗 Related

- [play-api-java](https://github.com/romasky/play-api-java) — Java version of this framework
- [play-api-python](https://github.com/romasky/play-api-python) — Python version (the reference for the whole-Swagger suite)
- [play-qa.com](https://www.play-qa.com) — The API under test
- [Swagger UI](https://play-qa.com/swagger/index.html) — Interactive API docs
