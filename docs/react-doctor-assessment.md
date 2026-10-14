# Frontend React Doctor assessment

Scan date: 2026-10-14. React Doctor 0.9.17, Vite, React 19, 381 source files.

## Running it

From `frontend/`:

- `pnpm run doctor`: full source audit.
- `pnpm run doctor:changed --base origin/main`: new findings compared with a Git base.
- `pnpm run doctor --json --json-out /tmp/progeny-react-doctor.json`: machine-readable report.

The commands disable telemetry/remote scoring and Socket.dev dependency checks. They retain the default error exit status so findings are visible to callers. This is a local static audit, not a browser performance measurement or a dependency security audit. No numeric health score was requested. The dependency is pinned and the pnpm lockfile records the resolved version; the existing package-age policy was preserved. No rules were suppressed to improve the result.

Official references: https://www.react.doctor/docs/overview/quickstart and https://www.react.doctor/docs/reference/cli-reference. The installed CLI's `--help` is authoritative for this pinned version; the online docs may describe newer releases.

## Results

322 diagnostics: **16 errors, 306 warnings, 93 affected files**. The scan completed successfully (`ok: true`); exit status 1 indicates error diagnostics, not a failed scan. Counts are diagnostic occurrences, not distinct confirmed bugs. Some rules report the same underlying issue twice.

### Priorities after inspecting representative findings

1. **Review render-time ref writes first (14 errors).** `useAutosaveCharacter.tsx:118–121,141,252`, `useCharacterLocalStorage.tsx:56`, `useCharacterNotesController.ts:42`, dice components, and conflict/recovery modals assign refs while rendering. The reported assignments are present. These patterns let callbacks observe a render that React might discard; they are concurrency risks rather than evidence of current data loss. Refactor carefully around committed values, callback freshness, and save/transition ordering, with existing persistence regression tests. Do not mechanically move everything into passive effects.
2. **Fix concrete accessibility gaps.** `PointPicker.tsx:32` uses clickable spans without keyboard interaction; `Final.tsx:868` has an icon-only close button without a name; `Final.tsx:897` nests a link inside an export button. These are useful actionable findings. Prefer native controls/Mantine primitives and separate the link from the export action.
3. **Fix ineffective memoization.** `Loresheets.tsx:45–66` rebuilds `availableLoresheets` on each render, then uses it as a `useMemo` dependency at line 82. Both the fresh-dependency error and exhaustive-deps warning identify the same issue. Memoizing construction by `homebrewCollections` or removing the ineffective memo is reasonable. Severity is overstated: this is wasted computation, not a proven infinite effect loop.
4. **Review stale dependencies and list identity in context.** There are 20 exhaustive-deps and 31 index-key findings. Dynamic editable/reordered lists warrant stable IDs; fixed positional pips generally do not. `PointPicker` indices represent fixed positions. Blindly adding every dependency to persistence effects can alter their lifecycle and interrupt pending edits.
5. **Use maintainability findings to choose focused refactors.** 39 large-component and 31 complexity warnings flag areas such as the app shell, account page, and dice modal. They overlap and use thresholds. Extract coherent responsibilities when changing those areas; splitting purely to reach a score can make code harder to follow.
6. **Measure performance before broad changes.** 14 LazyMotion suggestions, 17 Set/Map suggestions, and smaller allocation warnings are candidates, not measured regressions. Small bounded game-rule lists may gain little from additional structures; bundle impact and render traces should justify work.

### Findings that need qualification or should be deprioritized

- **Object URL cleanup: confirmed false positives in sampled paths.** `CharacterSheetMenu.tsx:122` and `generator/utils.ts:59` assign the URL to `link.href`, then revoke `link.href` in a timeout. The analyzer does not prove that alias. Nine warnings exist overall; inspect the remaining paths before calling them leaks. Storing an explicit URL variable may make ownership clearer but is not necessary to fix these sampled paths.
- **Unsafe JSON parse: internally constrained input.** `useCoteries.tsx:29` parses pending operation keys; `modules/coterieMembership.ts` creates them with `JSON.stringify(command)`. This is not arbitrary untrusted JSON. A future typed pending-operation API could eliminate parsing, but adding catch-and-ignore here is not an urgent fix.
- **Missing mutation invalidation: not universal.** `RecentChangesGate.tsx:13` consumes a one-time delivery result into local modal state. A mutation does not automatically require query invalidation when no corresponding cached read is used. Review the other occurrence independently.
- **Derived-state warning on debounced fields needs care.** `useDebouncedUncontrolledField.ts:70` resets editable state when the character identity changes and preserves interrupted edits. Local state has a purpose beyond copying props; replacing it with a derived value would break the editing behavior.
- **Empty ARIA attribute needs rendered-DOM verification.** `ThreeDice.tsx:153` sets `aria-label="Die actions"` and an empty `aria-labelledby` on Mantine's dropdown. The empty value is flagged, but it may intentionally override Mantine's generated trigger association (the trigger is an invisible positioning anchor). Verify the accessible name before deciding the correction.
- **Sequential benchmark work is intentional.** `scripts/benchmarkBundle.mjs:19` is a benchmark script; parallelizing samples would change the measurement. Test-file cloning also has little relevance to production performance.

## Recommendation

Keep React Doctor as an additional advisory review tool. It finds real issues beyond our existing `oxlint src` command, especially React lifecycle and accessibility concerns, but its severity and total count overstate confirmed bugs. Start with accessibility, committed ref/callback semantics, and the loresheet memoization. Review persistence findings with regression coverage. Consider a changed-scope CI gate after validating and tuning the rules; keep the existing linter, TypeScript checks, tests, and production build.

This setup deliberately adds no automatic fixes or CI gate. Application source is unchanged.

## Rule counts

| Rule | Occurrences |
| --- | ---: |
| `no-adjust-state-on-prop-change` | 70 |
| `no-giant-component` | 39 |
| `no-high-complexity-react-function` | 31 |
| `no-array-index-as-key` | 31 |
| `exhaustive-deps` | 20 |
| `only-export-components` | 18 |
| `js-set-map-lookups` | 17 |
| `use-lazy-motion` | 14 |
| `no-ref-current-in-render` | 14 |
| `no-create-object-url-without-revoke` | 9 |
| `rerender-state-only-in-handlers` | 7 |
| `rerender-lazy-state-init` | 5 |
| `no-loading-flag-reset-outside-finally` | 4 |
| `no-non-null-assertion-on-maybe-undefined-result` | 4 |
| `click-events-have-key-events` | 4 |
| `no-static-element-interactions` | 4 |
| `async-await-in-loop` | 3 |
| `no-reset-all-state-on-prop-change` | 3 |
| `no-derived-state` | 3 |
| `motion-animate-presence-must-outlive-child` | 2 |
| `query-mutation-missing-invalidation` | 2 |
| `html-no-nested-interactive` | 2 |
| `no-pass-data-to-parent` | 2 |
| `no-fetch-response-used-without-status-check` | 2 |
| `prefer-use-sync-external-store` | 1 |
| `duplicate-jsx-subtree` | 1 |
| `aria-proptypes` | 1 |
| `js-index-maps` | 1 |
| `js-hoist-intl` | 1 |
| `control-has-associated-label` | 1 |
| `no-effect-with-fresh-deps` | 1 |
| `no-spread-accumulator-in-reduce` | 1 |
| `no-unsafe-json-parse` | 1 |
| `no-noninteractive-element-to-interactive-role` | 1 |
| `rerender-lazy-ref-init` | 1 |
| `no-json-parse-stringify-clone` | 1 |

## Setup verification

`pnpm run lint` and `pnpm exec tsc --noEmit` passed. Both package scripts were exercised: the full scan reproduced 322 diagnostics and exited 1 as expected; the changed scan against `HEAD` completed with no new diagnostics. No application behavior changed, so no export/model regression tests were required.
