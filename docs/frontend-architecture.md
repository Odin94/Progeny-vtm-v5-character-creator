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

## Character sheet flow

The sheet route (`src/routes/sheet.tsx`) renders `src/character_sheet/CharacterSheet.tsx`, which composes sections from `src/character_sheet/sections/` and `src/character_sheet/components/`. Sheet-specific state (dice pool, modal UI, WebSocket session chat) lives in Zustand stores under `src/character_sheet/stores/`. Changes that span local editing and sync behavior require inspecting both the rendered component and the related store.

## Homebrew flow

`/homebrew` is the collection authoring surface and `/homebrew/library` is the public community library. Shared item and collection types live in `src/data/Homebrew.ts`; REST calls stay in `src/utils/api.ts`; query state is coordinated by `src/hooks/useHomebrew.ts`.

Character picker integration resolves `/characters/:id/homebrew`, so a collection is offered only while that character belongs to a coterie where the collection is enabled. `src/utils/homebrewOptions.ts` maps collection items into the existing generator and sheet models. When selected, the complete item data and a `homebrewSource` reference are embedded in the character payload. Keep that snapshot behavior when extending pickers: removing a collection from a coterie must remove future options without breaking content already saved on a character.

## Character persistence and recovery

`src/modules/characterIntake.ts` owns compatibility patches, validation, preservation of rejected originals and approved repairs. Local storage, imports and remote/API parsing use its `read` operation. A failed intake never applies a lossy repair. `persist` and `applyApprovedRepair` write the recovery archive synchronously before replacing character storage; quota errors propagate to the caller. The recovery dialog retains the original confirmation and repair preview. A valid local draft whose server character returns 404 opens `DeletedCharacterDraftModal`: Restore creates a fresh owned copy, while Delete removes the active local-storage key and resets subscribers. Permission and network failures do not offer deletion. Both actions preserve concurrently replaced drafts, and restore retries reuse a successfully created copy.

`src/modules/characterPersistence.ts` owns save ordering for autosave, manual updates and save-before-switch in Creator, Landing and Account. Its queue snapshots each submitted draft, reconciles create acknowledgements and character versions, and checks newer remote versions after preceding saves settle. Queues and acknowledgements are scoped to the authenticated account. Views render their existing name/save/discard prompts from its switch decision. Discard/new-character paths settle active writes and start a fresh draft identity.

`src/modules/coterieMembership.ts` owns invite links, invitation consumption, membership operation pending/errors, duplicate-submit coordination and refresh of affected coterie, vitals and character reads. `useCoteries` adapts those operations to the existing React Query mutation interface. Permissions and the backend coterie read model remain authoritative.

The contract tests in `src/test/characterIntakeContract.test.ts`, `characterPersistenceContract.test.ts` and `coterieMembershipContract.test.ts` exercise the same module interfaces with local storage and transport adapters, including write failures and overlapping requests.


## Character failure telemetry

`src/utils/characterOperationAnalytics.ts` reports character actions that fail or need recovery. Blocking failures use `posthog.captureException` with the sanitized `CharacterOperationError` name. Recoverable prompts (busy/account changes, missing names/files, retry/reload requests, conflict confirmations and automatic autosave retries) use `character_operation_warning` with `severity: warning`. An unresolved conflict that stops autosave or a foreground save is an exception; a conflict prompt offering an explicit resolution is a warning.

Use fixed operation/reason codes and optional character IDs/HTTP status. Never forward raw error messages, causes, character names, notes, file contents or response bodies. `CharacterOperationError` in `src/utils/characterOperationError.ts` gives persistence failures stable reasons without parsing user-facing messages. Repeated autosave retry warnings are throttled for one minute. The reporter cannot throw, and the same error object is reported once across propagation layers; intake validation retains its existing `CharacterValidationError` exception. Instrument the place that knows whether the user is blocked or can continue, rather than every HTTP error indiscriminately.

The landing “Save and start new” action pairs `character_save_attempt` with `character_save_outcome` using `operation_id`. Outcomes distinguish success, refusal, failure and cancellation; missing outcomes can indicate an interrupted page/session or missing telemetry delivery. These lifecycle events include only static operation/outcome/reason codes and a random ID, and do not replace error/warning reporting.
