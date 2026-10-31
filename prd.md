# EventSphere Management — Product Requirements Document (PRD)

> **Version:** 1.1 · **Type:** Web application — React + Bootstrap frontend, plain Node.js backend (no Express), MongoDB (Aptech eProject)
> **Related docs:** [architecture.md](./architecture.md) · [design.md](./design.md) · [rules.md](./rules.md) · [tasks.md](./tasks.md) · [memory.md](./memory.md)
> **Requirement IDs** (e.g. `FR-AUTH-01`) are referenced by `tasks.md` for traceability.

---

## 1. Overview

### 1.1 Background
**EventSphere Management** is a leading event-management firm that organises large-scale expos and trade shows. Traditional expo management suffers from manual registration, disjointed communication channels, and limited access to real-time event information, affecting organizers, exhibitors, and attendees alike.

### 1.2 Product Vision
> *A single, secure, real-time platform where organizers run expos, exhibitors win and manage booths, and attendees plan their visit — replacing spreadsheets, email chains, and printed schedules.*

### 1.3 Problem Statement
- Organizers lack a central tool to manage expos, floor plans, exhibitor applications, schedules, and analytics.
- Exhibitors can't see booth availability, apply easily, or communicate quickly with organizers/neighbours.
- Attendees can't easily discover exhibitors, view schedules, register, or get reminders.
- Changes (schedule, booth) aren't communicated in real time.

### 1.4 Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | Digitise end-to-end expo management for 3 roles | All FRs in §6 implemented |
| G2 | Eliminate manual exhibitor onboarding | Apply → approve → reserve fully online |
| G3 | Real-time information | Schedule/booth changes visible to others in < 2 s without refresh |
| G4 | Data-driven decisions | Organizer dashboard with engagement, booth traffic, session popularity |
| G5 | Secure & privacy-respecting | Meets §7 security/privacy requirements |
| G6 | Meet eProject deliverables | Source code + documentation + working-app video |

### 1.5 Non-Goals (Out of Scope for v1)
- Online payments / invoicing for booths *(Q-01)*
- QR/NFC on-site check-in hardware *(Q-04)*
- Native mobile apps (responsive web only)
- Multi-language / RTL *(Q-05)*
- Video streaming / virtual-expo hosting
- Third-party calendar sync (optional `.ics` export only)
- Ticket sales / paid ticketing

### 1.6 Assumptions
See `memory.md` §8: per-expo exhibitor approval; attendees must register for an expo before registering for its sessions; hard session capacity without waitlist.

**Technology constraints (owner decisions D-013/D-014):** frontend = React + Bootstrap; backend = plain Node.js with no Express; database = MongoDB.

---

## 2. Users & Personas

| Role | Description | Key needs |
|------|-------------|-----------|
| **Admin / Organizer** | Staff running expos | Create expos, floor plans, review exhibitors, manage schedule, analytics |
| **Exhibitor** | Company representative | Apply, reserve booth, manage profile/booth, communicate |
| **Attendee** | Visitor | Discover, register, search exhibitors, plan agenda, reminders |

Detailed personas and journeys: `design.md` §2 and §4.

---

## 3. Role / Permission Matrix

| Capability | Guest | Attendee | Exhibitor | Admin |
|------------|:----:|:--------:|:---------:|:-----:|
| View published expos, schedule, exhibitor list, floor plan | ✅ | ✅ | ✅ | ✅ |
| Register / log in | ✅ | — | — | — |
| Register for expo / sessions, bookmark | ❌ | ✅ | ❌ | ❌ |
| Bookmark sessions | ❌ | ✅ | ✅ | ✅ |
| Apply to expo, reserve booth, manage own booth/profile | ❌ | ❌ | ✅ | ❌ |
| Message exhibitors | ❌ | ✅ | ✅ | ✅ |
| Message organizers (support) | ❌ | ✅ | ✅ | — |
| Create/edit/delete expos, floor plan, sessions | ❌ | ❌ | ❌ | ✅ |
| Approve/reject applications, assign booths | ❌ | ❌ | ❌ | ✅ |
| View analytics/reports | ❌ | ❌ | ❌ | ✅ |
| Submit feedback | ❌ | ✅ | ✅ | ✅ |
| Manage users / triage feedback | ❌ | ❌ | ❌ | ✅ |

---

## 4. User Stories & Acceptance Criteria

> Priority: **P0** = must have (MVP) · **P1** = should have · **P2** = nice to have.

### 4.1 Authentication (AUTH)

| ID | Story | Priority |
|----|-------|----------|
| **FR-AUTH-01** | As a visitor, I can **register** as an exhibitor or attendee so that I can use the platform. | P0 |
| **FR-AUTH-02** | As a user, I can **log in/out** securely. | P0 |
| **FR-AUTH-03** | The system **differentiates roles** (admin/organizer, exhibitor, attendee) and routes me to my area. | P0 |
| **FR-AUTH-04** | As a user, I can **reset a forgotten password** via email. | P0 |
| **FR-AUTH-05** | Passwords are **encrypted** (hashed) at rest. | P0 |
| **FR-AUTH-06** | As a user, I can update my profile and change my password. | P1 |

**Acceptance criteria**
- AUTH-01: Given valid name/email/password/role(exhibitor|attendee) and accepted privacy consent, when I submit, then an account is created, I'm signed in, and landed on my role dashboard. Duplicate email → `409` with clear message. Role `admin` cannot be selected/submitted. Password ≥ 8 chars with letters + numbers.
- AUTH-02: Valid credentials → access token + refresh cookie; invalid → generic "Invalid email or password". After 10 failed attempts/15 min → `429`. Logout revokes refresh token.
- AUTH-03: Visiting another role's route redirects to own dashboard (403 on API).
- AUTH-04: Requesting reset always shows the same success message (no account enumeration). Link expires in 30 min, single use; after reset all sessions are revoked.
- AUTH-05: DB never contains plaintext passwords; bcrypt cost ≥ 12; hash never returned by API.

### 4.2 Admin / Organizer (ADM)

| ID | Story | Priority |
|----|-------|----------|
| **FR-EXPO-01** | As an admin, I can **create, edit, and delete expos** (title, date, location, description, theme, banner). | P0 |
| **FR-EXPO-02** | I can **publish/unpublish** an expo and see its status lifecycle. | P0 |
| **FR-EXPO-03** | I can **design a floor plan** and **allocate booth spaces** (code, size, position, price, status). | P0 |
| **FR-EXPO-04** | Floor plan editor supports drag, resize, grid snap, delete. | P1 |
| **FR-EXH-01** | I can **view exhibitor registrations/applications** with filters by status. | P0 |
| **FR-EXH-02** | I can **approve or reject** applications (reason required on reject). | P0 |
| **FR-EXH-03** | I can **assign booth spaces** and manage booth details. | P0 |
| **FR-SCH-01** | I can **create and manage schedules**: sessions with time slots, rooms, and types. | P0 |
| **FR-SCH-02** | I can **assign speakers, topics, locations** to sessions. | P0 |
| **FR-SCH-03** | I can **update/cancel** sessions; affected users are notified. | P0 |
| **FR-ANA-01** | I can **generate reports** on attendee engagement, booth traffic, session popularity. | P0 |
| **FR-ANA-02** | I see **real-time analytics** on expo performance. | P1 |
| **FR-ANA-03** | I can export reports as CSV. | P2 |
| **FR-ADM-01** | I can manage users (list, deactivate) and triage feedback. | P1 |

**Acceptance criteria**
- EXPO-01: Required: title, start/end date, venue; `end ≥ start`. Edit/delete confirm dialogs; deleting an expo with approved exhibitors/registrations requires explicit confirmation and cascades cleanly (or is blocked with explanation).
- EXPO-02: Only `published` expos appear to non-admins. Status transitions: `draft → published → ongoing → completed`, `cancelled` from any pre-completed state.
- EXPO-03: Booth codes unique per expo; booths cannot overlap on the canvas; layout saves atomically; status colours per `design.md` §5.3.
- EXH-02: Approving sets application `approved`, optionally assigns a booth, sends in-app + email notification. Rejecting stores reason and notifies. Already-reviewed applications can't be re-reviewed without an explicit "reopen" action *(P2)*.
- EXH-03: Assigning marks booth `allocated`; unassigning returns it to `available`. Live update emitted.
- SCH-01/02: Validation rejects `end ≤ start` and same-room overlaps (error names the conflicting session). Speakers: name required; org/bio optional.
- SCH-03: Updating time/room/location marks session `updated`; cancelling marks `cancelled`; users with bookmark/registration get notification; open views refresh in real time.
- ANA-01: Dashboard shows counts + charts for selected expo/date-range: registrations over time, booth views/visits per booth, session registrations/check-ins/bookmarks; includes "View as table".
- ANA-02: KPI tiles update via socket without refresh (throttled).

### 4.3 Exhibitor Portal (EXP)

| ID | Story | Priority |
|----|-------|----------|
| **FR-EXP-01** | As an exhibitor, I can **register for expos** by submitting company details, products/services, and documents. | P0 |
| **FR-EXP-02** | I can **create/update my profile** (logo, description, contacts, staff). | P0 |
| **FR-EXP-03** | I can **view available booths on the floor plan**. | P0 |
| **FR-EXP-04** | I can **select and reserve** a booth (after approval). | P0 |
| **FR-EXP-05** | I can **manage booth details** (products/services showcased, staff info). | P0 |
| **FR-EXP-06** | I can **message organizers** for inquiries/support. | P0 |
| **FR-EXP-07** | I can **interact with neighbouring exhibitors** via messaging/contact exchange. | P1 |
| **FR-EXP-08** | I can track application status and withdraw while pending. | P0 |

**Acceptance criteria**
- EXP-01: One application per exhibitor per expo; required company name, category, ≥ 1 product/service; documents: PDF/PNG/JPG ≤ 10 MB each (max 5). Submit → status `pending`; admin notified.
- EXP-02: Logo ≤ 2 MB (png/jpg/webp); profile completeness indicator; changes reflected in public directory immediately.
- EXP-03: Floor plan shows legend + live statuses; non-approved exhibitors can *view* but not reserve.
- EXP-04: Reserve is atomic; if lost race → `409` + friendly message + plan refreshes; success updates everyone's view in < 2 s; exhibitor may hold **max 1 booth per expo** (P0 assumption; configurable later).
- EXP-05: Only the booth's exhibitor can edit details; changes visible on public profile/booth popover.
- EXP-06: Starts/continues a support conversation with organizers; unread badge; email fallback notification if offline *(P2)*.
- EXP-07: Messaging allowed only with exhibitors whose booths are in the same expo (D-010); contact exchange shows only fields the neighbour made public.

### 4.4 Attendee Interface (ATT)

| ID | Story | Priority |
|----|-------|----------|
| **FR-ATT-01** | As an attendee, I can **view event details**: schedule, exhibitor list, floor plan. | P0 |
| **FR-ATT-02** | I can **register for an expo** and for **sessions/workshops**. | P0 |
| **FR-ATT-03** | I can **search and filter exhibitors** by category, product, or keyword. | P0 |
| **FR-ATT-04** | I can **view exhibitor profiles and booth locations** on the floor plan. | P0 |
| **FR-ATT-05** | I can **contact exhibitors** (chat/email) for inquiries or appointments. | P1 |
| **FR-ATT-06** | I can **browse schedules** and **bookmark/register** for sessions. | P0 |
| **FR-ATT-07** | I receive **notifications/reminders** for bookmarked/registered sessions. | P0 |
| **FR-ATT-08** | I can view "My agenda" with registered + bookmarked sessions. | P1 |

**Acceptance criteria**
- ATT-02: Expo registration returns a unique ticket code; duplicate registration prevented (idempotent). Session registration requires expo registration, respects capacity, and blocks time conflicts with already-registered sessions *(warn, P1)*.
- ATT-03: Debounced (300 ms) keyword search over company name, description, products/tags; category filter; paginated; result count shown; empty state suggests clearing filters.
- ATT-04: Profile shows booth code with "Show on floor plan" that highlights the booth.
- ATT-06: Day tabs, track/type filters; bookmark toggle persists; changed/cancelled sessions flagged.
- ATT-07: Reminder ~15 min before start (in-app + email); sent once; updated start time reschedules reminder.

### 4.5 General System Features (SYS)

| ID | Story | Priority |
|----|-------|----------|
| **FR-SYS-01** | **Real-time updates** for schedules, booth allocations, expo details. | P0 |
| **FR-SYS-02** | **Feedback & support** mechanism for suggestions/issues. | P0 |
| **FR-SYS-03** | In-app **notification centre** (bell + page) with read/unread. | P0 |
| **FR-SYS-04** | Responsive layout across devices. | P0 |
| **FR-SYS-05** | Privacy controls: consent, data export, account deletion. | P0 |

**Acceptance criteria**
- SYS-01: With two browsers open, a change in one appears in the other in < 2 s with a subtle highlight; if the socket is disconnected a banner appears and data refreshes on reconnect.
- SYS-02: Form with category/message (+ optional rating); confirmation with reference; admin triage status `open → in_review → resolved`.
- SYS-03: Unread count; mark one/all read; deep-link to the relevant page.
- SYS-05: Consent required at registration; "Download my data" returns JSON; "Delete account" anonymises PII after password confirmation.

---

## 5. Key Business Rules

| # | Rule |
|---|------|
| BR-1 | Admin accounts are created only by seed script or by an existing admin. |
| BR-2 | Only `published` expos are visible to non-admins. |
| BR-3 | An exhibitor may reserve a booth only if their application for that expo is `approved`. |
| BR-4 | A booth can be held by at most one exhibitor; an exhibitor holds at most one booth per expo. |
| BR-5 | Booth states: `available → reserved/allocated → available` (release); `blocked` is admin-only. |
| BR-6 | Sessions cannot overlap in the same location; `endTime > startTime`; session must fall within the expo dates. |
| BR-7 | Attendees must be registered for an expo before registering for its sessions; capacity is enforced. |
| BR-8 | Cancelling a session notifies all registered/bookmarked users; it is not hard-deleted if users are registered. |
| BR-9 | Messaging: attendee↔exhibitor; any user↔admin (support); exhibitor↔exhibitor only within the same expo. |
| BR-10 | Users can only read/modify their own personal data; public data follows visibility rules. |

---

## 6. Functional Requirement Summary (Traceability)

| Group | IDs | Count |
|-------|-----|------:|
| Authentication | FR-AUTH-01…06 | 6 |
| Expo & floor plan | FR-EXPO-01…04 | 4 |
| Exhibitor management (admin) | FR-EXH-01…03 | 3 |
| Schedule | FR-SCH-01…03 | 3 |
| Analytics | FR-ANA-01…03 | 3 |
| Admin misc | FR-ADM-01 | 1 |
| Exhibitor portal | FR-EXP-01…08 | 8 |
| Attendee | FR-ATT-01…08 | 8 |
| System | FR-SYS-01…05 | 5 |
| **Total** | | **41** |

---

## 7. Non-Functional Requirements

### 7.1 Performance
| ID | Requirement | Target / Verification |
|----|-------------|-----------------------|
| NFR-PERF-01 | Response time for most operations | p95 ≤ 2 s (API ≤ 500 ms for reads); load test with k6/Artillery |
| NFR-PERF-02 | Concurrent users | ≥ 300 concurrent users without errors; booth reservation race test |
| NFR-PERF-03 | Scalability | Stateless API; documented horizontal scale-out incl. Socket.IO Redis adapter |

### 7.2 Security
| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | Passwords bcrypt-hashed; TLS in transit; secrets in env |
| NFR-SEC-02 | Industry-standard auth (JWT access + rotating refresh), rate-limited auth endpoints |
| NFR-SEC-03 | Role-based + ownership-based authorization on every protected route |
| NFR-SEC-04 | Input validation (Zod), NoSQL-injection and XSS protections, secure headers, safe file uploads |
| NFR-SEC-05 | Regular security assessment: `npm audit`, OWASP ZAP baseline scan, checklist before release |

### 7.3 Privacy
| ID | Requirement |
|----|-------------|
| NFR-PRIV-01 | GDPR-aligned: lawful basis, minimisation, retention limits, privacy policy page |
| NFR-PRIV-02 | Explicit informed consent with timestamp; user can view/withdraw optional consents |
| NFR-PRIV-03 | Data export and deletion on request |

### 7.4 Reliability
| ID | Requirement |
|----|-------------|
| NFR-REL-01 | ≥ 99% uptime target; health endpoint; graceful shutdown; maintenance windows announced |
| NFR-REL-02 | Automated nightly DB backups with documented restore procedure |

### 7.5 Usability, Accessibility, Compatibility
| ID | Requirement |
|----|-------------|
| NFR-UX-01 | Intuitive UI, consistent navigation, responsive from 360 px to desktop |
| NFR-UX-02 | WCAG 2.1 AA conformance (see `design.md` §12) |
| NFR-COMP-01 | Works on latest 2 versions of Chrome, Firefox, Safari, Edge |
| NFR-COMP-02 | Works on common mobile devices/screens |

### 7.6 Operability & Quality
| ID | Requirement |
|----|-------------|
| NFR-OPS-01 | Structured logging with request IDs; error tracking; metrics endpoint |
| NFR-QA-01 | Test suite: unit + integration + E2E; ≥ 80% coverage on services; CI gating |
| NFR-DOC-01 | **User documentation** (guides, FAQ, tutorials) |
| NFR-DOC-02 | **Developer documentation** (setup, architecture, API reference) |
| NFR-DOC-03 | **Demo video** showing complete working of the application |

---

## 8. Deliverables (per eProject brief)

| # | Deliverable | Source requirement | Location |
|---|-------------|--------------------|----------|
| D1 | Working application (React + Node.js + MongoDB) | All FRs | `/client`, `/server` |
| D2 | Complete source code | Brief: "send complete documentation with source code" | Repo / zip |
| D3 | Project documentation (this doc set + user guide + developer guide) | NFR-DOC-01/02 | `/docs`, root `*.md` |
| D4 | Video of complete working of the application | NFR-DOC-03 | `/docs/demo` or link |
| D5 | Test reports & coverage summary | NFR-QA-01 | `/docs/testing` |
| D6 | Submission package to the eProjects Team | Brief | Zip + links |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| All P0 requirements implemented & demoed | 100% |
| Critical-path E2E tests passing (register → apply → approve → reserve; attendee register → bookmark → reminder) | 100% |
| Real-time propagation latency (local) | < 2 s |
| Lighthouse (desktop) Performance / Accessibility / Best Practices | ≥ 85 / ≥ 90 / ≥ 90 |
| Zero known high-severity security findings at release | 0 |
| Service-layer test coverage | ≥ 80% |

---

## 10. Release Plan (High-Level)

| Milestone | Scope | Exit criteria |
|-----------|-------|---------------|
| **M1 — Foundation** | Setup, auth, roles, base UI shell | Users can register/login/reset; role routing works |
| **M2 — Core expo** | Expos, floor plan, booths, exhibitor profiles & applications | Apply → approve → reserve works end-to-end |
| **M3 — Schedule & attendee** | Sessions, registrations, bookmarks, search, reminders | Attendee journey complete |
| **M4 — Realtime & comms** | Socket events, messaging, notifications, feedback | Live updates verified with 2 clients |
| **M5 — Analytics & hardening** | Dashboards, reports, security, a11y, performance | NFR checks pass |
| **M6 — Docs & delivery** | User/dev docs, demo video, submission | Package delivered |

Detailed task breakdown: `tasks.md`.

---

## 11. Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Scope creep on floor-plan editor | High | Med | MVP = rectangles + grid snap |
| Double-booking race conditions | Med | High | Atomic ops + concurrency tests |
| Real-time complexity | Med | Med | Events only invalidate queries; keep payloads small |
| Ambiguous requirements (payments, check-in) | Med | Low | Documented assumptions in `memory.md` |
| Documentation/video left to the end | High | High | Docs tasks embedded in every phase; video in Phase 9 with a rehearsed script |
| Email delivery in demo | Low | Med | Use Ethereal/MailHog + in-app fallback |

**Dependencies:** MongoDB (replica set), SMTP provider, optional Cloudinary, Node 20.

---

## 12. Glossary
See `memory.md` §3.

---

## 13. Open Questions
Tracked in `memory.md` §8 (Q-01 … Q-08) with current assumptions.
