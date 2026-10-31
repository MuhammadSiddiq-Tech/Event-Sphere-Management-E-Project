# EventSphere Management — Task Plan

> **How to use:** work top-to-bottom within a phase. Tick `[x]` when the task meets the Definition of Done in `rules.md` §14. Reference the task ID (`T-x.y`) in branches, commits, and PRs.
> **Legend:** `FR-*/NFR-*/BR-*` = requirement IDs from `prd.md` · **P0** must · **P1** should · **P2** nice · 🧪 includes tests · 📄 includes docs
> **Estimates:** S ≈ ≤ 2 h · M ≈ ½–1 day · L ≈ 1–2 days · XL ≈ > 2 days (split if possible)
> **Related docs:** [prd.md](./prd.md) · [architecture.md](./architecture.md) · [design.md](./design.md) · [rules.md](./rules.md) · [memory.md](./memory.md)

---

## Progress Overview

| Phase | Title | Milestone | Status |
|------:|-------|-----------|--------|
| 0 | Project setup & tooling | M1 | ⬜ |
| 1 | Backend foundation | M1 | ⬜ |
| 2 | Authentication & users | M1 | ⬜ |
| 3 | Expos, floor plan, booths | M2 | ⬜ |
| 4 | Exhibitor profiles & applications | M2 | ⬜ |
| 5 | Schedule & sessions | M3 | ⬜ |
| 6 | Attendee features | M3 | ⬜ |
| 7 | Real-time, messaging, notifications, feedback | M4 | ⬜ |
| 8 | Analytics & reports | M5 | ⬜ |
| 9 | Hardening: security, a11y, performance, QA | M5 | ⬜ |
| 10 | Documentation, demo video, delivery | M6 | ⬜ |

**Critical path:** 0 → 1 → 2 → 3 → 4 → (5 ∥ 6) → 7 → 8 → 9 → 10

---

## Phase 0 — Project Setup & Tooling  *(M1)*

- [ ] **T-0.1** Create monorepo (`client/`, `server/`, `docs/`), npm workspaces, root scripts (`dev`, `lint`, `test`, `build`) — **S**
- [ ] **T-0.2** Initialise server: plain Node.js `http` server (`app.js` handler / `server.js` bootstrap split; **no Express**), folder skeleton per `architecture.md` §5.1 — **S**
- [ ] **T-0.3** Initialise client: Vite + React 18, **Bootstrap 5 + React-Bootstrap + Bootstrap Icons + Sass**, React Router, TanStack Query, Axios — **S**
- [ ] **T-0.4** ESLint (+ `jsx-a11y`), Prettier, EditorConfig, Husky + lint-staged, Conventional-Commit lint — **S**
- [ ] **T-0.5** `config/env.js` (Zod-validated), `.env.example` for server and client — **S**
- [ ] **T-0.6** `docker-compose.yml`: Mongo (replica set `rs0`), MailHog; README run instructions — **M**
- [ ] **T-0.7** CI (GitHub Actions): install → lint → test → build; `npm audit` gate — **M**
- [ ] **T-0.8** Bootstrap theme from `design.md` §5 tokens: `styles/custom.scss` Sass variable overrides, CSS vars, dark mode via `data-bs-theme` — **M**
- [ ] **T-0.9** Seed `memory.md` status + decision log; add PR template with DoD checklist — **S**

**Exit:** `npm run dev` starts both apps; CI green on an empty test suite. 📄

---

## Phase 1 — Backend Foundation  *(M1)*

- [ ] **T-1.1** Mongo connection module with retry/graceful shutdown; `/health` endpoint — **S**
- [ ] **T-1.2** Utilities: `ApiError` hierarchy, response helpers (`ctx.json`), pagination helper — **S** 🧪
- [ ] **T-1.3** Middleware: `validate(zod)`, `errorHandler`, `notFound`, request-ID + `pino-http`, log redaction — **M** 🧪
- [ ] **T-1.4** Security middleware (in-house `core/security.js`, `core/rate-limit.js`): secure headers, CORS + preflight, NoSQL-key sanitiser, query normaliser, gzip via `zlib`, rate limiters (pluggable store) — **M** 🧪 (NFR-SEC-04)
- [ ] **T-1.5** `constants` module (`ROLES`, `BOOTH_STATUS`, `APPLICATION_STATUS`, `SESSION_TYPE`, …) — **S**
- [ ] **T-1.6** Mailer service (Nodemailer) + base templates; dev transport to MailHog — **M**
- [ ] **T-1.7** Upload middleware (`busboy` multipart, MIME + magic-byte check, size caps, random names); storage adapter (local/Cloudinary) — **M** 🧪
- [ ] **T-1.8** OpenAPI scaffold + `/api/docs` (non-prod) — **S** 📄
- [ ] **T-1.9** Test harness: Jest + Supertest + mongodb-memory-server (replica set), factories — **M**
- [ ] **T-1.10** **HTTP core — do first, unblocks T-1.2–T-1.8:** `core/router.js` (params, 404/405), `pipeline.js` (async onion + central error boundary), `context.js` (`ctx` + `json/noContent/setCookie`), `body.js` (JSON + 415 + limits), `cookies.js`, `static.js` (traversal-safe), `compress.js` — **L** 🧪 *(D-013, rules 3.1.7–3.1.9)*

**Exit:** health check, error envelope, validation, and test harness verified. 

---

## Phase 2 — Authentication & Users  *(M1)*

### Backend
- [ ] **T-2.1** `User` model (role enum, consent, indexes, `passwordHash select:false`, `toJSON` transform) — **S** 🧪 *(FR-AUTH-05)*
- [ ] **T-2.2** Register endpoint: roles exhibitor/attendee only, consent required, duplicate-email 409, bcrypt cost 12 — **M** 🧪 *(FR-AUTH-01, BR-1)*
- [ ] **T-2.3** Login + JWT access token + rotating refresh (httpOnly cookie, hashed storage, reuse detection) — **L** 🧪 *(FR-AUTH-02, NFR-SEC-02)*
- [ ] **T-2.4** Refresh / logout / `GET /auth/me` — **M** 🧪
- [ ] **T-2.5** `requireAuth`, `requireRole`, ownership helper — **S** 🧪 *(FR-AUTH-03, NFR-SEC-03)*
- [ ] **T-2.6** Forgot/reset password (hashed token, 30-min expiry, single-use, revoke sessions, no enumeration) — **M** 🧪 *(FR-AUTH-04)*
- [ ] **T-2.7** Auth rate limiting (10/15 min per IP+email) — **S** 🧪
- [ ] **T-2.8** Users: `PATCH /users/me`, change password — **S** 🧪 *(FR-AUTH-06)*
- [ ] **T-2.9** Admin seed script (idempotent) + sample users — **S**

### Frontend
- [ ] **T-2.10** App shell: providers, router, layouts per role, `ProtectedRoute`, 403/404 pages — **M** *(FR-AUTH-03)*
- [ ] **T-2.11** Axios instance + single-flight refresh interceptor; `AuthContext` bootstrap (refresh → me) — **M** 🧪
- [ ] **T-2.12** Core UI components: Button, Input, PasswordInput(+strength), Card, Badge, Modal/ConfirmDialog, Toast, Skeleton, EmptyState — **L** *(design §6)*
- [ ] **T-2.13** Pages: Login, Register (role + consent), Forgot, Reset — validation + a11y — **M** 🧪 *(FR-AUTH-01/02/04)*
- [ ] **T-2.14** Profile & account page (edit, change password) — **S** *(FR-AUTH-06)*

**Exit (M1):** register → login → role redirect → logout → reset password works end-to-end; E2E journey (d) green. 📄

---

## Phase 3 — Expos, Floor Plan & Booths  *(M2)*

### Backend
- [ ] **T-3.1** `Expo` model (+ slug, status lifecycle, indexes, text index) — **S** 🧪
- [ ] **T-3.2** Expo CRUD + publish/unpublish + public list/detail (filters, search, pagination) — **L** 🧪 *(FR-EXPO-01/02, BR-2)*
- [ ] **T-3.3** Expo delete rules (block/cascade with confirmation) — **S** 🧪 *(FR-EXPO-01)*
- [ ] **T-3.4** `Booth` model (unique `{expo, code}`, geometry, status) — **S** 🧪
- [ ] **T-3.5** Booth CRUD + bulk `PUT /expos/:id/booths` (overlap validation, atomic save) — **L** 🧪 *(FR-EXPO-03)*
- [ ] **T-3.6** **Atomic reserve** endpoint (`status:'available'` in filter; BR-3 approved-only; max 1 booth per expo) — **M** 🧪 *(FR-EXP-04, BR-3/4)*
- [ ] **T-3.7** Booth assign/unassign (admin) + release; booth detail edit (exhibitor-owner) — **M** 🧪 *(FR-EXH-03, FR-EXP-05)*
- [ ] **T-3.8** **Concurrency test**: N parallel reserves → exactly one success, rest 409 — **S** 🧪 *(rules 6.4)*
- [ ] **T-3.9** Expo status transition job (`published → ongoing → completed`) — **S** 🧪

### Frontend
- [ ] **T-3.10** Public home + expos list (search, filters) + expo detail shell with tabs — **M** *(FR-ATT-01)*
- [ ] **T-3.11** Admin: expo list + create/edit form (banner upload, dates, venue) + delete confirm (type title) — **L** 🧪 *(FR-EXPO-01/02)*
- [ ] **T-3.12** `FloorPlan` SVG component — **view** mode (pan/zoom, legend, status colours, a11y labels) — **L** *(design §8)*
- [ ] **T-3.13** `FloorPlan` **edit** mode (add/drag/resize/delete, grid snap, side panel, save) — **XL** *(FR-EXPO-03/04)*
- [ ] **T-3.14** `FloorPlan` **select** mode for exhibitors (select → confirm reserve; 409 UX) — **M** *(FR-EXP-03/04)*

**Exit:** admin designs a floor plan; booths persist; reserve race-safe. 📄

---

## Phase 4 — Exhibitor Profiles & Applications  *(M2)*

### Backend
- [ ] **T-4.1** `ExhibitorProfile` model + `GET/PUT /exhibitors/me` + document upload — **M** 🧪 *(FR-EXP-02)*
- [ ] **T-4.2** Public exhibitor search/filter (`q`, category, expo; text index; pagination) + public profile DTO — **M** 🧪 *(FR-ATT-03/04)*
- [ ] **T-4.3** `Application` model (unique `{expo, exhibitor}`, snapshot, prefs) — **S** 🧪
- [ ] **T-4.4** Submit / list-mine / withdraw application — **M** 🧪 *(FR-EXP-01/08)*
- [ ] **T-4.5** Admin list/filter applications — **S** 🧪 *(FR-EXH-01)*
- [ ] **T-4.6** Review endpoint: approve/reject (+booth) in a **transaction**; reason required on reject; notification + email — **L** 🧪 *(FR-EXH-02, rules 3.3.6)*

### Frontend
- [ ] **T-4.7** Exhibitor profile page (logo, description, contacts, staff, completeness meter) — **M** 🧪 *(FR-EXP-02)*
- [ ] **T-4.8** Application wizard (5 steps, doc upload, booth prefs on mini floor plan) — **L** 🧪 *(FR-EXP-01)*
- [ ] **T-4.9** Exhibitor dashboard: applications list + statuses + withdraw — **M** *(FR-EXP-08)*
- [ ] **T-4.10** Booth management page: details, products, staff, neighbours — **M** *(FR-EXP-05/07)*
- [ ] **T-4.11** Admin applications table + review drawer (approve with booth / reject with reason) — **L** 🧪 *(FR-EXH-01/02/03)*

**Exit (M2):** E2E journey (b) apply → approve → reserve green (live update added in Phase 7). 📄

---

## Phase 5 — Schedule & Sessions  *(M3)*

### Backend
- [ ] **T-5.1** `Session` model (types, speakers, capacity, status, indexes) — **S** 🧪
- [ ] **T-5.2** Session CRUD with validation: `end > start`, within expo dates, **no same-room overlap** (error names conflict) — **L** 🧪 *(FR-SCH-01/02, BR-6)*
- [ ] **T-5.3** Update/cancel flow: status `updated`/`cancelled`, block hard delete if registrations exist — **M** 🧪 *(FR-SCH-03, BR-8)*
- [ ] **T-5.4** Public schedule endpoint (filters: day, track, type, room) — **S** 🧪 *(FR-ATT-06)*

### Frontend
- [ ] **T-5.5** Admin schedule manager: day tabs, room×time grid (desktop) / list (mobile), add/edit modal, speakers repeater, conflict errors — **XL** 🧪 *(FR-SCH-01/02/03)*
- [ ] **T-5.6** Public/attendee `ScheduleTimeline` with filters and status chips (updated/cancelled) — **M** 🧪 *(FR-ATT-06)*

**Exit:** admin manages schedule; conflicts blocked; schedule visible publicly. 📄

---

## Phase 6 — Attendee Features  *(M3)*

### Backend
- [ ] **T-6.1** `ExpoRegistration` (ticket code, unique `{user, expo}`) + register/list-mine (idempotent) — **M** 🧪 *(FR-ATT-02)*
- [ ] **T-6.2** `SessionEngagement`: register/unregister (needs expo registration, capacity atomic, conflict warning) — **L** 🧪 *(FR-ATT-02, BR-7)*
- [ ] **T-6.3** Bookmark/unbookmark (idempotent) + `GET /sessions/me` — **S** 🧪 *(FR-ATT-06/08)*
- [ ] **T-6.4** Reminder job (every minute; 15-min lead; `reminderSentAt`; reschedule on time change) — **M** 🧪 *(FR-ATT-07)*

### Frontend
- [ ] **T-6.5** Expo registration CTA + ticket view + "My registrations" — **M** 🧪 *(FR-ATT-02)*
- [ ] **T-6.6** Session cards with Register/Bookmark actions, capacity badges — **M** 🧪
- [ ] **T-6.7** Exhibitor directory: debounced search, category chips, pagination, empty state — **M** 🧪 *(FR-ATT-03)*
- [ ] **T-6.8** Exhibitor profile page (public) with "Show on floor plan" (highlight booth) — **M** *(FR-ATT-04)*
- [ ] **T-6.9** Attendee dashboard + **My agenda** (grouped by day, change/cancel banners) — **M** *(FR-ATT-08)*
- [ ] **T-6.10** (P2) "Add to calendar" `.ics` export — **S**

**Exit (M3):** E2E journey (c) attendee register → bookmark → reminder green. 📄

---

## Phase 7 — Real-Time, Messaging, Notifications & Feedback  *(M4)*

### Real-time
- [ ] **T-7.1** Socket.IO server bootstrap, JWT handshake auth, room join rules — **M** 🧪 *(FR-SYS-01, rules 3.5)*
- [ ] **T-7.2** Emit events from services after writes: `expo:updated`, `booth:updated`, `schedule:updated`, `application:*` — **M** 🧪
- [ ] **T-7.3** Client `SocketProvider` (reconnect with refreshed token, connection banner) + query-invalidation hooks — **M** 🧪 *(FR-SYS-01)*
- [ ] **T-7.4** Live highlight UX on changed booths/sessions; screen-reader live-region announcements — **S** *(design §8, §9)*

### Notifications
- [ ] **T-7.5** `Notification` model + service (`notify(user, type, payload)`) + REST (list, read, read-all) — **M** 🧪 *(FR-SYS-03)*
- [ ] **T-7.6** Hook notifications into: application result, booth assigned/changed, session updated/cancelled, reminders, new message — **M** 🧪
- [ ] **T-7.7** `NotificationBell` + notifications page — **M** 🧪

### Messaging
- [ ] **T-7.8** `Conversation`/`Message` models + REST + role rules (BR-9, same-expo neighbours) — **L** 🧪 *(FR-EXP-06/07, FR-ATT-05)*
- [ ] **T-7.9** Socket chat: send, typing, read receipts, unread counts — **M** 🧪
- [ ] **T-7.10** Messaging UI (two-pane / mobile stack), entry points from profile, booth popover, "Contact organizer" — **L** 🧪

### Feedback
- [ ] **T-7.11** `Feedback` model + submit + admin triage endpoints — **S** 🧪 *(FR-SYS-02, FR-ADM-01)*
- [ ] **T-7.12** Feedback form (all roles) + admin inbox with status chips — **M** 🧪

**Exit (M4):** two browser contexts show live booth/schedule changes in < 2 s; chat & notifications work. 📄

---

## Phase 8 — Analytics & Reports  *(M5)*

- [ ] **T-8.1** `AnalyticsEvent` model + `POST /analytics/events` (throttled, deduped) — **M** 🧪
- [ ] **T-8.2** Instrument client: booth view/visit, profile view, session view/check-in, search — **M** 🧪
- [ ] **T-8.3** Aggregation endpoints: summary KPIs, engagement over time, booth traffic ranking, session popularity — **L** 🧪 *(FR-ANA-01)*
- [ ] **T-8.4** Admin dashboard UI: StatCards, line/bar/donut (Recharts), date range, "View as table" — **L** 🧪 *(FR-ANA-01)*
- [ ] **T-8.5** Real-time KPI ticks via `admin:{expoId}` (throttled) — **M** 🧪 *(FR-ANA-02)*
- [ ] **T-8.6** (P2) CSV export — **S** *(FR-ANA-03)*
- [ ] **T-8.7** Admin: users list/deactivate — **S** 🧪 *(FR-ADM-01)*

**Exit:** dashboard reflects seeded + live activity accurately. 📄

---

## Phase 9 — Hardening: Security, Privacy, A11y, Performance, QA  *(M5)*

### Privacy & security
- [ ] **T-9.1** Privacy: policy page, consent management UI, `GET /users/me/export`, `DELETE /users/me` (anonymise) — **L** 🧪 *(FR-SYS-05, NFR-PRIV-01/02/03)*
- [ ] **T-9.2** Authorization audit: matrix test per route × role (401/403/ownership) — **L** 🧪 *(NFR-SEC-03)*
- [ ] **T-9.3** Security review: OWASP Top-10 checklist, `npm audit`, ZAP baseline, header review, upload abuse tests — **M** *(NFR-SEC-05)*
- [ ] **T-9.4** Log redaction verification; error leakage check in prod mode — **S** 🧪

### Quality
- [ ] **T-9.5** E2E suite (Playwright): journeys (a)–(d) incl. 2-context real-time check — **L** 🧪 *(rules 6.6)*
- [ ] **T-9.6** Accessibility pass: axe on key pages, keyboard-only walkthrough, screen-reader check (login, apply, reserve, session register), contrast audit both themes — **L** *(NFR-UX-02, design §12)*
- [ ] **T-9.7** Cross-browser (Chrome/Firefox/Safari/Edge) + mobile viewport checks — **M** *(NFR-COMP-01/02)*
- [ ] **T-9.8** Performance: indexes review (`explain`), bundle analysis, Lighthouse, load test (k6/Artillery) incl. reserve endpoint; record results — **L** *(NFR-PERF-01/02/03)*
- [ ] **T-9.9** Reliability: graceful shutdown, `/metrics`, backup script (`mongodump`) + **restore drill** documented — **M** *(NFR-REL-01/02, NFR-OPS-01)*
- [ ] **T-9.10** Coverage report ≥ gates; fix gaps — **M** *(NFR-QA-01)*

**Exit (M5):** all NFR verification items recorded in `/docs/testing`; zero high-severity findings. 

---

## Phase 10 — Documentation, Demo Video & Delivery  *(M6)*

- [ ] **T-10.1** **User guide** per role (Admin, Exhibitor, Attendee) with screenshots + FAQ + short tutorials — **L** 📄 *(NFR-DOC-01)*
- [ ] **T-10.2** **Developer guide**: setup, architecture overview, folder map, conventions, how to add a module, API reference export (OpenAPI → HTML/PDF) — **L** 📄 *(NFR-DOC-02)*
- [ ] **T-10.3** Final pass on `prd.md`, `architecture.md`, `design.md`, `rules.md`, `memory.md` to match what was actually built — **M** 📄
- [ ] **T-10.4** Deployment: staging/production (client + API + Atlas + SMTP), env checklist, smoke test; seeded demo data — **L**
- [ ] **T-10.5** **Demo video script & storyboard** (covers: register/login, admin creates expo + floor plan, exhibitor applies → approved → reserves booth, live update on 2nd screen, schedule creation + change notification, attendee search/register/bookmark/reminder, messaging, analytics, feedback, privacy export) — **M** *(NFR-DOC-03)*
- [ ] **T-10.6** **Record & edit demo video** (5–10 min, narrated, captions); export + upload; link in README — **L** *(NFR-DOC-03)*
- [ ] **T-10.7** Test report & coverage summary in `/docs/testing` — **S**
- [ ] **T-10.8** Submission package: source zip (no `node_modules`/secrets), docs, video link, README, credentials for demo accounts → send to **eProjects Team** — **S**
- [ ] **T-10.9** Final retrospective: update `memory.md`, close open questions, tag release `v1.0.0` — **S**

**Exit (M6):** all deliverables D1–D6 in `prd.md` §8 delivered. 

---

## Requirement → Task Traceability

| Requirement | Tasks |
|-------------|-------|
| FR-AUTH-01…06 | T-2.1–2.8, 2.10–2.14 |
| FR-EXPO-01…04 | T-3.1–3.5, 3.11–3.13 |
| FR-EXH-01…03 | T-3.7, 4.5, 4.6, 4.11 |
| FR-SCH-01…03 | T-5.1–5.3, 5.5 |
| FR-ANA-01…03 | T-8.1–8.6 |
| FR-ADM-01 | T-7.11, 7.12, 8.7 |
| FR-EXP-01…08 | T-3.6, 3.14, 4.1, 4.3, 4.4, 4.7–4.10, 7.8–7.10 |
| FR-ATT-01…08 | T-3.10, 4.2, 5.4, 5.6, 6.1–6.9, 7.8–7.10 |
| FR-SYS-01…05 | T-7.1–7.7, 7.11–7.12, 9.1 |
| NFR-PERF | T-9.8 |
| NFR-SEC | T-1.4, 2.3, 2.5, 2.7, 9.2–9.4 |
| NFR-PRIV | T-9.1 |
| NFR-REL / OPS | T-1.1, 9.9 |
| NFR-UX / COMP | T-2.12, 9.6, 9.7 |
| NFR-QA | T-1.9, 9.5, 9.10 |
| NFR-DOC-01/02/03 | T-10.1, 10.2, 10.5, 10.6 |

---

## Backlog / Parking Lot (post-v1)

- [ ] Online payments for booths *(Q-01)*
- [ ] QR check-in *(Q-04)*
- [ ] i18n / RTL *(Q-05)*
- [ ] Waitlist for full sessions *(Q-08)*
- [ ] Shared Zod schema package *(Q-07)*
- [ ] Redis adapter + horizontal Socket.IO scale-out
- [ ] Re-open reviewed applications
- [ ] Web push notifications
- [ ] Multi-booth per exhibitor

---

## Working Notes

- **Start each session:** read `memory.md` → pick the next unchecked task → confirm PRD IDs.
- **End each session:** tick tasks, update Progress Overview, append to `memory.md` §10.
- **Blocked?** Log it in `memory.md` §9 with the task ID and what's needed.
