# P03 — Generator import silently corrupts non-ASCII text

**Status: Fixed and verified** on `fix/odin/review-bug-fixes` (`c0d5d89`, with review follow-ups in `df8b153`). Original reproduction and cause below are historical; the implemented fix is recorded at the end.

Severity: **High**. Confirmed through the actual file picker and overwrite confirmation at `4a93b19`; screenshot: `../../../evidence/progeny-unicode-import.png`.

Revalidated on committed revision `1598820` after incorporating the newer local performance work. Uncommitted architecture changes in the primary checkout were outside this review.

## Reproduction and evidence

Import a valid UTF-8 character JSON with name `Élodie 李华 🦇` and description `Grüße aus Köln` through the generator's **Load From File** control. Confirm overwrite. The imported name starts with `Ã` instead of `É`, and the description becomes `GrÃ¼Ãe aus KÃ¶ln`. These corrupted strings are persisted to localStorage. Validation succeeds because they are still strings.

The character-sheet import path uses UTF-8 decoding and does not have this bug.

## Cause

`frontend/src/components/LoadModal.tsx` reads a data URL and calls `atob`. That returns binary bytes represented as a JavaScript string, not decoded UTF-8. Its Buffer fallback only executes if base64 decoding throws, which valid UTF-8 base64 does not do.

## Suggested fix

Read the file with `await loadedFile.text()`, or decode the bytes with `TextDecoder('utf-8')`. Share one import decoding function between generator and sheet.

Regression: export/import accented Latin text, CJK, emoji, and combining marks through both visible import flows, asserting exact string equality after reload.

## Implemented fix

Implemented a shared `loadCharacterFromFile` helper using `File.text()` for generator, sheet and account-page imports. UTF-8 text remains exact through parsing and compatibility migration.

Regression coverage: `backend/src/characterConcurrency.test.ts`, `frontend/src/test/characterAutosave.test.tsx`, `frontend/src/test/debouncedFieldIdentity.test.tsx`, and `frontend/src/test/jsonImport.test.ts`. Browser validation and screenshots are recorded in the shared `evidence/fixes` directory.
