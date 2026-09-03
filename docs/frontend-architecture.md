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
