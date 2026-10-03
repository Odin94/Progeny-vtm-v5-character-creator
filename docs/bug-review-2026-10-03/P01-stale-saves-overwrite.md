# P01 — Stale saves overwrite newer character edits

Severity: **High**. Confirmed with the running API at revision `4a93b19`.

## Reproduction and evidence

1. Create a character and retain its original data in two clients.
2. Client A saves `notes: "newer tab note"`.
3. Client B saves its original data with only `sire: "stale tab sire"` changed.
4. Fetch the character again.

Both PUT requests succeed. `characterVersion` advances from 0 to 1 to 2, but the final notes are empty. The API discards A's newer note without a conflict response. The same whole-document payload is sent by the frontend autosave hook.

## Cause

`backend/src/routes/characters.ts` reads and increments the revision, then updates by ID alone. The submitted `version` is the document schema version, not an expected save revision. `frontend/src/hooks/useAutosaveCharacter.tsx` supplies no concurrency precondition.

## Suggested fix

Require an expected `characterVersion`, perform an atomic update with ID, owner, and expected revision in the WHERE clause, and return 409 on a mismatch. Preserve the local draft and offer reload, fork, or a field-level three-way merge. Make manual saves and autosaves use the same contract.

Regression: two clients editing different and identical fields from the same base; the second save must preserve both edits or explicitly report conflict.
