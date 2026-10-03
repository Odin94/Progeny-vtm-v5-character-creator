# P04 — A pending field edit can land on a different character

Severity: **High**. Confirmed in two real browser tabs at `4a93b19`.

Revalidated on committed revision `1598820` after incorporating the newer local performance work. Uncommitted architecture changes in the primary checkout were outside this review.

## Reproduction and evidence

Open character A with an empty description. Type `PRIVATE DESCRIPTION FOR SHEET A`. Before the 150 ms debounce fires, replace the current character from another tab with character B, also with an empty description. After the storage event and timer, the stored document has B's ID and name but A's private description.

The reproduction uses the browser's actual storage event, textarea, and character hook. Evidence: `progeny-pending-field.js`, `browser-results.json:P04`, and `progeny-pending-description-wrong-sheet.png` in the shared review harness/evidence directories.

## Cause

`frontend/src/character_sheet/utils/useDebouncedUncontrolledField.ts` cancels pending edits when the external field value changes, but does not track the document's identity. Its timer merges into whichever character is current when it fires. `sections/TopData.tsx` additionally memoizes `DescriptionField` without comparing character IDs, so equal descriptions suppress the identity change altogether. The number-field variant has the same identity omission.

## Suggested fix

Give every draft a stable identity. Capture that identity when scheduling an edit, and apply it only to that document. Cancel or deliberately flush pending changes during a character replacement; include identity in effect dependencies and memo comparisons. Preserve unsaved edits to A through the replacement flow instead of silently applying them to B.

Regression: switch between two characters with identical initial values during a pending string or number edit; B must stay unchanged. Also cover an external same-field change and component unmount.

## Implemented fix

Implemented local draft identities, identity checks in functional delayed writes, identity-aware memoization and cancellation on document replacement. Interrupted text/number edits are preserved as full JSON recovery drafts using the latest source snapshot; the sheet menu offers recovery downloads.

Regression coverage: `backend/src/characterConcurrency.test.ts`, `frontend/src/test/characterAutosave.test.tsx`, `frontend/src/test/debouncedFieldIdentity.test.tsx`, and `frontend/src/test/jsonImport.test.ts`. Browser validation and screenshots are recorded in the shared `evidence/fixes` directory.
