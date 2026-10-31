# EventSphere Management — Project Memory

> **Purpose:** Single source of truth for _context that must survive between work sessions_ (human or AI). Read this file **first** at the start of every session; update it **last** at the end of every session.
> **Related docs:** [prd.md](./prd.md) · [architecture.md](./architecture.md) · [design.md](./design.md) · [rules.md](./rules.md) · [tasks.md](./tasks.md)

---

## 0. How to Use This File

1. **Start of session:** read §1 (snapshot), §2 (status), §8 (open questions), and the latest entry in §10 (session log).
2. **During work:** if you make a decision that others must know, add it to §5 (decision log) immediately.
3. **End of session:** update §2 (status), tick items in `tasks.md`, append an entry to §10, and move resolved questions out of §8.
4. **Never store secrets** (API keys, passwords, connection strings) here.
5. If this file conflicts with `prd.md` / `architecture.md`, **the PRD and architecture win** — fix this file.

---

## 1. Project Snapshot

| Item                                  | Value                                                                                                                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**                              | EventSphere Management — expo & trade-show management platform                                                                                                                                                       |
| **Origin**                            | Aptech **eProject** (React + Node.js + MongoDB; Express deliberately omitted — D-013). Deliverables: working app, source code, full documentation, demo video, sent to the eProjects Team                            |
| **Client (fictional)**                | EventSphere Management — large-scale expo organiser                                                                                                                                                                  |
| **Problem**                           | Manual registration, disjointed communication, no real-time event info for organizers, exhibitors, attendees                                                                                                         |
| **Solution**                          | Web app with 3 roles (admin/organizer, exhibitor, attendee): auth, expo + floor plan + booth management, exhibitor applications, schedules, search, messaging, notifications, analytics, feedback, real-time updates |
| **Stack**                             | MongoDB · **plain Node.js 20 `http` (no Express)** · React 18 (Vite) · **Bootstrap 5.3 + React-Bootstrap** · Socket.IO · TanStack Query · Zod · JWT                                                                  |
| **Repo layout**                       | Monorepo: `/client`, `/server`, `/docs`                                                                                                                                                                              |
| **Source brief**                      | `MERN-EventSphere_Management.docx` (Introduction, Objectives, Background, FRs, NFRs, HW/SW)                                                                                                                          |
| **Hardware/Software note from brief** | Windows OS + MongoDB/Express/React/Node.js + any editor. (Project owner chose to omit Express — D-013.) (Brief lists very old hardware specs — ignore; target modern dev machines.)                                  |

---

## 2. Current Status

| Area                       | Status           | Notes                                              |
| -------------------------- | ---------------- | -------------------------------------------------- |
| Requirements analysis      | ✅ Done          | Brief digested → `prd.md`                          |
| Architecture               | ✅ Baseline v1.0 | `architecture.md`                                  |
| Design system & wireframes | ✅ Baseline v1.0 | `design.md`                                        |
| Rules/conventions          | ✅ Baseline v1.0 | `rules.md`                                         |
| Task plan                  | ✅ Baseline v1.0 | `tasks.md`                                         |
| Repo scaffolding           | ✅ Done          | Phase 0 complete — committed & pushed to main      |
| Backend                    | 🔄 In progress   | T-1.10 HTTP core done (93 tests); T-1.1–T-1.9 next |
| Frontend                   | ⬜ Not started   |                                                    |
| Testing                    | ⬜ Not started   |                                                    |
| Documentation (user/dev)   | ⬜ Not started   |                                                    |
| Demo video                 | ⬜ Not started   |                                                    |

**Current phase:** Phase 0 ✅ complete → Phase 1 🔄 in progress (T-1.10 done).
**Next action:** T-1.1 (Mongo connection + `/health`), T-1.2 (utilities), T-1.3–T-1.9 (middleware, security, mailer, uploads, OpenAPI, test harness).

---

## 3. Glossary (Ubiquitous Language)

Use these exact terms in code, UI, and docs.

| Term                  | Meaning                                                            | Code name                            |
| --------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| **Expo**              | A single expo/trade-show event                                     | `Expo`                               |
| **Organizer / Admin** | Staff who run expos (same role)                                    | role `admin`                         |
| **Exhibitor**         | Company that exhibits at an expo                                   | role `exhibitor`, `ExhibitorProfile` |
| **Attendee**          | Visitor attending an expo                                          | role `attendee`                      |
| **Booth**             | A rentable space on the floor plan                                 | `Booth`                              |
| **Floor plan**        | 2D layout of an expo's booths                                      | `expo.floorPlan` + `Booth[]`         |
| **Application**       | Exhibitor's request to take part in an expo                        | `Application`                        |
| **Session**           | A scheduled talk/keynote/workshop                                  | `Session`                            |
| **Engagement**        | Attendee's bookmark or registration for a session                  | `SessionEngagement`                  |
| **Expo registration** | Attendee's ticket for an expo                                      | `ExpoRegistration`                   |
| **Reserve**           | Exhibitor claims an _available_ booth (needs approved application) | `POST /booths/:id/reserve`           |
| **Allocate / Assign** | Admin sets a booth to an exhibitor                                 | `status: 'allocated'`                |
| **Conversation**      | A 1:1 message thread                                               | `Conversation`                       |

---

## 4. Core Facts & Invariants (do not violate)

1. Roles are exactly `admin`, `exhibitor`, `attendee`. **Admins are never created via public registration.**
2. Passwords are hashed with bcrypt (cost ≥ 12); `passwordHash` is never returned by any API.
3. Access token lives **in memory** on the client; refresh token is an **httpOnly cookie**.
4. An exhibitor can reserve a booth **only after** their application for that expo is `approved`.
5. Booth reservation must be **atomic** — no double booking. Conflicts return `409`.
6. Sessions in the same room must **not overlap in time**.
7. All API responses use the envelope `{ success, data, meta? }` or `{ success:false, error:{code,message,details?} }`.
8. All inputs are validated with **Zod** at the route boundary.
9. Real-time events **invalidate** client queries; clients don't hand-edit server data.
10. Privacy: consent is stored with timestamp; users can export and delete their data.
11. Every list endpoint is paginated (default 20, max 100).
12. No secrets in the repo; `.env.example` is maintained.
13. **No Express** (or Express-style frameworks). HTTP is native `node:http` + `server/src/core`. **Bootstrap is the only CSS framework.**

---

## 5. Decision Log

> Format: `ID · date · decision · why · alternatives rejected`. Append only; supersede rather than edit.

| ID    | Date          | Decision                                                                                                                                                                                                                 | Why                                                | Rejected                              |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------- |
| D-001 | Project start | Modular monolith (plain Node.js `http`)                                                                                                                                                                                  | Right-sized; simpler ops for eProject              | Microservices (overkill)              |
| D-002 | Project start | Vite + React 18 (not CRA/Next)                                                                                                                                                                                           | Fast, matches "React" requirement; CRA deprecated  | Next.js (SSR not required)            |
| D-003 | Project start | JWT access (memory) + rotating refresh (httpOnly cookie)                                                                                                                                                                 | XSS-safer than localStorage                        | Single long-lived token               |
| D-004 | Project start | Socket.IO for real-time                                                                                                                                                                                                  | Rooms, reconnection, ack                           | Raw WS, polling/SSE only              |
| D-005 | Project start | Custom SVG floor-plan                                                                                                                                                                                                    | Accessible, controllable                           | Image map, heavy canvas lib           |
| D-006 | Project start | Zod for validation                                                                                                                                                                                                       | Clear errors; shared vocabulary                    | Joi, Yup                              |
| D-007 | Project start | TanStack Query + Context (no Redux)                                                                                                                                                                                      | Server-state heavy app                             | Redux Toolkit                         |
| D-008 | Project start | Bootstrap 5.3 + React-Bootstrap, themed via Sass tokens from `design.md` _(revised in v1.1; was Tailwind)_                                                                                                               | Owner preference; fast responsive UI               | Tailwind, MUI                         |
| D-009 | Project start | Admin = Organizer (one role)                                                                                                                                                                                             | Brief says "admin/organizer"                       | Separate organizer role (YAGNI)       |
| D-010 | Project start | Exhibitor→exhibitor messaging limited to neighbours in same expo                                                                                                                                                         | Brief: "neighboring exhibitors"; limits spam       | Open messaging between all exhibitors |
| D-011 | Project start | Language: JavaScript (ES2022) + JSDoc                                                                                                                                                                                    | Aligned with eProject scope; lower barrier         | TypeScript (optional later)           |
| D-012 | Project start | Email via Nodemailer (Ethereal/MailHog in dev)                                                                                                                                                                           | Needed for reset + reminders                       | Third-party SDK lock-in               |
| D-013 | v1.1          | **No Express.** Backend = native Node.js `http` + small in-house core (`server/src/core`)                                                                                                                                | Owner requirement                                  | Express, Koa, Fastify, NestJS         |
| D-014 | v1.1          | **Bootstrap** is the only CSS framework; JS behaviours via React-Bootstrap, not Bootstrap's JS bundle                                                                                                                    | Owner requirement; avoids DOM conflicts with React | Tailwind, MUI, mixed frameworks       |
| D-015 | v1.1          | Replace Express-ecosystem packages with in-house/neutral equivalents: Multer→`busboy`; helmet/cors/hpp/mongo-sanitize/express-rate-limit→`core/security.js` + `core/rate-limit.js`; swagger-ui-express→static Swagger UI | They depend on Express conventions                 | Adapters/shims around Express         |

---

## 6. Conventions Cheat-Sheet

_(Full details in `rules.md`.)_

- **Branches:** `main` (protected) ← `feat/<scope>-<short>` · `fix/…` · `chore/…`
- **Commits:** Conventional Commits — `feat(booths): atomic reserve endpoint`
- **Files:** server `kebab-case.js` with suffix (`expo.service.js`); client components `PascalCase.jsx`, hooks `useThing.js`
- **API paths:** plural nouns, kebab-case, `/api/v1/...`
- **DB:** collections plural lowercase; fields camelCase; always define indexes in the model
- **Env:** only via `config/env.js` (validated with Zod) — never `process.env` directly elsewhere
- **Tests:** colocate `*.test.js`; every service function has a unit test; every route has an integration test per role (allowed + denied)
- **Definition of Done:** see `rules.md` §14

---

## 7. Environment & Local Setup (non-secret)

| Item            | Value                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Node            | 20 LTS                                                                                                                |
| Package manager | npm (workspaces)                                                                                                      |
| API dev URL     | `http://localhost:5000`                                                                                               |
| Client dev URL  | `http://localhost:5173`                                                                                               |
| Mongo (dev)     | `mongodb://localhost:27017/eventsphere` (replica set enabled for transactions — e.g. Docker `--replSet rs0` or Atlas) |
| Mail (dev)      | MailHog `localhost:8025` or Ethereal                                                                                  |
| API docs        | `http://localhost:5000/api/docs` (dev only)                                                                           |
| Seed            | `npm run seed -w server` → creates admin, sample expos, exhibitors, attendees                                         |

**Seed credentials (dev only):** `admin@eventsphere.test` / `exhibitor@eventsphere.test` / `attendee@eventsphere.test` — password set in `server/seed/README` (not stored here).

---

## 8. Open Questions

| #    | Question                                                                                             | Impact          | Owner   | Status                                                               |
| ---- | ---------------------------------------------------------------------------------------------------- | --------------- | ------- | -------------------------------------------------------------------- |
| Q-01 | Is a **payment** step for booths required? (Brief doesn't mention it)                                | Scope           | Product | Assumed **No** (price is informational)                              |
| Q-02 | Should exhibitors need approval **per expo**, or once globally?                                      | Data model      | Product | Assumed **per expo**                                                 |
| Q-03 | Should attendees need an expo ticket before registering for sessions?                                | Rules           | Product | Assumed **Yes** (must be registered for the expo)                    |
| Q-04 | Do we need QR check-in at the venue?                                                                 | Scope           | Product | Assumed **Out of scope** (ticket code only)                          |
| Q-05 | Multi-language / RTL support?                                                                        | UI              | Product | Assumed **English only**                                             |
| Q-06 | Which hosting will be used for the demo?                                                             | Deployment      | Dev     | Open — default Render + Atlas + Netlify                              |
| Q-07 | Is a shared Zod package between client/server worth the setup cost?                                  | DX              | Dev     | Open — start duplicated, revisit                                     |
| Q-08 | Session capacity: hard limit with waitlist, or soft?                                                 | Rules           | Product | Assumed **hard limit, no waitlist**                                  |
| Q-09 | The brief names the **MERN** stack. Will the eProjects Team accept a Node-only backend (no Express)? | Evaluation risk | Owner   | Open — owner decided to proceed (D-013); mention in submission notes |

---

## 9. Known Risks & Watch-Outs

- **Double booking** under concurrency → covered by atomic update + test (see `architecture.md` §6.3).
- **Replica set requirement** for transactions in local Mongo → provide docker-compose with `--replSet`.
- **Hand-rolled HTTP core** can sprawl or hide security bugs → keep `core/` small (~400 lines), unit-test each module, security-review it (T-9.3); never re-implement framework features we don't need.
- **Bootstrap JS vs React** → use React-Bootstrap only; no `data-bs-*` imperative behaviour.
- **Floor-plan editor** can balloon in scope → MVP = rectangles + grid snap only.
- **Socket auth expiry** → on token refresh, reconnect socket with the new token.
- **Timezones** → store UTC; display in expo venue timezone; label it.
- **Deliverables outside code** (user docs, developer docs, **demo video**) are mandatory in the brief — don't leave to the end (see `tasks.md` Phase 9).

---

## 10. Session Log (append newest at the bottom)

### Session 0 — Planning

- **Input:** `MERN-EventSphere_Management.docx` analysed.
- **Output:** Created `architecture.md`, `design.md`, `memory.md`, `prd.md`, `rules.md`, `tasks.md` (baseline v1.0).
- **Decisions:** D-001 → D-012 recorded above.
- **Assumptions:** Q-01 → Q-08 recorded in §8.
- **Next:** Phase 0 scaffolding.

### Session 2 — Oct 31 2026 — Phase 0 + T-1.10 scaffold

- **Goal:** Scaffold full monorepo, tooling, and HTTP core.
- **Done:** T-0.1, T-0.2, T-0.3, T-0.4, T-0.5, T-0.6, T-0.7, T-0.8, T-0.9, T-1.10
- **Decisions:** Jest ESM setup via `node --experimental-vm-modules ../node_modules/jest/bin/jest.js` (hoisted in workspace); `jest.config.cjs` without `extensionsToTreatAsEsm` (`.js` already inferred from `"type":"module"`).
- **Problems / blockers:** PowerShell execution policy required `cmd /c` wrapper for npm; `.bin/jest` shell wrapper not runnable on Windows — must call `jest/bin/jest.js` directly via node.
- **Next:** T-1.1 Mongo connection + /health, then T-1.2–T-1.9 to complete Phase 1 backend foundation.
- **Goal:** Apply owner's stack choice: React + Bootstrap, plain Node.js without Express; rest unchanged.
- **Done:** Updated all six docs (architecture §4/§5.3/§11/ADRs, design §5/§6.1/§11, rules §3/§4/§5, tasks Phase 0–1, prd header, this file).
- **Decisions:** D-013, D-014, D-015; D-008 revised.
- **Open:** Q-09 (is Node-only backend acceptable for the brief's "MERN"?).
- **Next:** Phase 0 scaffolding, then T-1.10 (HTTP core) before other Phase 1 tasks.

<!-- TEMPLATE
### Session N — <date> — <short title>
- **Goal:**
- **Done:** (link task IDs, e.g. T-2.3, T-2.4)
- **Decisions:** (new D-IDs)
- **Problems / blockers:**
- **Next:**
-->

---

## 11. Quick Links

| Need                                        | Where             |
| ------------------------------------------- | ----------------- |
| What are we building / acceptance criteria? | `prd.md`          |
| How is it built? Data model? API?           | `architecture.md` |
| What does it look like? Flows? Components?  | `design.md`       |
| How must code be written?                   | `rules.md`        |
| What's next to do?                          | `tasks.md`        |
