# play-api-js — API Test Automation Framework

[![API Tests — play-qa.com](https://github.com/romasky/play-api-js/workflows/API%20Tests%20%E2%80%94%20play-qa.com/badge.svg)](https://github.com/romasky/play-api-js/actions)
[![Allure Report](https://img.shields.io/badge/Allure-Report-brightgreen?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNEg5VjhINnYtMmg2djJoLTF2OHptNS0yaC0ydi04aDJ2OHoiLz48L3N2Zz4=)](https://romasky.github.io/play-api-js/latest/)

**play-api-js** is a comprehensive API test automation framework for [play-qa.com](https://www.play-qa.com), built with JavaScript, Cucumber (BDD), Allure reporting, and axios. It is the JavaScript port of [play-api-java](https://github.com/romasky/play-api-java).

---

## 📊 Allure Report

🔗 **[View Latest Report](https://romasky.github.io/play-api-js/latest/)**

---

## ✨ Key Highlights

- **BDD scenarios** — Cucumber feature files with human-readable Gherkin covering positive, negative, and end-to-end flows
- **181 scenarios across 18 feature files** — covering 19 API endpoints, including Bearer and Basic auth
- **Allure HTML reports** — step-level granularity, auto-published to GitHub Pages on every CI run
- **Token-security regression guards** — absent / empty / malformed `Authorization` headers and cross-account (IDOR) attempts; every negative scenario asserts **both** the HTTP status and `error.code`
- **Typed response assertions** — dotted-path, own-property checks (`Assert field "x.y" is absent …`) instead of substring matching
- **Temp-mail API coverage** — mailbox and message endpoints exercised through the same Gherkin steps, no external mail service needed
- **Rate-limit pacing** — `Before` hooks pre-emptively sleep to respect server-enforced rate limits
- **Scenario context** — global (`_g`) / local scoping system for cross-scenario data dependencies

---

## 🛠 Tech Stack

| Tool | Version | Role |
|---|---|---|
| Node.js | 20+ | Runtime |
| `@cucumber/cucumber` | ^10.9 | BDD runner + Gherkin parser |
| `axios` | ^1.6 | HTTP client |
| `allure` | ^3.8 | Allure Report 3 CLI (Awesome UI) |
| `allure-cucumberjs` | ^3.8 | Allure formatter for Cucumber |
| `allure-js-commons` | ^3.8 | Allure step/attachment API |
| `dotenv` | ^16.4 | Environment config |

---

## 📁 Project Structure

```
play-api-js/
├── cucumber.js                    # Cucumber config (runner, formatters, tag filter)
├── .env                           # Base URL and request timeout (git-ignored)
├── .github/workflows/test.yml     # CI — GitHub Actions
├── allure-results/
│   └── categories.json            # Allure failure categories
├── src/
│   ├── config/config.js           # Reads .env (dotenv wrapper)
│   ├── api/
│   │   ├── apiPaths.js            # All endpoint paths as constants / functions
│   │   └── restClient.js          # axios wrapper — one Allure step per request, headers passed verbatim
│   ├── utils/
│   │   ├── generator.js           # Random data generators (email, username, etc.)
│   │   └── jsonPath.js            # getPath / hasPath — typed dotted-path body checks
│   ├── models/
│   │   ├── createUserReq.js       # Request builders (strips undefined → no null fields)
│   │   ├── loginReq.js
│   │   ├── createMailboxReq.js
│   │   ├── sendMessageReq.js
│   │   ├── userResponse.js        # Typed response accessors + assertions (used by steps)
│   │   ├── loginResponse.js
│   │   ├── mailboxResponse.js
│   │   ├── usersListResponse.js
│   │   └── errorResponse.js
│   ├── context/scenarioContext.js # Global/local variable store for Gherkin steps
│   └── steps/
│       ├── commonSteps.js         # Data generation, typed field/header/status assertions, debug
│       ├── accountsSteps.js       # Users, login, logout steps (bearer / raw / no-auth variants) + rate-limit hooks
│       ├── mailSteps.js           # Mailbox and message steps
│       ├── healthSteps.js         # Health check steps
│       ├── basicAuthSteps.js      # GET /auth/basic steps
│       └── optionsSteps.js        # OPTIONS endpoint steps
└── features/play_qa_api/
    ├── CreateUserTests.feature
    ├── GetUserTests.feature
    ├── ListUsersTests.feature
    ├── UserExistsTests.feature
    ├── UpdateUserTests.feature
    ├── PatchUserTests.feature
    ├── DeleteUserTests.feature
    ├── LoginTests.feature
    ├── LogoutTests.feature
    ├── TokenSecurityTests.feature
    ├── BasicAuthTests.feature
    ├── OptionsTests.feature
    ├── HealthTests.feature
    ├── MailboxCreateTests.feature
    ├── MailboxGetTests.feature
    ├── MailboxDeleteTests.feature
    ├── MailSendTests.feature
    └── MailMessagesTests.feature
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run smoke tests only
npm run test:smoke

# Run with custom tag filter
npx cucumber-js --tags "@Positive and @allure.label.subSuite:Create_User"

# Generate and open Allure report locally
npm run allure:generate
npm run allure:open
```

---

## ⚙️ Configuration

Copy `.env` and adjust if needed:

```
BASE_URL=https://www.play-qa.com
REQUEST_TIMEOUT=20000
```

`REQUEST_TIMEOUT` is the single axios deadline (connect + response, in ms) — axios has no separate connect timeout.

Override at runtime: `BASE_URL=https://staging.play-qa.com npm test`

---

## 🗂 API Coverage

| Method | Endpoint | Feature File | Status |
|---|---|---|---|
| GET | `/api/v1/health` | HealthTests.feature | ✅ Tested |
| POST | `/api/v1/login` | LoginTests.feature | ✅ Tested |
| GET | `/api/v1/auth/basic` | BasicAuthTests.feature | ✅ Tested |
| POST | `/api/v1/users/create` | CreateUserTests.feature | ✅ Tested |
| GET | `/api/v1/users/list` | ListUsersTests.feature | ✅ Tested |
| GET | `/api/v1/users/get/:id` | GetUserTests.feature | ✅ Tested |
| HEAD | `/api/v1/users/exists/:id` | UserExistsTests.feature | ✅ Tested |
| GET | `/api/v1/users/exists/:id` | UserExistsTests.feature | ✅ Tested |
| OPTIONS | `/api/v1/users/options` | OptionsTests.feature | ✅ Tested |
| PUT | `/api/v1/users/update/:id` | UpdateUserTests.feature | ✅ Tested |
| PATCH | `/api/v1/users/patch/:id` | PatchUserTests.feature | ✅ Tested |
| DELETE | `/api/v1/users/delete/:id` | DeleteUserTests.feature | ✅ Tested |
| POST | `/api/v1/users/logout/:id` | LogoutTests.feature | ✅ Tested |
| PUT/PATCH/DELETE/POST | user mutation endpoints — auth hardening | TokenSecurityTests.feature | ✅ Tested |
| POST | `/api/v1/mail/create` | MailboxCreateTests.feature | ✅ Tested |
| GET | `/api/v1/mail/:token` | MailboxGetTests.feature | ✅ Tested |
| DELETE | `/api/v1/mail/:token` | MailboxDeleteTests.feature | ✅ Tested |
| GET | `/api/v1/mail/:token/messages` | MailMessagesTests.feature | ✅ Tested |
| GET | `/api/v1/mail/:token/messages/:id` | MailMessagesTests.feature | ✅ Tested |
| POST | `/api/v1/mail/:token/send` | MailSendTests.feature | ✅ Tested |
| POST | `/api/v1/verify-recaptcha` | — | ⏭ Out of scope (needs a live Google reCAPTCHA token) |

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

## 📈 Scenario Count

Scenario Outlines are counted per example row.

| Feature | Scenarios |
|---|---|
| CreateUserTests | 39 |
| MailboxCreateTests | 18 |
| ListUsersTests | 13 |
| LoginTests | 13 |
| TokenSecurityTests | 12 |
| PatchUserTests | 10 |
| DeleteUserTests | 8 |
| LogoutTests | 8 |
| MailMessagesTests | 8 |
| MailboxDeleteTests | 8 |
| UpdateUserTests | 8 |
| GetUserTests | 7 |
| MailSendTests | 7 |
| UserExistsTests | 7 |
| BasicAuthTests | 6 |
| HealthTests | 4 |
| MailboxGetTests | 3 |
| OptionsTests | 2 |
| **Total** | **181** |

---

## 🔗 Related

- [play-api-java](https://github.com/romasky/play-api-java) — Java version of this framework
- [play-qa.com](https://www.play-qa.com) — The API under test
- [Swagger UI](https://play-qa.com/swagger/index.html) — Interactive API docs
