# 003 — Fix dice physicality and frame pacing

- **Status**: DONE
- **Implemented by**: `2cb3c2f`
- **Commit**: e906f7b
- **Severity**: HIGH
- **Category**: Easing; physicality; performance; accessibility
- **Estimated scope**: 4 files, medium-to-large

## Problem

Dice and result icons enter from `scale(0)`. A multi-die exit uses `easeIn`, and many dice simultaneously animate Framer Motion `x`, `y`, `scale`, and rotation shorthands.

```tsx
/* frontend/src/character_sheet/components/diceRollModal/parts/Die.tsx:41 — current */
initial={{ scale: 0, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
exit={{ scale: 0, opacity: 0 }}
```

```tsx
/* frontend/src/character_sheet/components/diceRollModal/parts/DiceContainer.tsx:107 — current */
exit={{
    opacity: 0,
    scale: 0.3,
    x: finalX + randomOffsetX,
    y: finalY + randomOffsetY,
    rotateZ: randomRotationZ,
    transition: { duration: 0.4, ease: "easeIn", delay: index * 0.05 }
}}
```

```tsx
/* frontend/src/character_sheet/components/diceRollModal/parts/SuccessResults.tsx:182 — current */
initial={{ opacity: 0, scale: 0, rotate: -180 }}
```

## Target

- Mobile die and result icon entrances start at `scale(0.95)` plus opacity 0; desktop theatrical die entrances may use `scale(0.9)` plus opacity 0.
- Dynamic multi-die wrappers animate full transform strings such as `translate3d(<x>px, <y>px, 0) rotateZ(<deg>) scale(<n>)`, not Framer `x`/`y`/`scale` shorthands.
- Multi-die exit uses `duration: 0.2`, easing `[0.23, 1, 0.32, 1]`, no per-index exit delay, and target scale no lower than `0.95`.
- Preserve the playful 3D roll and existing deterministic seeded positions.
- Add `useReducedMotion()` across dice container, die, result summary, and modal. Reduced motion places dice directly at final positions, removes rotation/translation/scale movement, and retains a 120ms opacity transition.
- Mobile drawer reduced motion keeps the overlay fade but uses `y: 0` for both initial and animate states.

## Repo conventions to follow

- Keep Framer Motion, seeded random calculations, `AnimatePresence`, and current component boundaries.
- Use exact curves from `AUDIT.md`; do not invent spring constants.
- Normal mobile drawer spring may remain `{ type: "spring", damping: 25, stiffness: 200 }` because it is gesture-like occasional UI.

## Steps

1. Add `useReducedMotion()` to `Die.tsx`, `DiceContainer.tsx`, `SuccessResults.tsx`, and `DiceRollModal.tsx`.
2. Replace every dice/result `scale: 0` entrance/exit with 0.95 or 0.9 plus opacity as specified.
3. Rewrite simultaneous multi-die wrapper motion to animate full transform strings while preserving final layout and seeded randomness.
4. Replace `easeIn`, 400ms exit, and exit stagger with the exact 200ms strong ease-out response.
5. Add reduced-motion branches that remove positional and rotational movement but retain 120ms opacity.

## Boundaries

- Do not change dice outcomes, RNG seeding, roll duration, selection logic, drag behavior, dimensions, or result calculation.
- Do not remove the normal-mode playful dice roll.
- Do not add dependencies.
- If cited code drifted from commit `e906f7b`, stop and report.

## Verification

- **Mechanical**: `cd frontend && pnpm run build`; `cd frontend && pnpm run test:run`.
- **Feel check**: roll 1 die, 10 dice, and the maximum supported pool on desktop and mobile; reroll selectable dice; open/close the mobile drawer. Confirm exits begin immediately, no die collapses from/to nothing, and large pools stay smooth. Inspect at 10% playback. With reduced motion, dice should fade directly into final positions without flying, spinning, or scaling.
- **Done when**: no dice/result `scale(0)` or `easeIn` remains, large-pool wrapper motion uses full transform strings, and all four surfaces honor reduced motion.
