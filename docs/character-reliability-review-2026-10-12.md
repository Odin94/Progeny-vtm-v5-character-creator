# Character reliability review — October 12, 2026

## Recommendation

Continue the October 3 refactor with two small, behavior-focused changes: move revision reconciliation into character persistence, then give character transitions a shared workflow. Avoid a wholesale rewrite of the character model or sheet. The existing write queue, ownership checks, account guards, intake validation, and backend optimistic concurrency are worth preserving.

## Production evidence

Read PostHog through `posthog-cli`, in the Progeny project (95399). Queried all issue statuses over the last 90 days, with the default test-account exclusion, searching for character and save errors. These are exploratory issue counts, not saved metric definitions. Search matches can include stack frames rather than the actual error message. Counts below are for the named issues and must not be summed as unique affected users.

| Issue | Occurrences | Users | Last observed (UTC) |
| --- | ---: | ---: | --- |
| [Autosave version conflict](https://eu.posthog.com/project/95399/error_tracking/01a12d4b-2c1e-7341-99f7-28793e53cdc7) | 9 | 7 | Oct 12, 06:51 |
| [Save before load version conflict](https://eu.posthog.com/project/95399/error_tracking/01a12db7-2a97-7c40-9cad-554d1f941b1a) | 2 | 2 | Oct 12, 02:52 |
| [Explicit save version conflict](https://eu.posthog.com/project/95399/error_tracking/01a12d4c-c56d-7f82-86b6-31ed560dc1f4) | 2 | 1 | Oct 11, 23:29 |
| [Save before load missing character](https://eu.posthog.com/project/95399/error_tracking/01a12ea8-52a5-7923-a74e-0c48cfa011bb) | 2 | 1 | Oct 12, 05:49 |
| [Invalid JSON import](https://eu.posthog.com/project/95399/error_tracking/01a0cf48-6ca1-76d0-b111-105e88869abf) | 10 | 9 | Oct 12, 02:28 |
| [Import compatibility invalid union](https://eu.posthog.com/project/95399/error_tracking/01a0d3f7-002a-73b1-a1a6-7e4ae397210e) | 7 | 5 | Oct 11, 17:51 |
| [Local draft experienceSpent too large](https://eu.posthog.com/project/95399/error_tracking/01a1055b-76cb-7833-a024-00c6f47ffa36) | 3 | 1 | Oct 11, 20:28 |

Sampled conflict and missing-character events are handled exceptions: autosave on `/sheet`, save before load on `/me`. They prove blocked operations, not that edits were lost or that every conflict was false. Recent commits deliberately promoted these blocks into error tracking (`09644ed`, `540dda9`), so the new issue volume cannot establish a regression trend. Sampled release context returned no usable commit identifier; attribution to deployed fixes remains uncertain.

The search also returned a CSS preload error and an older `rgba` TypeError. Those are separate from persistence. Import parse failures can be invalid files; the local XP validation failure deserves a separate model/repair investigation. Do not loosen validation merely to reduce exceptions. This investigation did not exhaust every project error or replay users' sessions.

## What the recent refactor accomplished

- `8367f19` (Oct 3): added expected-revision protection, restored-draft autosave handling, buffered-edit identity protection, and Unicode import fixes.
- `38fdbad` / `bf39cf1` (Oct 3): introduced character persistence and intake modules, shared foreground/autosave queues, account-bound operations, and contract tests.
- `4a2aff3`, `824c5ad` (Oct 11): surfaced transition refusals and recovered deleted cloud identities.
- `8b85dc7`, `741e959` (Oct 12): recognized lost autosave responses using a pending content key, then cleared that key after acknowledgement.
- `3fa8e2b`, `13b5ea8` (Oct 12): added save-before-load conflict recovery, race handling, and cancellation fixes.
- `78dd11e`, `9902959` (Oct 12): handled deletion of the loaded draft and deletion across account sessions.

These fixes cluster around lifecycle and asynchronous sequencing. The refactor centralized writes, but its interface still leaves important ordering and recovery rules to callers.

## Remaining sources of risk

### Revision knowledge has two owners

`modules/characterPersistence.ts` owns queues and in-memory acknowledgements. `hooks/useAutosaveCharacter.tsx` separately owns the confirmed base, pending-write storage, blocked state, local/remote content comparison, and revision adoption. Explicit saves do not use the hook's pending-write journal. A foreground write that commits but loses its response therefore lacks the same reload recovery path. This is a code-derived risk, not a production reproduction from the sampled events.

Move base/pending/acknowledged revisions and reconciliation into persistence. All saves should record the submitted content and expected revision before sending; all successful saves should acknowledge through the same path. On reload or ambiguous failure, fetch the remote record and distinguish identical content, our pending write plus newer local edits, and genuine divergence. Keep divergence explicit; never retry it by adopting a newer revision blindly. The autosave hook should only schedule work and display state.

### Transitions are locks around caller-owned algorithms

`modules/characterTransition.ts` mostly wraps a callback and refusal notification. `CreatorPage.tsx`, `MePage.tsx`, and `LandingPage.tsx` each assemble save, wait, load, replace, conflict, naming, deletion, cancellation, and notifications. The persistence interface exposes generation changes and currentness predicates; correctness still depends on pages calling these in the right order.

For example, `MePage.tsx`'s `performLoadCharacter` fetches fresh data for a version check but ultimately installs `char.data` from the list snapshot. On a fetch failure it deliberately continues with the cached snapshot. The generator instead loads the fetched record. This behavior difference is verified by code inspection; its production frequency is unknown.

Create a deeper character-session module that owns the active draft and implements intents such as load, start new, import, save copy, and resolve a pending decision. It should fetch and validate the destination before replacing the active draft, retain the current draft on failure, and bind dialog continuations to the original account, draft generation, and target. Return explicit outcomes such as completed, needs name, conflict, missing character, busy, canceled, or failed. Pages render these outcomes without reconstructing the sequencing. A completed promise alone must not mean a successful transition.

### Buffered edits and recovery remain separate from switching

`useDebouncedUncontrolledField.ts` preserves interrupted field edits in recovery storage. That prevents writing into the wrong character, but the foreground save may precede a buffered edit. A recovery download is less convenient than saving what the user just typed.

The transition workflow should flush registered edits belonging to the departing draft before capturing its save snapshot. Reject stale edit registrations after replacement. Make recovery persistence return an explicit result: `preserveCharacterDraft` currently logs storage failure and returns no success/failure result, so callers cannot require successful preservation before replacement. Keep an explicit user discard distinct from an automatic preservation path.

## Delivery order and acceptance tests

1. Add failing shared-workflow scenarios before migrating pages: fresh destination beats cached list data; failed target fetch leaves the active draft; a foreground save committed with a lost response is recognized after reload; cancellation retires the original dialog continuation.
2. Move reconciliation and its journal into persistence; route autosave and foreground saves through it. Test genuine divergence, acknowledgement followed by newer local edits, account changes, and storage failure. Existing backend revision checks must continue rejecting stale writes.
3. Migrate the account page first, then generator and landing page. Delete their duplicated lifecycle algorithms as each moves. Cover a deleted source, deleted target, failed ownership list, shared read-only draft, unnamed draft, import, and save copy through the shared interface.
4. Integrate buffered-edit flushing and preservation results. Test a user typing immediately before switching, with multiple mounted fields and an in-flight save.
5. Add browser scenarios with controllable HTTP responses and two tabs: commit a write then drop its response, reorder save/load responses, delete remotely, change accounts during a pending operation, and reload a dirty draft. Assert the final active identity, cloud payload/revision, and retained recovery contents. Existing browser tests cover recovery and ownership; extend them with these lifecycle sequences.

Use the existing injected transport and storage seams. No new state-machine library is required. Start with explicit state and typed outcomes; only introduce a library if it simplifies the actual transition rules.

Emit privacy-safe operation IDs and terminal outcomes for all lifecycle intents, extending the existing landing-page save-and-start-new tracking. Include deployment revision, conflict classification, and whether recovery succeeded. Do not include character contents. This distinguishes a safely blocked conflict from a failed recovery and connects future errors to the responsible release.

## Verification performed

Read the relevant frontend modules, hooks, transition pages, storage/edit buffering, telemetry, backend character update revision check, recent history, and prior Oct 3 audit. Ran six focused suites: characterPersistenceContract, characterAutosave, creatorTransition, charactersSection, accountDraftIdentity, characterTransition. All **45 tests passed**. This confirms existing covered scenarios; it does not reproduce the proposed risks or replace browser and backend concurrency verification.

No application code changed in this investigation. No deployment, external write, full build, or full test suite was performed.

## October 13 reproduction and fix

Pulled the latest production SQLite backup with `pnpm run db:pull-backup` and inspected it read-only. For the sampled surviving characters, row and payload revisions agree and the owners match the authenticated event identities. The character from the save-before-load `not_found` timeline is absent. Current database state cannot reconstruct historical browser drafts or prove an account switch.

The missing-character timeline contains a successful deletion followed by attempted saves of that same identity. It occurred before `78dd11e`/`9902959` cleared deleted active drafts and protected deletion across account changes. Existing regression tests cover those paths; no further deletion behavior change is needed for that historical example.

A local hook reproduction found a separate false conflict still present: initialize autosave at revision 1; complete a foreground save at revision 2 through the shared persistence queue; make another local edit before the cloud refetch arrives; deliver the acknowledged revision 2. Autosave previously interpreted that revision increase as external divergence and blocked. Persistence now exposes an exact content/revision acknowledgement scoped to the current account and draft generation, which autosave can adopt while retaining newer local edits.

This does not accept arbitrary newer revisions. Tests retain conflicts for different content, a later cloud revision, and a retired draft generation. A cached acknowledgement cannot clear a subsequent HTTP 409 block; a newer successful explicit resolution can. The reproduction demonstrates the code defect, but does not establish that it caused every production conflict.

The October 3 persistence/guard changes introduced separate acknowledgement owners. October 11 `09644ed` added exception reporting; October 12 `540dda9` promoted draft-loss risks to errors. New issue visibility therefore does not independently date the underlying behavior regression.

Validation: 101 frontend suites / 589 tests, TypeScript, lint, and the production build pass. Independent review found two acknowledgement-ordering edge cases; both have regression coverage and were fixed. Browser ownership/shared/read-only and restore checks passed. The unknown-identity browser scenario is also blocked by the existing missing-draft modal on untouched main. The delete-local-draft browser assertion is timing-sensitive because the app may re-persist an empty draft after removing the storage key. No production database writes or schema changes were made.

A further independent review reproduced an interaction between fresh account loads and global autosave: the draft received revision 3 while the list cache still held revision 1. This could block autosave, or restore revision 1 if a confirmed base matched revision 3. Account loading now publishes the fresh validated record to both caches before replacing the draft. Single-character GET omits list-only sharing metadata, so the cache update retains that metadata and normalizes `shared` from authoritative `canEdit`. Integration regressions mount the account page and global autosave together, covering both confirmed-base states and a shared read-only character using the actual GET response shape.
