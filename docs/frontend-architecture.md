# Frontend Architecture

Reference doc for implementation detail not covered in `frontend/AGENTS.md`.

## Generator flow detail

The generator is coordinated by `src/routes/index.tsx` → `src/generator/Generator.tsx`, with step navigation in `src/sidebar/AsideBar.tsx`.

`Generator.tsx` maps a numeric `selectedStep` to a component via a switch statement. **The Blood Sorcery ritual step (index 8) is conditional.** When the character does not have Blood Sorcery disciplines, the step is hidden in the sidebar but the switch indices still assume it exists. `Generator.tsx` applies a `patchedSelectedStep` offset (+1 when `selectedStep >= 8` and Blood Sorcery is absent) to keep the switch aligned with the sidebar.

Adding or reordering steps near index 8 requires updating both the switch and the stepper, and verifying the behavior for characters with and without Blood Sorcery. See `containsBloodSorcery` in `src/data/Character.ts`.

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
