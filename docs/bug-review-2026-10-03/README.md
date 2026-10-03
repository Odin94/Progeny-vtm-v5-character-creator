# Progeny deep bug review — 2026-10-03

**5 confirmed open findings: 4 high and 1 medium.** Each report includes reproduction, observed impact, cause, a suggested fix, and a regression check.

Initial committed snapshot: `4a93b19`. Final revalidation: `1598820` plus documentation-only review commits. The separate worktree is on `chore/odin/deep-bug-review`. The primary checkout's uncommitted architecture work was not reviewed or changed. Nothing was pushed and no PR was created.

## Findings

| ID                                                | Severity | Observed bug                                            |
| ------------------------------------------------- | -------- | ------------------------------------------------------- |
| [P01](P01-stale-saves-overwrite.md)               | High     | Stale saves overwrite newer character edits             |
| [P02](P02-character-websocket-closes.md)          | Medium   | Character WebSocket closes immediately after connecting |
| [P03](P03-unicode-generator-import-corruption.md) | High     | Generator import silently corrupts non-ASCII text       |
| [P04](P04-pending-edit-wrong-character.md)        | High     | A pending field edit can land on a different character  |
| [P05](P05-restored-draft-never-autosaves.md)      | High     | Reloaded unsaved drafts are treated as already saved    |

## Verification and scope

Frontend: 370 tests; backend: 71 tests. Frontend typecheck and backend TypeScript build pass. Frontend production bundling was run with `pnpm exec vite build`; the normal build script additionally uploads PostHog sourcemaps, which was intentionally not invoked.

All three apps were launched locally against disposable SQLite databases. Browser/API probes cover anonymous persistence, cross-tab editing, import/export, authenticated sync, conflicts, reload/recovery, character switching, and the reported interaction bugs. Default sheets were inspected at 390 × 844 with no horizontal overflow or page errors. Passing existing tests did not prevent the reported bugs.

Progeny authentication verification uses fixture users at the WorkOS boundary; Hiveborn and CozyCrowns use their built-in local sign-in. Live WorkOS login, real multi-device networks, production data, and production latency were not tested. Fixtures and failure injection are identified in the individual reports. They do not change app source or reset any limits.

## Evidence

Shared [browser results](../../../evidence/browser-results.json), [screenshots](../../../evidence/), [check logs](../../../evidence/), and [reproduction scripts](../../../harness/) live outside the app repositories, under the common review directory. Scripts call actual stores/APIs to prepare some fixtures; the reports distinguish those from direct UI actions.

- [Screenshot: primary reproduction](../../../evidence/progeny-unicode-import.png)
- [Screenshot: second reproduction](../../../evidence/progeny-pending-description-wrong-sheet.png)

## Fix status

All five findings have implementations and regression coverage on `fix/odin/review-bug-fixes`. Independent review and running-app verification are performed before handoff. Recovery drafts can be downloaded from the character sheet menu.
