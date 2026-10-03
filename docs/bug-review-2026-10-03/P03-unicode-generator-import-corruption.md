# P03 — Generator import silently corrupts non-ASCII text

Severity: **High**. Confirmed through the actual file picker and overwrite confirmation at `4a93b19`; screenshot: `../../../evidence/progeny-unicode-import.png`.

## Reproduction and evidence

Import a valid UTF-8 character JSON with name `Élodie 李华 🦇` and description `Grüße aus Köln` through the generator's **Load From File** control. Confirm overwrite. The imported name starts with `Ã` instead of `É`, and the description becomes `GrÃ¼Ãe aus KÃ¶ln`. These corrupted strings are persisted to localStorage. Validation succeeds because they are still strings.

The character-sheet import path uses UTF-8 decoding and does not have this bug.

## Cause

`frontend/src/components/LoadModal.tsx` reads a data URL and calls `atob`. That returns binary bytes represented as a JavaScript string, not decoded UTF-8. Its Buffer fallback only executes if base64 decoding throws, which valid UTF-8 base64 does not do.

## Suggested fix

Read the file with `await loadedFile.text()`, or decode the bytes with `TextDecoder('utf-8')`. Share one import decoding function between generator and sheet.

Regression: export/import accented Latin text, CJK, emoji, and combining marks through both visible import flows, asserting exact string equality after reload.
