# P05 — Reloaded unsaved drafts are treated as already saved

**Status: Fixed and verified** on `fix/odin/review-bug-fixes` (`c0d5d89`, with review follow-ups in `df8b153`). Original reproduction and cause below are historical; the implemented fix is recorded at the end.

Severity: **High**. Confirmed against the running sheet and API at `4a93b19`.

Revalidated on committed revision `1598820` after incorporating the newer local performance work. Uncommitted architecture changes in the primary checkout were outside this review.

## Reproduction and evidence

Create an owned cloud character with description `SERVER BASE`. Leave an unsaved local document for the same ID with description `UNSAVED LOCAL DESCRIPTION`, as happens after an offline edit or closing before the 900 ms save timer. Reload the authenticated sheet and wait 3.8 seconds.

The sheet keeps the local text, but sends **zero PUT requests**. The API still returns `SERVER BASE`. With no further edit, the change never reaches another device. The local document is the only copy, despite the account being connected again.

Evidence: `progeny-restored-unsaved.js`, `browser-results.json:P05`, and `progeny-restored-unsaved.png` in the shared review directories. Authentication uses the local fixture session; character requests and autosave are real.

## Cause

`frontend/src/hooks/useAutosaveCharacter.tsx` initializes `lastSavedKeyRef` from the loaded local document when the active ID changes. While autosave is disabled during authentication/ownership loading it also resets that baseline. Enabling saving never compares the draft with the fetched cloud document or a durable server-confirmed baseline.

## Suggested fix

Persist a server-confirmed content signature/base separately from the editable document. On reload and reconnect, compare the two and resume the dirty save queue. Reconcile against the current remote revision using the conflict protection proposed in P01; uploading an old local draft unconditionally would create another overwrite path.

Regression: edit offline, reload, reconnect without another edit; verify eventual cloud persistence. Repeat with a newer remote version and require a preserved conflict rather than an overwrite.

## Implemented fix

Implemented comparison with the fetched owned cloud document rather than assuming the restored local document is saved. Confirmed bases are stored separately and advance only after acknowledged saves. Dirty drafts with matching cloud revisions resume saving; clean old bases adopt remote changes. Divergent drafts are kept locally, backed up and paused with a visible conflict notice.

Regression coverage: `backend/src/characterConcurrency.test.ts`, `frontend/src/test/characterAutosave.test.tsx`, `frontend/src/test/debouncedFieldIdentity.test.tsx`, and `frontend/src/test/jsonImport.test.ts`. Browser validation and screenshots are recorded in the shared `evidence/fixes` directory.

### Review round 1 follow-up

Recovery downloads now clear the cloud ID and save revision, so importing them opens a separate unsaved draft. Stored recovery entries retain the original source ID/revision as provenance. Added export/import regression coverage.
