# Progeny deep bug review — 2026-10-03

**All 5 findings fixed and verified: 4 high and 1 medium.** The original reproductions, causes and fix suggestions remain below as historical audit evidence. Each report records its implemented fix.

Original audit snapshots: `4a93b19`, then revalidation at `1598820` with documentation-only review commits. Fixes are committed as `c0d5d89` and `df8b153` on the separate worktree branch `fix/odin/review-bug-fixes`. The primary checkout's uncommitted architecture work was not reviewed or changed. Nothing was pushed and no PR was created.

## Original findings — now fixed

| ID                                                | Severity | Observed bug                                            |
| ------------------------------------------------- | -------- | ------------------------------------------------------- |
| [P01](P01-stale-saves-overwrite.md)               | High     | Stale saves overwrite newer character edits             |
| [P02](P02-character-websocket-closes.md)          | Medium   | Character WebSocket closes immediately after connecting |
| [P03](P03-unicode-generator-import-corruption.md) | High     | Generator import silently corrupts non-ASCII text       |
| [P04](P04-pending-edit-wrong-character.md)        | High     | A pending field edit can land on a different character  |
| [P05](P05-restored-draft-never-autosaves.md)      | High     | Reloaded unsaved drafts are treated as already saved    |

## Verification and scope

Final fix verification: frontend **382 passing tests across 76 files**; backend **75 passing tests across 14 files**. The initial audit baseline had 370 frontend tests and 71 backend tests. Formatting and lint pass. Frontend typecheck and backend TypeScript build pass. Frontend production bundling was run with `pnpm exec vite build`; the normal build script additionally uploads PostHog sourcemaps, which was intentionally not invoked.

All three apps were launched locally against disposable SQLite databases. Browser/API probes cover anonymous persistence, cross-tab editing, import/export, authenticated sync, conflicts, reload/recovery, character switching, and the reported interaction bugs. Default sheets were inspected at 390 × 844 with no horizontal overflow or page errors. The original failing browser/API paths were rerun after implementation and now pass.

Progeny authentication verification uses fixture users at the WorkOS boundary; Hiveborn and CozyCrowns use their built-in local sign-in. Live WorkOS login, real multi-device networks, production data, and production latency were not tested. Fixtures and failure injection are identified in the individual reports. They do not change app source or reset any limits.

## Evidence

Shared [browser results](../../../evidence/browser-results.json), [screenshots](../../../evidence/), [check logs](../../../evidence/), and [reproduction scripts](../../../harness/) live outside the app repositories, under the common review directory. Scripts call actual stores/APIs to prepare some fixtures; the reports distinguish those from direct UI actions.

- [Screenshot: primary reproduction](../../../evidence/progeny-unicode-import.png)
- [Screenshot: second reproduction](../../../evidence/progeny-pending-description-wrong-sheet.png)

## Fix status

All five findings are fixed on `fix/odin/review-bug-fixes`. Expected save revisions prevent stale REST and WebSocket writes. Unicode imports preserve exact text. Pending edits remain attached to their source draft, and recovered downloads open as separate unsaved characters. Restored dirty drafts resume cloud saving; divergent drafts are retained with a visible warning.

Independent review round 1 identified three actionable issues: preserve buffered edits during same-character cloud field replacement; reset input identity before acknowledgement shortcuts; and clear original cloud identity when downloading a recovery copy. Those changes and permanent regressions were committed in `df8b153`. Independent review round 2 found **no further actionable feedback**.

The 10-test adversarial review suite passes. Native browser checks confirm P01–P05, including actual UTF-8 file selection/import, real REST/WebSocket concurrency protection, cross-tab textarea switching, restored autosave and cloud-conflict recovery. The recovery dialog was also opened and inspected in the running app. See [fix evidence](../../../evidence/fixes/) and [recovery screenshot](../../../evidence/fixes/progeny-recovery.png).

Regression tests include `characterConcurrency.test.ts`, `characterAutosave.test.tsx`, `debouncedFieldIdentity.test.tsx`, `jsonImport.test.ts`, and `recoveredCharacterCopy.test.ts`. No database schema change was required. Nothing was pushed and no PR was created.
