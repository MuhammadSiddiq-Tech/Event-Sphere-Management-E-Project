# EventSphere Management — Engineering Rules

> **Audience:** every developer and AI assistant working on this repo.
> **Keywords:** **MUST / MUST NOT** = non-negotiable · **SHOULD** = default unless justified in the PR · **MAY** = optional.
> **Related docs:** [prd.md](./prd.md) · [architecture.md](./architecture.md) · [design.md](./design.md) · [tasks.md](./tasks.md) · [memory.md](./memory.md)

---

## 0. Working Agreement (read first)

1. **Read `memory.md` before starting; update it before finishing.**
2. **Plan against `tasks.md`.** Work one task at a time; reference its ID (`T-x.y`) in branch/commit/PR.
3. **Don't invent requirements.** If it isn't in `prd.md`, ask or log it in `memory.md` §8 and proceed with the documented assumption.
4. **Architecture is law.** Layering, folder structure, and API conventions in `architecture.md` MUST be followed. To change them, record a decision in `memory.md` §5 and update `architecture.md` in the same PR.
5. **Small, reviewable changes.** One concern per PR (≤ ~400 changed lines where feasible).
6. **If unsure, choose the simpler solution** (YAGNI). No speculative abstractions.
7. **Never leave the app broken** on `main`. Every merge passes CI.

---

## 1. General Code Rules

| # | Rule |
|---|------|
| 1.1 | Language: modern JavaScript (ES2022, ES modules `import/export`) on both client and server. Use JSDoc types on public functions. |
| 1.2 | MUST use `const` by default, `let` when reassigning, never `var`. |
| 1.3 | MUST use `async/await` (no raw `.then` chains, no callback pyramids). |
| 1.4 | Functions SHOULD be small (< 40 lines) and do one thing. Files SHOULD be < 300 lines; split otherwise. |
| 1.5 | No dead code, no commented-out code, no `console.log` in committed code (use the logger on the server; remove on the client). |
| 1.6 | No magic numbers/strings — use named constants/enums (`ROLES`, `BOOTH_STATUS`, `APPLICATION_STATUS`…) from a single `constants` module. |
| 1.7 | Comments explain **why**, not **what**. Every non-obvious business rule links to its PRD ID (e.g., `// BR-3`). |
| 1.8 | Prefer composition and pure functions; avoid hidden global state. |
| 1.9 | Handle every error path — no empty `catch`, no swallowed promises. |
| 1.10 | MUST pass ESLint + Prettier with zero warnings (CI gate). |

### 1.1 Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Variables/functions | `camelCase` | `reserveBooth` |
| Booleans | `is/has/can/should` prefix | `isActive`, `hasConsented` |
| Classes/React components | `PascalCase` | `ApiError`, `FloorPlan` |
| Constants/enums | `UPPER_SNAKE_CASE` (object keys too) | `BOOTH_STATUS.AVAILABLE` |
| Server files | `kebab-case` + suffix | `booth.service.js`, `auth.routes.js` |
| Client components | `PascalCase.jsx` | `ExpoCard.jsx` |
| Hooks | `useXxx.js` | `useBooths.js` |
| Mongo collections | plural lowercase | `booths` |
| Mongo/JSON fields | `camelCase` | `startTime` |
| REST paths | plural, kebab-case nouns | `/expo-registrations` |
| Env vars | `UPPER_SNAKE_CASE`; client-exposed prefixed `VITE_` | `JWT_ACCESS_SECRET` |

---

## 2. Repository & Git Rules

| # | Rule |
|---|------|
| 2.1 | Branching: `main` (protected, deploys) ← `feat/<scope>-<short>`, `fix/…`, `chore/…`, `docs/…`. Include task ID where possible: `feat/booth-atomic-reserve-T-3.6`. |
| 2.2 | **Conventional Commits** are MUST: `feat(booths): add atomic reserve`, `fix(auth): rotate refresh on reuse`, `docs: update api table`. |
| 2.3 | PRs MUST: link task/PRD IDs, describe what/why, include screenshots for UI, tick the Definition of Done (§14). |
| 2.4 | No direct pushes to `main`. Squash-merge. |
| 2.5 | MUST NOT commit: `.env`, secrets, `node_modules`, build output, uploads, DB dumps, large binaries (video goes in release/Drive, linked in docs). |
| 2.6 | `.env.example` MUST be updated whenever a new env var is introduced. |
| 2.7 | Husky pre-commit: lint-staged (ESLint + Prettier). Pre-push: unit tests. |

---

## 3. Backend Rules (Node.js native HTTP / Mongoose)

### 3.1 Structure & layering
| # | Rule |
|---|------|
| 3.1.1 | MUST follow `routes → middleware → controller → service → model`. |
| 3.1.2 | Controllers MUST be thin: parse input, call one service method, return the envelope. **No Mongoose calls in controllers.** |
| 3.1.3 | Services contain business rules, are framework-agnostic (no `req`/`res`), and are the only place that calls models and emits socket events/notifications. |
| 3.1.4 | Handlers throw `ApiError` subclasses; the core pipeline's single `try/catch` converts them to the envelope. Never write error responses by hand (`res.writeHead`) inside services or controllers. |
| 3.1.5 | A single global error handler converts errors to the standard envelope; stack traces MUST NOT be sent in production. |
| 3.1.6 | `config/env.js` validates `process.env` with Zod at boot and fails fast. **Only** that file reads `process.env`. |
| 3.1.7 | **MUST NOT add Express, Koa, Fastify, Hapi, NestJS or similar frameworks** (D-013). The HTTP layer is `node:http` + `server/src/core`. Small, single-purpose libs are fine (`busboy`, `zod`, `pino`, `jsonwebtoken`, `bcrypt`, `mongoose`, `socket.io`, `nodemailer`, `node-cron`). |
| 3.1.8 | Controllers receive only `ctx` and respond via `ctx.json()` / `ctx.noContent()`; they never touch `ctx.res` directly (security headers, request-ID, compression are applied in one place). |
| 3.1.9 | Every `core/` module MUST have unit tests (routing params/405/404, body limits & 415, cookie flags, path-traversal attempts, CORS preflight, rate-limit windows, sanitiser). Keep `core/` small — don't add features nobody uses. |

### 3.2 API conventions
| # | Rule |
|---|------|
| 3.2.1 | All routes under `/api/v1`. Resource-oriented; use proper verbs (`GET` safe, `POST` create/action, `PATCH` partial, `PUT` replace, `DELETE`). |
| 3.2.2 | Success: `{ success: true, data, meta? }`. Error: `{ success: false, error: { code, message, details? } }`. |
| 3.2.3 | Status codes: `200/201/204`, `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `422` only if semantically needed, `429` rate-limited, `500` unexpected. |
| 3.2.4 | Every list endpoint MUST paginate (`page`, `limit ≤ 100`) and support documented `sort`/filters. |
| 3.2.5 | Every route MUST declare a Zod schema for `params`, `query`, and `body` through the `validate` middleware. Unknown body keys are stripped (`.strict()` or `.strip()`). |
| 3.2.6 | Endpoints MUST be documented in OpenAPI (kept in sync in the same PR). |
| 3.2.7 | Idempotent operations (register, bookmark) MUST be safe to repeat. |

### 3.3 Database rules
| # | Rule |
|---|------|
| 3.3.1 | Every schema MUST define `timestamps: true`, validation, enums via constants, and **explicit indexes** for each query pattern. |
| 3.3.2 | `passwordHash` and token hashes MUST use `select: false`. |
| 3.3.3 | Read-only queries SHOULD use `.lean()` and field projection. Never return whole documents when a subset suffices. |
| 3.3.4 | MUST NOT pass `req.body`/`req.query` directly into queries; build filters from validated fields (NoSQL-injection safety). |
| 3.3.5 | Race-prone state changes (booth reserve, capacity) MUST use atomic conditional updates (`findOneAndUpdate` with state in the filter) or transactions. |
| 3.3.6 | Multi-document invariants (approve application + allocate booth) MUST run in a transaction. |
| 3.3.7 | Avoid N+1: use `populate` with projections or aggregation. |
| 3.3.8 | Migrations/seed scripts are idempotent and live in `server/seed`. |

### 3.4 Authentication & authorization
| # | Rule |
|---|------|
| 3.4.1 | Hash passwords with bcrypt, cost ≥ 12. Never log/return/compare plaintext outside the auth service. |
| 3.4.2 | Access token TTL 15 min; refresh 7 days, **rotating**, stored hashed, httpOnly + Secure + SameSite=Strict cookie. Reuse of a revoked refresh token revokes the family. |
| 3.4.3 | Every protected route MUST include `requireAuth` and (if role-limited) `requireRole(...)`. **Default-deny:** new routers start behind `requireAuth`. |
| 3.4.4 | Ownership checks MUST be done in services (e.g., exhibitor edits only their own booth). A role check alone is insufficient. |
| 3.4.5 | Auth responses MUST NOT reveal whether an email exists (login, forgot-password). |
| 3.4.6 | Password reset tokens: random 32 bytes, stored as SHA-256, 30-min expiry, single-use. |
| 3.4.7 | `admin` role MUST NOT be assignable through public registration. |

### 3.5 Real-time (Socket.IO)
| # | Rule |
|---|------|
| 3.5.1 | Authenticate the handshake with the access token; reject otherwise. |
| 3.5.2 | Users join only rooms they're authorised for (`user:{id}`, `expo:{id}` for visible expos, `conversation:{id}` for participants, `admin:{expoId}` for admins). |
| 3.5.3 | Emit events from **services** after a successful DB write — never before. |
| 3.5.4 | Payloads are minimal (IDs + changed fields). Clients refetch/invalidate; they don't trust payloads as truth. |
| 3.5.5 | High-frequency events (analytics ticks) MUST be throttled/debounced. |

### 3.6 Logging, errors, observability
| # | Rule |
|---|------|
| 3.6.1 | Use `pino` structured logging with `x-request-id`. Levels: `error` (unexpected), `warn` (handled anomalies), `info` (key lifecycle), `debug` (dev only). |
| 3.6.2 | MUST redact `authorization`, `cookie`, `password`, `token`, and PII in logs. |
| 3.6.3 | Expected failures (validation, 404, 409) are `ApiError`s, not logged as errors. |
| 3.6.4 | `/health` checks DB connectivity; process handles `SIGTERM` gracefully. |

### 3.7 Files & email
| # | Rule |
|---|------|
| 3.7.1 | Uploads: whitelist MIME **and** verify magic bytes; size limits (images 2–5 MB, docs 10 MB); random file names; never serve user uploads with executable types; store outside the web root or in Cloudinary. |
| 3.7.2 | Emails are sent via a `mailer` service with templates; failures are logged and retried/non-blocking — they MUST NOT fail the user's primary action. |

---

## 4. Frontend Rules (React)

### 4.1 Structure
| # | Rule |
|---|------|
| 4.1.1 | Feature-first folders (`features/<feature>/…`); shared UI in `components/`. Components MUST NOT import from another feature's internals — go through its `index.js`. |
| 4.1.2 | Function components + hooks only. One component per file. Components < 200 lines; extract hooks/subcomponents otherwise. |
| 4.1.3 | Pages (route-level) compose feature components; they hold no business logic beyond wiring. |
| 4.1.4 | Role areas are **lazy-loaded** (`React.lazy`) and guarded by `<ProtectedRoute roles>`. |

### 4.2 Data & state
| # | Rule |
|---|------|
| 4.2.1 | **Server state → TanStack Query.** Local UI state → `useState/useReducer`. Cross-cutting (auth, theme, socket) → Context. No Redux. |
| 4.2.2 | Components MUST NOT call Axios/`fetch` directly — use feature API modules + hooks (`useExpos`, `useReserveBooth`). |
| 4.2.3 | Query keys are centralised/factory-based (`expoKeys.detail(id)`). Mutations invalidate affected keys. |
| 4.2.4 | Socket events **invalidate** queries; they MUST NOT be used to hand-patch cache unless justified. |
| 4.2.5 | Access token kept in memory only. **MUST NOT** store tokens or PII in `localStorage`/`sessionStorage`. |
| 4.2.6 | Axios interceptor performs single-flight refresh on 401; if refresh fails → clear state → `/login`. |
| 4.2.7 | Forms: React Hook Form + Zod resolver; show field errors inline and focus the first invalid field. |

### 4.3 UI & UX
| # | Rule |
|---|------|
| 4.3.1 | Use only design tokens and library components from `design.md`; no ad-hoc hex colours or pixel values — use Bootstrap Sass variables, CSS variables (`--bs-*`) and utility classes. |
| 4.3.2 | Every screen MUST handle **loading (skeleton), empty, error, and success** states. |
| 4.3.3 | Destructive actions use `ConfirmDialog`. Expo deletion requires typing the title. |
| 4.3.4 | Status is never colour-only (icon + text). |
| 4.3.5 | Mobile-first CSS; test at 360, 768, 1280 px. Touch targets ≥ 44 px. |
| 4.3.6 | Never use `dangerouslySetInnerHTML` unless content is sanitised (DOMPurify) and the PR justifies it. |
| 4.3.7 | Performance: memoise only when measured; virtualise long lists (> 100 rows); debounce search (300 ms); lazy-load charts and images. |
| 4.3.8 | **Bootstrap is the only CSS framework** (D-014). Use **React-Bootstrap** components; MUST NOT load Bootstrap's JS bundle, jQuery, or use `data-bs-*` behaviours. Customise via `styles/custom.scss` variables first, utilities second, small custom classes last. No inline styles except dynamic SVG geometry. |

### 4.4 Accessibility (MUST)
- Semantic HTML first (`button`, `nav`, `main`, `label`); ARIA only to fill gaps.
- All inputs labelled; errors linked with `aria-describedby`; `aria-invalid` on errors.
- Full keyboard operation incl. floor plan; visible focus ring; modal focus trap + restore.
- `aria-live` for toasts and live updates; respect `prefers-reduced-motion`.
- `eslint-plugin-jsx-a11y` enabled; axe checks in E2E for key pages.

---

## 5. Security Rules (cross-cutting)

| # | Rule |
|---|------|
| 5.1 | **Never trust the client.** Re-validate and re-authorise on the server for every request. |
| 5.2 | `core/security.js` and `core/rate-limit.js` MUST be applied globally: secure headers (CSP, `nosniff`, HSTS, frame-ancestors), strict CORS (explicit `CLIENT_URL` origin, `credentials: true`, handled preflight), body-size limits, NoSQL-key sanitiser (reject `$`-prefixed/dotted keys), query normaliser, and rate limiting (global + stricter on `/auth/*`, messages, uploads). |
| 5.3 | Secrets only in env vars. Rotate if ever exposed. Different secrets per environment. |
| 5.4 | TLS only in staging/production; `Secure` cookies; HSTS. |
| 5.5 | Do not expose internal IDs/fields unnecessarily; use DTO mappers (`toPublicUser`, `toPublicExhibitor`). |
| 5.6 | Dependency hygiene: `npm audit` in CI (fail on high/critical), Dependabot enabled, lockfile committed. |
| 5.7 | Before release: run the security checklist (OWASP Top-10 review, ZAP baseline, authz tests per role). |
| 5.8 | Privacy: collect minimum data; consent stored with timestamp; support export/delete; anonymise on delete; no PII in analytics events beyond user ID reference. |

---

## 6. Testing Rules

| # | Rule |
|---|------|
| 6.1 | **Pyramid:** many unit tests (services, utils, hooks) → fewer integration tests (API with Supertest + in-memory Mongo) → few E2E (Playwright) on critical journeys. |
| 6.2 | Every service function MUST have unit tests for happy path + each business-rule failure (cite BR/FR IDs in test names). |
| 6.3 | Every route MUST have integration tests for: success, validation failure, unauthenticated (401), wrong role (403), and ownership violation. |
| 6.4 | MUST include a **concurrency test** for booth reservation (N parallel requests → exactly 1 success, rest 409). |
| 6.5 | Frontend: test behaviour with React Testing Library (queries by role/label), not implementation details. |
| 6.6 | E2E critical journeys: (a) register → login → role redirect; (b) exhibitor apply → admin approve → reserve booth (verify live update in a 2nd context); (c) attendee register expo → register/bookmark session → reminder notification; (d) password reset. |
| 6.7 | Coverage gates: services ≥ 80% lines; overall ≥ 70%. CI fails below threshold. |
| 6.8 | Tests are deterministic: no real network/email, frozen time (`jest.useFakeTimers`), seeded factories. |
| 6.9 | Bug fix PRs MUST include a regression test. |
| 6.10 | Performance: run a load test (k6/Artillery) against key reads and the reserve endpoint before release; record results in `/docs/testing`. |

---

## 7. Error Handling & UX Messaging

- Error messages state **what happened and what to do next**; no raw server text or stack traces in UI.
- Map error codes → friendly messages in one client module (`lib/errorMessages.js`).
- Retry only idempotent requests automatically (React Query defaults); mutations show explicit retry.
- 409 on booth reserve → toast "That booth was just reserved. Pick another." + refetch plan.

---

## 8. Data & Time Rules

- Dates stored in **UTC** (`Date`); API uses ISO-8601 strings; UI formats in the expo's venue timezone and labels it.
- IDs exposed as strings (`id`) — map `_id` → `id` in `toJSON` transforms.
- Currency (if shown): store as integer minor units; display with `Intl.NumberFormat`.
- Text inputs trimmed; emails lower-cased; lengths capped in both Zod and Mongoose.

---

## 9. Documentation Rules

| # | Rule |
|---|------|
| 9.1 | Docs ship with code: a PR that changes behaviour MUST update the relevant doc (`prd.md`, `architecture.md`, `design.md`, OpenAPI, README). |
| 9.2 | `README.md` MUST let a new dev run the project in ≤ 10 minutes (install, env, seed, run, test). |
| 9.3 | Maintain: **User guide** (per role, with screenshots), **Developer guide**, **API reference** (OpenAPI export), **Test report**, **Demo video** (see `tasks.md` Phase 9). |
| 9.4 | Record notable decisions in `memory.md` §5; log each session in §10. |

---

## 10. Dependency Rules

- Prefer the platform and already-chosen libs before adding a new one. New dependency PRs MUST state: purpose, size, maintenance status, license, alternatives considered.
- Pin major versions; commit lockfile; no deprecated/unmaintained packages.
- Do not add a UI kit or state library that conflicts with decisions D-007/D-008 without a new decision entry.

---

## 11. AI-Assistant-Specific Rules

When an AI assistant writes code for this project it MUST:

1. Re-read `memory.md`, then the relevant section of `prd.md`/`architecture.md` before coding.
2. State which task ID(s) it is implementing and which requirement IDs they satisfy.
3. Generate **complete, runnable** code (no `// ...rest of code`), following folder structure and naming here.
4. Include or update tests with every feature.
5. Never fabricate APIs, env vars, or libraries; verify against the codebase and docs.
6. Not introduce new dependencies, patterns, or file locations without flagging it.
7. Keep secrets out of code, examples, and logs.
8. After finishing: list changed files, how to run/test, and suggested `memory.md` / `tasks.md` updates.
9. When requirements conflict or are unclear: stop, summarise the options, and ask — don't guess on security, data model, or role-permission matters.

---

## 12. Prohibited Practices (quick list)

- ❌ Plaintext passwords or tokens in logs/DB/localStorage
- ❌ Business logic in controllers or React components
- ❌ Trusting `req.body` shapes without Zod validation
- ❌ Role checks only on the frontend
- ❌ Non-atomic booth reservation / capacity checks
- ❌ Returning `passwordHash`, token hashes, or other users' PII
- ❌ Unbounded queries (no pagination) on collections that can grow
- ❌ Hard-coded secrets, URLs, or colours
- ❌ Adding Express (or Koa/Fastify/Hapi/NestJS), Tailwind, MUI, or another CSS/UI framework; loading Bootstrap's JS bundle
- ❌ Skipping loading/empty/error states
- ❌ Merging with failing CI or skipped tests without a tracked reason

---

## 13. Performance Budgets

| Area | Budget |
|------|--------|
| API read p95 | ≤ 500 ms (local/staging, seeded data) |
| API write p95 | ≤ 800 ms |
| Page interactive (desktop, cached) | ≤ 2 s |
| Initial JS (gzip) public pages | ≤ 200 KB; role bundles lazy-loaded |
| Socket event → UI update | ≤ 2 s end-to-end |
| Image uploads | Resized server-side (≤ 1600 px longest edge) |

---

## 14. Definition of Done (per task / PR)

- [ ] Implements the referenced task and satisfies the linked PRD acceptance criteria
- [ ] Follows layering, naming, and folder rules in this document
- [ ] Inputs validated (Zod) and authz enforced (role **and** ownership) — with tests proving 401/403
- [ ] Unit + integration tests added/updated; all tests green; coverage gates met
- [ ] UI handles loading / empty / error / success; responsive at 360/768/1280; a11y checks pass
- [ ] No lint/format warnings; no `console.log`; no secrets
- [ ] OpenAPI / docs / `.env.example` updated if applicable
- [ ] Manually verified in the browser (incl. second client for real-time changes)
- [ ] `tasks.md` ticked and `memory.md` updated (status, decisions, session log)
- [ ] PR reviewed and squash-merged; CI green on `main`
