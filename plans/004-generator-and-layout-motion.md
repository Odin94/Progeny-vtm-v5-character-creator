# 004 — Simplify generator and layout motion

- **Status**: DONE
- **Implemented by**: `e2ac170`
- **Commit**: e906f7b
- **Severity**: HIGH
- **Category**: Purpose & frequency; performance; duration
- **Estimated scope**: 6 files, medium

## Problem

Generator prompts animate slowly and pulse indefinitely; step markers use `transition: all`; the intro character-sheet CTA runs perpetual scale, painted gradient, wand, and 12 particle animations; account reveal and chat docking animate layout properties.

```tsx
/* frontend/src/generator/components/sharedGeneratorUi.tsx:224 — current */
<motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: isPast ? 0.28 : isActive ? 1 : 0.5, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
```

```tsx
/* frontend/src/components/CharacterSheetLinkButton.tsx:27 — current */
animate={{ scale: [1, 1.05, 1] }}
transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
```

```tsx
/* frontend/src/generator/components/Final.tsx:493 — current */
transition: "opacity 400ms ease, max-height 400ms ease",
```

```tsx
/* frontend/src/pages/CoteriePage.tsx:565 — current */
paddingRight: desktopChatDocked ? 460 : 0,
transition: "padding-right 160ms ease"
```

## Target

- Generator status lines use a 160ms opacity transition with `[0.23, 1, 0.32, 1]`; initial movement is at most `translateY(4px)` and is removed for reduced motion.
- The active chevron is static; remove its infinite opacity animation.
- Replace `transition: all` in `sharedGeneratorUi.tsx` and `AsideBar.tsx` with explicit intended properties. Do not animate font size or other layout-affecting properties.
- Character-sheet CTA: static gradient border; no infinite outer scale, background rotation, particles, or wand loop. Add one normal-mode entrance from opacity 0 and scale 0.97 to settled over 240ms `[0.23, 1, 0.32, 1]`; reduced motion uses 120ms opacity only. Optional fine-pointer hover is `scale(1.02)` over 160ms.
- Final account card: render only when auth is resolved and user is signed out. Enter with opacity 0 and `translateY(8px)` over 200ms `[0.23, 1, 0.32, 1]`; reduced motion opacity-only 120ms. Do not animate max-height.
- Coterie chat docking: remove the `padding-right` transition. The layout change happens immediately.

## Repo conventions to follow

- Keep Mantine and Framer Motion already present.
- Use `useReducedMotion()` for JS movement.
- Use full `transform` strings when replacing Framer scale/y shorthands where practical.

## Steps

1. Tighten generator prompt transitions, remove perpetual chevron animation, and add reduced-motion handling.
2. Replace both cited `transition: all` declarations with explicit properties.
3. Simplify `CharacterSheetLinkButton.tsx` to the static CTA plus one entrance and restrained fine-pointer hover; remove particle generation/state that becomes unused.
4. Replace the Final account max-height animation with conditional rendering and opacity/transform entry.
5. Remove animated `padding-right` from `CoteriePage.tsx`.

## Boundaries

- Do not change generator state, step order, CTA labels, navigation, auth logic, account copy, or chat docking behavior.
- Do not alter dice motion; plan 003 owns it.
- Do not add dependencies.
- If cited code drifted from commit `e906f7b`, stop and report.

## Verification

- **Mechanical**: `cd frontend && pnpm run build`; `cd frontend && pnpm run lint`; `cd frontend && pnpm run test:run`.
- **Feel check**: progress through generator steps quickly, dwell on the intro CTA, reach Final while signed out and signed in, and toggle docked coterie chat. Confirm prompts respond immediately, nothing pulses forever, the CTA still feels special without distraction, the account card arrives without layout animation, and docking does not reflow over time. Repeat with reduced motion.
- **Done when**: no cited infinite loop, `transition: all`, max-height transition, or padding transition remains.
