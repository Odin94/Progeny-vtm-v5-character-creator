# 001 — Establish motion foundations and accessibility

- **Status**: DONE
- **Implemented by**: `28ef7a1`
- **Commit**: e906f7b
- **Severity**: MEDIUM
- **Category**: Accessibility; cohesion & tokens; performance
- **Estimated scope**: 6 files, small-to-medium

## Problem

Progeny repeats weak built-in easing strings, has no shared motion vocabulary, leaves movement active for reduced-motion users, and applies transformed hover states without pointer capability gating.

```css
/* frontend/src/App.css:40 — current */
.hoverCard {
    box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px;
    transition: all 0.15s ease-in-out;
}
```

```tsx
/* frontend/src/pages/LandingPage.tsx:206 — current */
<motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: "easeOut" }}
>
```

```css
/* frontend/src/pages/LandingPage.css:178 — current */
.landing-page__primary-button:hover {
    transform: translateY(-1px);
}
```

`frontend/src/App.css:10` contains the only `prefers-reduced-motion` rule, and it protects unused create-react-app logo CSS rather than current UI.

## Target

Add these exact tokens to `frontend/src/index.css`:

```css
:root {
    --motion-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --motion-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
    --motion-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
    --motion-duration-press: 140ms;
    --motion-duration-ui: 180ms;
}
```

Remove the unused `.App-logo`, `.App-header`, `.App-link`, `@keyframes App-logo-spin`, and `.hoverCard` rules from `frontend/src/App.css`. Preserve any genuinely used rules.

For landing-page transformed hovers, wrap only the transform/box-shadow hover rules in:

```css
@media (hover: hover) and (pointer: fine) { ... }
```

Add:

```css
@media (prefers-reduced-motion: reduce) {
    .landing-page__primary-button,
    .landing-page__feature-card {
        transition-property: color, background-color, border-color, opacity;
    }
}
```

In `LandingPage.tsx`, use Framer Motion's `useReducedMotion()` so reduced motion changes the hero initial state to `{ opacity: 0, y: 0 }` and duration to `0.12`; normal motion uses `{ opacity: 0, y: 28 }`, duration `0.55`, and easing `[0.23, 1, 0.32, 1]`.

In `CharacterSheetMenu.tsx`, use `useReducedMotion()` so menu view transitions keep the 180ms opacity transition but all `x` values become `0` for reduced motion. Use the full `transform` string for normal motion if practical; otherwise retain `x` because only one small menu pane moves at a time.

## Repo conventions to follow

- Global CSS already enters through `frontend/src/index.css`; place shared custom properties in its root-level token area.
- Framer Motion is already used in `LandingPage.tsx` and `CharacterSheetMenu.tsx`; do not add dependencies.
- Preserve Mantine component structure.

## Steps

1. Add the exact shared motion tokens to `frontend/src/index.css`.
2. Remove unused create-react-app and `.hoverCard` animation CSS from `frontend/src/App.css` after confirming no consumers with `rg 'App-logo|App-header|App-link|hoverCard' frontend/src`.
3. Gate landing transformed hover motion behind fine-pointer hover media queries and add the reduced-motion override.
4. Add `useReducedMotion()` handling to the landing hero with the exact states and timings above.
5. Add reduced-motion handling to character-sheet menu pane transitions, preserving opacity feedback.

## Boundaries

- Do not change layout, copy, colors, or component hierarchy.
- Do not alter Mantine modal transition behavior.
- Do not add dependencies.
- If the cited code has drifted from commit `e906f7b`, stop and report instead of improvising.

## Verification

- **Mechanical**: `cd frontend && pnpm run build`; `cd frontend && pnpm run lint`.
- **Feel check**: open the landing page and character-sheet menu. Confirm the landing hero has one restrained entrance, hover lift only occurs with a mouse/trackpad, and menu navigation remains crisp. In DevTools Rendering, emulate `prefers-reduced-motion: reduce` and confirm position movement disappears while opacity feedback remains.
- **Done when**: tokens exist once, dead animation CSS is gone, hover movement is pointer-gated, and both Framer surfaces respect reduced motion.
