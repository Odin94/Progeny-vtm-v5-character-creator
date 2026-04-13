# Frontend Agent Guide

## Purpose
- The frontend is the user-facing Vite app for character creation, editing, export, authenticated account pages, and live session chat.

## Commands
- Install: `npm install`
- Dev server: `npm start`
- Build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm run test:run`

## Important Areas
- Routing and providers: `src/routes/`, `src/routes/__root.tsx`, `src/main.tsx`
- Generator experience: `src/generator/`, `src/routes/index.tsx`, `src/sidebar/`, `src/topbar/`
- Character sheet experience: `src/character_sheet/`, `src/routes/sheet.tsx`
- Server-data hooks: `src/hooks/useAuth.tsx`, `src/hooks/useCharacters.tsx`, `src/hooks/useCoteries.tsx`, `src/hooks/useShares.tsx`, `src/hooks/useUserPreferences.ts`
- API wrapper: `src/utils/api.ts`
- Persistent character model and reference data: `src/data/`
- Export logic and regression tests: `src/generator/pdfCreator.ts`, `src/generator/foundryWoDJsonCreator.ts`, `src/test/`

## State Model
- React Query owns server-backed data and auth fetches.
- Local storage owns the editable local character and generator progress.
- Zustand stores own sheet-specific interaction state such as dice rolling and session chat.

## Non-Negotiable Invariants
- Use `src/utils/api.ts` for REST requests so cookies and CSRF handling stay consistent.
- The local character shape is shared across the generator, sheet, JSON import/export, PDF export, and backend persistence. Treat `src/data/Character.ts` as a central contract.
- Generator step order is encoded numerically in `src/generator/Generator.tsx` and mirrored in the surrounding navigation UI. Step changes are rarely isolated to one file.
- The app assumes cookie-based auth against the backend. Avoid introducing ad hoc token storage in the browser.
- Session chat and live updates depend on backend WebSocket message shapes. If you change the store payloads, verify the backend handlers too.

## Character Schema Versioning and Backwards Compatibility
- `schemaVersion` in `src/data/Character.ts` must be incremented whenever the character schema changes in a way that affects serialized data (new required fields, renamed fields, removed fields, changed defaults).
- `applyCharacterCompatibilityPatches` in `src/data/Character.ts` must be updated alongside any such schema change. Add a new `patchVnToVn+1Compatibility` function and call it from `applyCharacterCompatibilityPatches` so that characters saved under old versions are silently upgraded on load.
- Every new patch function needs a corresponding test in `src/test/` that constructs a minimal old-version character object, runs it through `applyCharacterCompatibilityPatches`, and asserts the upgraded fields are correct. These tests are the safety net for production data that predates the change.

## Generator Step Footgun

The Blood Sorcery ritual step (step 8) is **conditional** — it only appears when the character has Blood Sorcery disciplines. `Generator.tsx` compensates with a `patchedSelectedStep` offset: when Blood Sorcery is absent and `selectedStep >= 8`, it adds 1 to align the switch case.

**Impact:** adding, removing, or reordering steps near index 8 requires updating both the switch in `src/generator/Generator.tsx` and the stepper in `src/sidebar/AsideBar.tsx`. A step added at index 8 without accounting for this offset will silently render the wrong component for non-Blood-Sorcery characters.

## UI and Validation Conventions
- UI components: use Mantine (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`). Do not introduce custom modal, overlay, or notification implementations when a Mantine primitive exists.
- Icons: use `@tabler/icons-react`. FontAwesome icons are present in the codebase but Tabler is preferred for new work.
- Frontend validation: use Zod where validation logic is needed (already a dependency). Keep Zod schemas co-located with the code that uses them.
- Input focus rings: always wrap `TextInput` and `Textarea` elements with the `FocusBorderWrapper` component (`src/character_sheet/components/FocusBorderWrapper.tsx`). It sets the `--input-bd` CSS variable on focus to show a colored border ring. Pass `colorValue` to match the surrounding UI — `theme.colors.grape[6]` in the generator, the selected theme color in the character sheet. Never render a bare Mantine text input without this wrapper.

## Verification Triggers
- UI or route changes: `npm run build` — a clean build with no TypeScript errors is the minimum bar.
- API or hook changes: `npm run build` and confirm the matching backend route accepts the same payload shape.
- Character model or export/import changes: `npm run test:run` — all tests must pass. The suite covers PDF, Foundry, and Inconnu export output; a build-only check is not sufficient here.
- Character schema changes: increment `schemaVersion`, add a `patchVnToVn+1Compatibility` function in `src/data/Character.ts`, call it from `applyCharacterCompatibilityPatches`, and add a backwards-compatibility test in `src/test/` before running `npm run test:run`.
- Large UI refactors: `npm run lint` in addition to the build. Fix all lint errors before considering the task done.
