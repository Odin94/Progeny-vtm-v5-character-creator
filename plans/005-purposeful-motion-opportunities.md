# 005 — Add purposeful state-boundary motion

- **Status**: DONE
- **Implemented by**: `e2ac170`
- **Commit**: e906f7b
- **Severity**: LOW
- **Category**: Missed opportunities
- **Estimated scope**: 3 files, medium

## Problem

Three rare or occasional state boundaries teleport: final completion appears all at once, the cookie banner mounts/unmounts instantly, and chat setup/copy confirmation states swap with little spatial or state feedback. Custom Final action cards also lack press feedback.

```tsx
/* frontend/src/generator/components/Final.tsx:391 — current */
<div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
```

```tsx
/* frontend/src/components/CookiesBanner.tsx:104 — current */
if (!showBanner) {
    return null
}
```

```tsx
/* frontend/src/character_sheet/components/ChatWindow.tsx:546 — current */
<Tooltip label={copiedSessionId ? "Copied!" : "Copy to clipboard"}>
    <ActionIcon color={copiedSessionId ? "green" : primaryColor}>
        <IconCopy size={16} />
    </ActionIcon>
</Tooltip>
```

## Target

1. Final completion, rare:
   - Header enters opacity 0 + `translateY(8px)` to settled over 220ms `[0.23, 1, 0.32, 1]`.
   - Action cards render immediately with no entrance animation or stagger.
   - `.nf-action-card:active { transform: scale(0.98) }` with 120ms `[0.23, 1, 0.32, 1]`; reduced motion removes scale.
2. Cookie banner, rare/occasional:
   - Keep it mounted through exit using Mantine `Transition`, `AnimatePresence`, or equivalent already-installed tooling.
   - Enter/exit opacity plus `translateY(12px)` over 180ms `[0.23, 1, 0.32, 1]`, preserving the existing horizontal `translateX(-50%)` centering.
   - Reduced motion: opacity-only 120ms.
3. Chat setup, occasional:
   - Copy icon crossfades to `IconCheck` with opacity and scale 0.97→1 over 140ms `[0.23, 1, 0.32, 1]`; color remains green during success.
   - Setup subviews (`creating`, `joining`, `joiningCoterie`, `disconnected`) use directional opacity + `translateX(8px)` over 160ms `[0.77, 0, 0.175, 1]` without delaying input.
   - Reduced motion: opacity-only 120ms and no translation/scale.

## Repo conventions to follow

- Framer Motion and Mantine transitions are already dependencies; do not add another animation library.
- `CharacterSheetMenu.tsx` is the existing directional subview exemplar, but use 8px rather than its current 40px travel.
- Use `useReducedMotion()` for JS motion.

## Steps

1. Animate only the Final header; render action cards immediately and add active card feedback with reduced-motion behavior.
2. Replace CookieBanner's early return with an interruptible mounted transition that supports exit and preserves positioning.
3. Add copy-to-check state animation in ChatWindow.
4. Wrap chat setup subviews in a keyed, interruptible transition with exact directional travel and reduced-motion behavior.

## Boundaries

- Do not animate chat message arrivals, generator step navigation, live coterie vitals, or pip hovers.
- Do not change copy, action behavior, consent logic, chat connection logic, or component dimensions.
- Do not add dependencies.
- If cited code drifted from commit `e906f7b`, stop and report.

## Verification

- **Mechanical**: `cd frontend && pnpm run build`; `cd frontend && pnpm run lint`; `cd frontend && pnpm run test:run`.
- **Feel check**: complete a character; confirm all Final action cards are visible immediately and click each one; show, accept, decline, and close the cookie banner; create and join chat sessions; copy a session ID. Confirm no animation blocks input, rapid reversals retarget cleanly, and reduced motion keeps opacity/state feedback while dropping movement. Inspect the cookie exit at 10% playback.
- **Done when**: the approved state-boundary motion is present, Final action cards have no entrance animation, and no rejected candidate gained motion.
