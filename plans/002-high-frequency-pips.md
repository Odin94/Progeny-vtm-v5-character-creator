# 002 — Make sheet pips immediate

- **Status**: DONE
- **Implemented by**: `11c93d2`
- **Commit**: e906f7b
- **Severity**: HIGH
- **Category**: Purpose & frequency; physicality; accessibility
- **Estimated scope**: 3 files, medium

## Problem

Frequently edited character-sheet pips animate from `scale(0)`, take 300ms, cascade with 50ms delays, and enlarge to 1.15 on hover.

```tsx
/* frontend/src/character_sheet/components/PipButton.tsx:79 — current */
onMouseEnter={(event) => {
    if (onClick && !isDisabled) event.currentTarget.style.transform = "scale(1.15)"
}}
```

```tsx
/* frontend/src/character_sheet/components/PipButton.tsx:92 — current */
transform: filled ? "scale(1.3)" : "scale(0)",
transition: `transform 0.3s ease-out ${delay}s`,
```

The same pattern exists in `frontend/src/character_sheet/components/SimpleSquarePipButton.tsx:76-90`. `SquarePipButton.tsx:63-70` repeats the oversized hover transform.

## Target

- Delete stagger/delay calculation from circular and simple-square pips.
- Empty fill: `opacity: 0; transform: scale(0.95)`.
- Filled state: `opacity: 1; transform: scale(1)`.
- Transition: `opacity 140ms cubic-bezier(0.23, 1, 0.32, 1), transform 140ms cubic-bezier(0.23, 1, 0.32, 1)`.
- Remove mouse-enter/mouse-leave enlargement from all three pip components.
- Add press feedback only when interactive: `whileTap` is not required; use pointer handlers or a CSS/Mantine style `&:active` with `transform: scale(0.97)` and `140ms cubic-bezier(0.23, 1, 0.32, 1)`.
- Respect `prefers-reduced-motion: reduce`: keep opacity/color feedback at 120ms and do not scale or draw stroke paths. In React, `useReducedMotion()` may set the empty transform to `scale(1)` and SquarePip stroke duration to `0.12` with opacity-only if feasible.

## Repo conventions to follow

- These components use Mantine `ActionIcon` and inline style objects; keep that structure.
- `frontend/src/index.css` contains shared motion tokens after plan 001, but inline React styles must use the exact cubic-bezier string if CSS variables are impractical.

## Steps

1. Remove delay state, refs, effects, and props that exist only to stagger fill transitions in `PipButton.tsx` and `SimpleSquarePipButton.tsx`; keep public props if callers require them, but ignore obsolete delay behavior until callers can be cleaned safely.
2. Replace `scale(0)`/`scale(1.3)` with the exact opacity and scale targets.
3. Remove 1.15 hover handlers from all three pip components.
4. Add restrained 0.97 press feedback for enabled interactive pips.
5. Add reduced-motion behavior, including the SVG damage strokes in `SquarePipButton.tsx`.

## Boundaries

- Do not change pip values, click semantics, disabled behavior, tooltip text, colors, or dimensions.
- Do not change character state logic.
- Do not add dependencies.
- If cited code drifted from commit `e906f7b`, stop and report.

## Verification

- **Mechanical**: `cd frontend && pnpm run build`; `cd frontend && pnpm run test:run`.
- **Feel check**: rapidly click attributes, skills, hunger, humanity, health, and willpower pips. Confirm fills respond immediately, never emerge from nothing, do not cascade, and only compress subtly while pressed. With reduced motion, confirm fills use opacity without spatial scaling.
- **Done when**: no `scale(0)`, 300ms pip transition, stagger delay, or 1.15 pip hover remains.
