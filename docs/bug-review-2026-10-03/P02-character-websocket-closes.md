# P02 — Character WebSocket closes immediately after connecting

Severity: **Medium**. Confirmed with a real browser connection to the running API at `4a93b19`.

Revalidated on committed revision `1598820` after incorporating the newer local performance work. Uncommitted architecture changes in the primary checkout were outside this review.

## Reproduction and evidence

Set an authenticated fixture session cookie, connect to `/ws/characters`, then send a subscribe message for an owned character. Observed sequence: `open`, then abnormal `close` with code **1006**, with no subscription acknowledgement. REST authentication and character reads succeed for the same session.

## Cause

`backend/src/websocket/characterSync.ts` treats the first handler argument as an object with `.socket`. The installed `@fastify/websocket` v11 passes the WebSocket itself. Accessing `connection.socket.on`, `.close`, and `.send` therefore fails. The session-chat handler already uses the correct socket API.

## Suggested fix

Use the socket argument directly throughout the character handler and add an authenticated network-level subscription test. Before enabling the update path, apply the REST character schema, ownership, and save-revision checks there too: the existing path accepts arbitrary data and a caller-supplied schema version without incrementing `characterVersion`.

Regression: authorized subscribe/update/unsubscribe succeeds; unauthorized connections close with 1008; shared readers cannot update; malformed and stale updates cannot alter storage.
