## Description

<!-- What does this PR do? Link the task ID (T-x.y) and PRD requirement IDs. -->

Closes T-

## Changes

-

## How to test

```
npm test -w server
```

## Definition of Done

- [ ] Implements the referenced task and satisfies the linked PRD acceptance criteria
- [ ] Follows layering, naming, and folder rules in rules.md
- [ ] Inputs validated (Zod) and authz enforced (role + ownership) — with tests proving 401/403
- [ ] Unit + integration tests added/updated; all tests green; coverage gates met
- [ ] UI handles loading / empty / error / success; responsive at 360/768/1280; a11y checks pass
- [ ] No lint/format warnings; no `console.log`; no secrets
- [ ] OpenAPI / docs / `.env.example` updated if applicable
- [ ] Manually verified in the browser (incl. second client for real-time changes)
- [ ] `tasks.md` ticked and `memory.md` updated (status, decisions, session log)
- [ ] PR reviewed and squash-merged; CI green on `main`
