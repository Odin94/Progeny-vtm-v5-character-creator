# Animation improvement plans

| # | Plan | Severity | Status | Dependencies |
| --- | --- | --- | --- | --- |
| 001 | Establish motion foundations and accessibility | MEDIUM | DONE | None |
| 002 | Make sheet pips immediate | HIGH | DONE | 001 |
| 003 | Fix dice physicality and frame pacing | HIGH | DONE | 001 |
| 004 | Simplify generator and layout motion | HIGH | DONE | 001 |
| 005 | Add purposeful state-boundary motion | LOW | DONE | 001, 004 |

Recommended execution order: 001 → 002 and 003 → 004 → 005. Plans 002 and 003 may run in parallel after the shared tokens exist. Plans 004 and 005 must use the same executor stream because both edit `frontend/src/generator/components/Final.tsx`.
