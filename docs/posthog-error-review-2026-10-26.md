# PostHog error review — October 26, 2026

Read Progeny project 95399 using `posthog-cli api`, across all issue statuses over the last 30 days, with the default test-account exclusion. Paginated through all 37 issue groups and inspected samples for recent failures and selected older exceptions. Counts below are exploratory issue aggregates, not saved metric definitions, and users must not be summed across groups.

## Confirmed reproducible bug

[Sheet DOM removal failure](https://eu.posthog.com/project/95399/error_tracking/01a152c3-cd95-7fb0-a1c7-5a969794638a): 4 occurrences, 2 users, 2 sessions; last seen October 24 at 12:56 UTC. The latest two exceptions report React `removeChild` failures on `/sheet`, with a component stack through a paragraph, Mantine layout components and the sheet bundle. The local pre-change bundle map places the corresponding component position in `TheBlood.tsx`; the historical production bundle is no longer served, so that mapping is provisional.

Reproduction against current code: render a Brujah's blood section, replace the bane and compulsion text nodes with translator-style `<font>` elements, then clear the clan. React attempts to remove detached text nodes, throwing `NotFoundError: The node to be removed is not a child of this node.` This reproduces the reported failure class; telemetry alone cannot prove the exact user's interaction or that translation caused every occurrence.

Fix: give each dynamic clan-trait string its own stable span. React can clear the span's contents without removing a detached sibling text node. Translation remains available. The regression test performs the DOM mutation, clears both traits and restores them. It failed before the fix with two DOMExceptions and passes after it.

## Other recent signals

| Signal | Evidence and disposition |
| --- | --- |
| [Stale lazy assets](https://eu.posthog.com/project/95399/error_tracking/01a0ca3f-e124-7681-aeb9-90f844c0b7ed) | 282 occurrences / 223 users in the window. Latest sample is `asset-preload:reload-requested`. Existing guarded reload and recovery telemetry already handle this path. A requested reload does not establish successful recovery; no additional defect reproduced in this review. |
| [Load failure](https://eu.posthog.com/project/95399/error_tracking/01a14a50-f760-7893-b22b-2f3bc6cd6015) and [save-before-load failure](https://eu.posthog.com/project/95399/error_tracking/01a14150-2caa-7d11-b9c9-359d9db8b7a5) | Latest October 25 events on current release `f2549a5` report `TypeError`, no HTTP status, and `unknown` reason. Consistent with transport failures, but sanitized telemetry omits the underlying message. Existing handlers retain the draft and offer retry. No specific application root cause established. |
| [Autosave request failures](https://eu.posthog.com/project/95399/error_tracking/01a14670-d830-7d12-a176-5e8a56a424c9) | Latest sampled diagnostics are HTTP 401. Auth expiry is still occurring; no evidence here of lost drafts or a new reproducible persistence defect. |
| [Missing cloud draft](https://eu.posthog.com/project/95399/error_tracking/01a1376f-980e-71e0-9981-5a7033766b1b) | Recent events have `not_found` with no error object/status. Current code explicitly emits this when the missing-character modal opens. This is a recovery-needed signal, not evidence that clicking Restore failed. Existing restore creates a new document. |
| [Import validation](https://eu.posthog.com/project/95399/error_tracking/01a0d3f7-002a-73b1-a1a6-7e4ae397210e) | Latest event is compatibility `invalid_union` during JSON import. No source file or detailed invalid payload available to reproduce a compatibility defect; rejection alone is not enough to change validation. |
| [ParityDigital TypeError](https://eu.posthog.com/project/95399/error_tracking/01a16d08-ba61-7660-89b5-3266c92cbe6a) and [adoptedStyleSheets TypeError](https://eu.posthog.com/project/95399/error_tracking/01a16a0b-728b-7071-83d5-1d5f99e4c6d3) | One occurrence each, first seen October 24 and 23 respectively. Signatures suggest injected browser/wallet/style scripts; no matching application source identified. No speculative application patch. |
| [Analytics timeout](https://eu.posthog.com/project/95399/error_tracking/01a1502c-21a8-72c0-bf37-1f139132a193) | `PostHog request timed out after 3000ms`, last October 22. No application stack or local reproduction established. |
| Older RangeErrors and injected bridge errors | October 13–15 samples lack useful application source frames; some point at inline `/create` scripts with invalid source maps. Remain unproven rather than marked fixed. |

No PostHog issue status was changed. The sheet fix requires review and deployment before production resolution can be claimed.

## Validation

- Independent fresh-agent review: approved, no actionable findings; production attribution remains provisional.
- Regression test: reproduced two DOMExceptions before the fix; passes after the fix.
- Frontend tests: 105 files, 633 tests passed.
- Frontend `pnpm exec tsc --noEmit`, production `pnpm run build`, and repository lint passed.
- Local Node is 24.14.1, below the repository's requested 24.22.1; pnpm emitted an engine warning. The build also warned that the existing HEAD release was not found during source-map processing, but completed successfully.
