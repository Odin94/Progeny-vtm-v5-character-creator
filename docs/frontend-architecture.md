# Frontend Architecture

Reference doc for implementation detail not covered in `frontend/AGENTS.md`.

## Generator flow detail

The generator is coordinated by `src/routes/index.tsx` → `src/generator/Generator.tsx`, with step navigation in `src/sidebar/AsideBar.tsx`.

`src/generator/steps.ts` is the generator-navigation module. It owns the stable step IDs, conditional visibility, normalization of unavailable steps, and next-step selection. `Generator.tsx` maps those IDs to picker implementations, while `AsideBar.tsx` renders the visible list from the same module.

The Blood Sorcery ritual and Oblivion ceremony steps are conditional. When adding or reordering a step, update `allGeneratorSteps` and its visibility rule in `steps.ts`, then add coverage for the affected character states. Do not reintroduce numeric step offsets: callers should work exclusively with `GeneratorStepId`.

## Networking detail

`src/utils/api.ts` lazily initializes the CSRF token: the first mutating request triggers a GET to fetch the token from the `X-CSRF-Token` response header, caches it, then replays the original request. Bypassing this helper breaks both the cookie-based auth and the CSRF flow.

## Export hotspots

These files produce structured output from the character model and have regression tests in `src/test/`:

- PDF export: `src/generator/pdfCreator.ts`
- Foundry VTT export: `src/generator/foundryWoDJsonCreator.ts`
- Inconnu export: `src/generator/inconnuJsonCreator.ts`

Run `pnpm run test:run` after any change to these files or to `src/data/Character.ts`. A passing build is not sufficient — the test suite checks actual output shape.

All file exports (PDF, Progeny/Foundry/Inconnu JSON, command text, conflict backups and raw recovery/broken saves) use `src/utils/fileDownload.ts`. Pass a static format/source, the filename, and a Blob producer. Keep synchronous producers synchronous so iOS embedded browsers can call native file sharing during the original click. The helper tracks producer failures too. Normal browsers retain the download link; detected iOS embedded browsers use file sharing when supported and activation is still available, otherwise `src/components/FileSavePrompt.tsx` offers a persistent saving dialog with retry/preview actions. A preview is explicit and opens another tab; sharing failure never automatically navigates away from character data. The saving dialog owns focus above recovery/conflict dialogs, which suspend their focus trap and Escape handling until it closes. Multiple pending files stay available in that dialog. Blob URLs stay alive until the prompt is dismissed, then are revoked after a delay. Raw recovery data is exported byte-for-byte and never cleared by downloading.

`src/utils/downloadAnalytics.ts` emits `file_download` lifecycle events with a random `attempt_id`, static `format`/`source`, stage/outcome/method, elapsed milliseconds, MIME/byte size, capability flags, current activation and share-attempt count. PostHog supplies browser/OS/session context. Outcomes distinguish preparation, capabilities, prompt display/dismissal, share request/completion/cancellation, preview request, download request, failure, and explicit user reports (`reported_saved`/`reported_failed`). Error names are allowlisted; filenames, file contents and raw exception messages never enter this telemetry. Analytics errors cannot interrupt delivery. `download_requested` means an anchor click and `shared` means Web Share resolved, not a confirmed disk save. User reports are subjective feedback, not browser verification. The old `PDF downloaded`, JSON/command download events and interim `pdf_export` event are replaced; dashboards should use the new stages without treating historical attempts as confirmed successes.

For diagnosis, filter `file_download` by format/source and browser/OS, group an individual attempt by `attempt_id`, then inspect `stage`, `error_name`, `file_share_supported`, `user_activation`, `share_attempts` and elapsed time. `prepared` proves file generation completed; missing delivery events after that may indicate interruption or lost telemetry. A `reported_failed` event can expose silent host-app failures without an exception. A prompt with no later event does not prove failure. Browser emulation verifies code paths, not real Google iOS app support; test on a physical device before claiming the original issue resolved.

## Character sheet flow

The sheet route (`src/routes/sheet.tsx`) renders `src/character_sheet/CharacterSheet.tsx`, which composes sections from `src/character_sheet/sections/` and `src/character_sheet/components/`. Sheet-specific state (dice pool, modal UI, WebSocket session chat) lives in Zustand stores under `src/character_sheet/stores/`. Changes that span local editing and sync behavior require inspecting both the rendered component and the related store.

## Homebrew flow

`/homebrew` is the collection authoring surface and `/homebrew/library` is the public community library. Shared item and collection types live in `src/data/Homebrew.ts`; REST calls stay in `src/utils/api.ts`; query state is coordinated by `src/hooks/useHomebrew.ts`.

Character picker integration resolves `/characters/:id/homebrew`, so a collection is offered only while that character belongs to a coterie where the collection is enabled. `src/utils/homebrewOptions.ts` maps collection items into the existing generator and sheet models. When selected, the complete item data and a `homebrewSource` reference are embedded in the character payload. Keep that snapshot behavior when extending pickers: removing a collection from a coterie must remove future options without breaking content already saved on a character.

## Character persistence and recovery

`src/modules/characterIntake.ts` owns compatibility patches, validation, preservation of rejected originals and approved repairs. Local storage, imports and remote/API parsing use its `read` operation. A failed intake never applies a lossy repair. `persist` and `applyApprovedRepair` write the recovery archive synchronously before replacing character storage; quota errors propagate to the caller. The recovery dialog retains the original confirmation and repair preview. A valid local draft whose server character returns 404 opens `DeletedCharacterDraftModal`: Restore creates a fresh owned copy, while Delete removes the active local-storage key and resets subscribers. Permission and network failures do not offer deletion. Both actions preserve concurrently replaced drafts, and restore retries reuse a successfully created copy.

`src/modules/characterPersistence.ts` owns save ordering for autosave, manual updates and save-before-switch in Creator, Landing and Account. Its queue snapshots each submitted draft, reconciles create acknowledgements and character versions, and checks newer remote versions after preceding saves settle. Queues and acknowledgements are scoped to the authenticated account. Views render their existing name/save/discard prompts from its switch decision. Discard/new-character paths settle active writes and start a fresh draft identity.

`CharacterAutosave` hosts the shared `CharacterConflictModal`. Autosave and Account manual/save-before-switch conflicts request it through `progeny:character-conflict`. The dialog fetches the owned backend character, offers JSON backups for each version, and lets users keep the browser, keep the backend, or save the browser as a new character. It rechecks the reviewed backend revision before resolving; writes use the persistence queue and the existing optimistic version check. Backend choice replaces only the active browser draft; browser choice updates the existing record; copy choice creates a separate record. Account switch callbacks run only after successful resolution. The footer offers Keep browser and Keep backend, with explicit deletion/overwrite confirmations for both destructive choices. JSON backups are separate from the highlighted Save browser as new option. Backend dates come from the API updatedAt field; optional browser change dates live in separate local metadata and are unchanged by revision-only acknowledgements. Imports and conflict replacements carry an explicit source-date marker, preserving known source dates or leaving the date unknown rather than stamping the load time. Legacy browser drafts show Date not recorded. Undo snapshots retain both dates. Both original versions remain in local recovery storage. Replacement choices show a success toast with Undo: it reopens the original snapshots, then fetches and checks the current backend revision before restoring either choice through the normal persistence queue. Undo is scoped to the original authenticated account and does not repeat a pending character switch.

`src/utils/characterConflictAnalytics.ts` tracks dialog opens/readiness, selections, confirmations and Back, resolution starts/outcomes, dismissal, backup starts/outcomes and Undo requests/refusals. Every opening has a dialog ID; resolution attempts have a resolution ID, and Undo openings link to their parent dialog and resolution. Properties contain only opaque IDs, revision numbers and fixed choices/reasons, never draft contents or raw errors. Genuine request, application and download failures use sanitized `characterOperationAnalytics` exceptions with the same correlation fields; modal-resolvable 409s and changed-version/read-only guard refusals remain regular events. Analytics failures never block the user action.

`src/modules/coterieMembership.ts` owns invite links, invitation consumption, membership operation pending/errors, duplicate-submit coordination and refresh of affected coterie, vitals and character reads. `useCoteries` adapts those operations to the existing React Query mutation interface. Permissions and the backend coterie read model remain authoritative.

The contract tests in `src/test/characterIntakeContract.test.ts`, `characterPersistenceContract.test.ts` and `coterieMembershipContract.test.ts` exercise the same module interfaces with local storage and transport adapters, including write failures and overlapping requests.


## Character failure telemetry

`src/utils/characterOperationAnalytics.ts` reports character actions that fail or need recovery. Blocking failures use `posthog.captureException` with the sanitized `CharacterOperationError` name. Recoverable prompts (busy/account changes, missing names/files, retry/reload requests, conflict confirmations and automatic autosave retries) use `character_operation_warning` with `severity: warning`. Version conflicts offering the shared modal explicitly pass `resolution: "modal"` and emit `character_operation_warning` rather than exceptions, including autosave blocks and HTTP 409 races. Their revision and data-loss-risk metadata remains available. Conflicts without a modal recovery path and storage/network failures retain their existing error classification.

Use fixed operation/reason codes and optional character IDs/HTTP status. Never forward raw error messages, causes, character names, notes, file contents or response bodies. `CharacterOperationError` in `src/utils/characterOperationError.ts` gives persistence failures stable reasons without parsing user-facing messages. Repeated autosave retry warnings are throttled for one minute. The reporter cannot throw, and the same error object is reported once across propagation layers; intake validation retains its existing `CharacterValidationError` exception. Instrument the place that knows whether the user is blocked or can continue, rather than every HTTP error indiscriminately.

The landing “Save and start new” action pairs `character_save_attempt` with `character_save_outcome` using `operation_id`. Outcomes distinguish success, refusal, failure and cancellation; missing outcomes can indicate an interrupted page/session or missing telemetry delivery. These lifecycle events include only static operation/outcome/reason codes and a random ID, and do not replace error/warning reporting.
