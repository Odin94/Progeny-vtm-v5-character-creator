# Progeny design system — "Elysium Nocturne"

The look: a Vampire: The Masquerade 5e rulebook at night. Deep warm blacks, blood red and the
original Progeny violet as accents, tarnished gold for ornament, stark Cinzel display type over a
plain Inter body, a serif "lore" voice for flavor text, a whisper of film grain, and candlelit
glows used sparingly. It should feel dramatic and premium, never like a generic dark dashboard.

Everything below is wired into the Mantine theme, so **plain Mantine primitives already get the
look**. Page code should mostly compose primitives and tokens, not restyle them.

| Where                               | What                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/index.css`                     | CSS tokens (`--pg-*`, `--ease-*`), base styles, focus/selection/scrollbars, utilities         |
| `src/theme/theme.ts`                | `progenyTheme`: palettes, typography, radii, shadows, variant colors, component overrides     |
| `src/theme/components.module.css`   | The Mantine component skins referenced by `theme.ts`                                          |
| `src/theme/transitions.ts`          | Modal/popover/tooltip/drawer transitions (ease-out in, ease-in out)                           |
| `src/theme/tokens.ts`               | JS mirrors of the tokens (`color`, `font`, `radius`, `shadow`, `motion`, `zIndex`) + palettes |
| `src/theme/SigilLoader.tsx`         | Default `<Loader />` (type `sigil`)                                                           |
| `src/components/ui/`                | Shared building blocks (`import { … } from "~/components/ui"`)                                |
| `src/components/QuickNavigator.tsx` | ⌘K / Ctrl+K navigator (Mantine Spotlight)                                                     |
| `src/components/AppTopbar.tsx`      | Global top bar (also exported as `~/topbar/Topbar`)                                           |

---

## 1. Typography (3 fonts max — do not add more)

Self-hosted via `@fontsource/*`, imported once in `main.tsx`. No Google Fonts `@import`s.

| Token               | Font                          | Use for                                                                                                                                      |
| ------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--pg-font-display` | **Cinzel** 500/600/700        | Page titles, section titles, modal titles, clan/discipline names, the wordmark. Cinzel is all caps-style, so mixed case reads as small caps. |
| `--pg-font-body`    | **Inter** 400/500/600/700     | Everything functional: UI, labels, buttons, body copy, numbers. Mantine's `fontFamily`.                                                      |
| `--pg-font-lore`    | **Crimson Text** 400/400i/600 | Short flavor/description lines, page subtitles, empty-state copy, quotes. Never for UI controls.                                             |

- Mantine `Title` / `h1–h6` use Cinzel 600 automatically (`theme.headings`). Sizes: h1 36px, h2 28px,
  h3 22px, h4 18px. Keep headers reasonable — `PageHeader` caps the page title at 36px.
- Utility classes: `.pg-display` (Cinzel, tracked), `.pg-eyebrow` (11px tracked gold caps label),
  `.pg-lore` (Crimson 17px, ink-2).
- Tracking: display `0.04em`, caps labels `0.14em` (`--pg-tracking-display`, `--pg-tracking-caps`).
- Legacy inline `fontFamily: "Cinzel, Georgia, serif"` / `"Inter, Segoe UI, sans-serif"` still
  work (fonts are now really loaded), but new code should use the variables.

## 2. Color

### Surfaces (low → high elevation)

| Token                  | Value             | Use                                                        |
| ---------------------- | ----------------- | ---------------------------------------------------------- |
| `--pg-abyss`           | `#050404`         | Behind everything                                          |
| `--pg-bg`              | `#110d10`         | App background (Mantine `dark-7` / `--mantine-color-body`) |
| `--pg-surface-1`       | `#171216`         | Panels, Paper, Card (default)                              |
| `--pg-surface-2`       | `#1e181c`         | Raised cards on a panel                                    |
| `--pg-surface-3`       | `#282026`         | Secondary buttons, hover rows, pills                       |
| `--pg-surface-4`       | `#32282f`         | Secondary button hover                                     |
| `--pg-surface-overlay` | 97% `#181317`     | Menus, popovers, selects, tooltips, toasts                 |
| `--pg-surface-glass`   | 74% black         | Top bar / panels over photography (+ `backdrop-filter`)    |
| `--pg-sunken`          | `rgba(0,0,0,.32)` | Inputs, wells, segmented controls                          |
| `--pg-scrim`           | 74% black         | Modal overlay                                              |

The page backdrop (`--pg-backdrop`) is a faint blood glow at the top and violet at the bottom
right, painted on `<html>` with a global film-grain layer. **Pages should not paint their own
opaque full-page background** unless they use photography (landing hero, generator, sheet);
leave `AppShell.Main` transparent (the theme already does).

### Ink

`--pg-ink` (`#f2eae6`, bone) · `--pg-ink-2` (78%, secondary text) · `--pg-ink-3` (58%, muted /
descriptions) · `--pg-ink-4` (38%, placeholders, disabled, decorative) · `--pg-ink-inverse`.
Mantine `c="dimmed"` maps to `dark-2` (`#a3958f`) which sits between ink-2 and ink-3.

### Accents

| Token                              | Value                             | Meaning                                                                               |
| ---------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| `--pg-accent`                      | primary filled                    | **Follows the active Mantine primary** — violet app-wide, the clan color on the sheet |
| `--pg-accent-soft`                 | 16% accent                        | Selected/highlighted rows, keyboard-active options                                    |
| `--pg-accent-bright`               | primary-4                         | Accent text/icons on dark                                                             |
| `--pg-blood` / `-bright` / `-deep` | `#b01e2f` / `#dc3446` / `#6e111c` | Danger, Hunger, the brand drop, ornaments, active nav                                 |
| `--pg-violet` / `-bright`          | `#7e4ac9` / `#9e74df`             | Brand violet (= `grape-7`)                                                            |
| `--pg-gold` / `-dim`               | `#d4af64` / 62%                   | Ornament only: eyebrows, ornate borders, sigils, highlights in search                 |

Semantic: `--pg-success` `#5fae86`, `--pg-warning` `#e0a23f`, `--pg-danger` (= blood-bright),
`--pg-info` `#8aa4e0`. For Mantine components keep using `color="green" | "yellow" | "red" | "blue"`.

Borders: `--pg-border-faint` (6%), `--pg-border` (10%, default hairline), `--pg-border-strong`
(18%, inputs, popovers), `--pg-border-gold` (ornate/modal/tooltip), `--pg-border-blood`,
`--pg-border-accent` (selected cards). Prefer spacing and grouping over drawing borders on
everything.

Selection: `::selection` is the active accent at 45%, so it matches whatever is being selected
(violet in the app, clan color on the sheet).

### Mantine palettes (`theme.ts`)

- `dark` → the warm aubergine-black above (drives body, inputs, default borders, dimmed text).
- `red` → **blood** (`red-7` = `#b01e2f` filled, `red-5` = `#dc3446`).
- `grape` → brand violet (`grape-7` = `#7e4ac9` filled). Primary color of the app.
- `gray` → warm ash (neutral buttons; Nosferatu/Hecata sheet color).
- `gold` → new candlelight scale (`color="gold"` works on Badge/Button/Text/etc.).
- All other Mantine colors (blue, orange, violet, pink, cyan, lime, yellow, teal) are untouched —
  they are the clan colors on the sheet.
- `primaryShade: { dark: 7 }` — filled variants use shade 7 for every color.

## 3. Spacing, radius, shadow, z-index

- Spacing: Mantine `xs 10 / sm 12 / md 16 / lg 20 / xl 32` for props; CSS has a 4px grid
  `--pg-space-1…16` (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Page gutters: `--pg-gutter`
  (`clamp(16px, 4vw, 32px)`). Content width: `--pg-content-max` 1200px.
- Radius (`defaultRadius: "md"`): `xs 2 · sm 4 · md 6 · lg 10 · xl 16`. Slightly sharp on purpose.
  Badges default to `sm` (not pills). Modals use `lg`.
- Shadows: `--pg-shadow-1…4` (Mantine `xs, sm/md, lg, xl` map to them), `--pg-shadow-inset-top`
  (1px top highlight on surfaces), glows `--pg-glow-accent`, `--pg-glow-blood`, `--pg-glow-candle`.
  Glows are for hover/selected/featured states only.
- Z-index: `--pg-z-raised 1 · sticky 10 · header 100 · modal 200 · popover 300 · overlay 400 ·
spotlight 1000 · cookie 2500 · toast 3000` (JS: `zIndex` in `tokens.ts`).
- Floating sheet buttons (menu, session chat) share one bottom row: `--pg-fab-size` 48px,
  `--pg-fab-edge` (1.5rem, 1rem on phones), `--pg-fab-gap` 12px.
- Layout: `--pg-topbar-h` 52px; `--pg-safe-bottom` = `env(safe-area-inset-bottom)` — add it to
  anything fixed to the bottom (FABs, sticky footers). Use `100dvh`, not `100vh`, for full-height
  layouts so mobile browser chrome (Firefox's bottom URL bar) never covers UI.

## 4. Motion

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);    /* things appearing, UI responses */
--ease-in:     cubic-bezier(0.55, 0.055, 0.675, 0.19); /* things leaving */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* sheets/drawers */
--pg-dur-press 120ms · --pg-dur-fast 150ms · --pg-dur-base 200ms · --pg-dur-slow 260ms · --pg-dur-exit 140ms
```

framer-motion can't read CSS vars: use `motion.curve.out` etc. from `~/theme/tokens`.

Rules (already implemented by the theme — follow them in custom code):

- **Press**: every Mantine clickable (`.mantine-active`) scales to `.97` on `:active`
  (`--pg-press-scale`). Custom clickables: `transform: scale(var(--pg-press-scale))` on `:active`.
- **Open/close**: modals scale `.96 → 1` (220ms ease-out) and leave with ease-in (150ms).
  Menus/popovers/selects/hover cards scale from `.95` out of the side touching their target
  (origin-aware via `data-position`). Tooltips scale from `.97`. Never animate from 0.
- **Tooltips skip the delay**: the whole app is wrapped in `<Tooltip.Group openDelay={350}
closeDelay={90}>`; once one tooltip is open, neighbours open instantly (Mantine's equivalent of
  `data-instant`). Tooltips flip/shift to stay in the viewport. Don't set `openDelay` per tooltip.
- **Hover** effects go inside `@media (hover: hover) and (pointer: fine)`.
- Only animate `transform` and `opacity` (plus color/border/box-shadow transitions for state).
  With framer-motion use `animate={{ transform: "translateY(0px)" }}`, not `y`.
- Keep it under 300ms. Prefer CSS transitions over JS.
- **Reduced motion**: `--pg-scale-from-*` and `--pg-press-scale` become `1` (fades stay). In CSS
  remove translate/scale under `@media (prefers-reduced-motion: reduce)`; in framer-motion use
  `useReducedMotion()`. `theme.respectReducedMotion` is intentionally `false` so fades still run.

## 5. Mantine theme overrides (what you get for free)

| Component                                                                                    | Look                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                                                     | Inter 600. `filled` = primary (top highlight + hover glow). `default` = secondary (surface-3 + hairline). `light` = translucent tint + same-hue border. `subtle` = transparent, tinted hover. `outline` = tinted border. Gray `light/subtle/outline` use bone ink. Loading uses the sigil loader. |
| `ActionIcon`, `CloseButton`                                                                  | Same variant system; close buttons are quiet ink-3 → ink.                                                                                                                                                                                                                                         |
| `Paper`, `Card`                                                                              | surface-1, hairline `--pg-border`, inset top highlight; Card radius md.                                                                                                                                                                                                                           |
| `Modal`, `Drawer`                                                                            | Gold hairline, candlelit gradient, Cinzel uppercase centered title, close pinned to the corner, blurred scrim, scale transition. Drawer uses `--ease-drawer`.                                                                                                                                     |
| `Menu`, `Popover`, `HoverCard`, `Combobox`/`Select`/`MultiSelect`/`Autocomplete`/`TagsInput` | Overlay surface with blur + strong hairline, origin-aware scale. Menu labels are gold caps; items tint on hover/focus; `color="red"` items work. Select options tint with the accent and show a left accent bar when keyboard-active; check icon on the right.                                    |
| `Tooltip`                                                                                    | Overlay surface, gold hairline, arrow, 13px. Use `multiline w={…}` for long text (max 320px).                                                                                                                                                                                                     |
| `Input` (all inputs)                                                                         | Sunken bg, strong hairline, hover brightens, focus = border in the input's color + soft 2px ring. All inputs and buttons share heights per `size` (sm = 36px). Labels 13px/600 ink-2. Focus color still follows the input's `color` prop / primary (`theme/inputFocus.ts`).                       |
| `Tabs`                                                                                       | ink-3 tabs, ink active, accent underline.                                                                                                                                                                                                                                                         |
| `Notification`                                                                               | Overlay surface, glowing 3px color bar. Toasts sit bottom-center above the safe area.                                                                                                                                                                                                             |
| `Alert`                                                                                      | Translucent tint, 3px leading border.                                                                                                                                                                                                                                                             |
| `Badge`                                                                                      | radius `sm`, tracked caps.                                                                                                                                                                                                                                                                        |
| `Table`                                                                                      | Hairline rows, tracked caps headers, subtle stripe/hover.                                                                                                                                                                                                                                         |
| `SegmentedControl`, `Switch`, `Checkbox`, `Progress`                                         | Sunken tracks, raised indicator.                                                                                                                                                                                                                                                                  |
| `ScrollArea` + native scrollbars                                                             | Thin bone thumbs that turn accent on hover; no browser-default chrome.                                                                                                                                                                                                                            |
| `Skeleton`                                                                                   | surface-1 → surface-3 pulse.                                                                                                                                                                                                                                                                      |
| `Loader`                                                                                     | Default `type="sigil"` (ring + sweeping arc + pulsing lozenge). `oval/bars/dots` still available.                                                                                                                                                                                                 |
| `AppShell`                                                                                   | Header = glass + gold seam; Navbar/Aside = surface-1; Main transparent.                                                                                                                                                                                                                           |

Focus: a 2px `--pg-focus-ring` (light accent at 60%) outline with **0 offset**, so it hugs the
component's border. Never add dark/thick rings.

Cursor: `cursor: pointer` on buttons, links, tabs, options, menu items, checkboxes
(`theme.cursorType = "pointer"` + global CSS); `not-allowed` on disabled.

**Don't fight the theme**: remove page-level `styles={{ root: { background: … } }}`,
hard-coded hexes (`#100d12`, `rgba(24, 17, 20, .98)`…) and per-component font stacks when you
touch a page — they override the theme and drift from the system.

## 6. Clan theming on the character sheet

`CharacterSheet.tsx` renders a nested `<MantineProvider theme={createTheme({ primaryColor })}>`
where `primaryColor` comes from the user preference or `getPrimaryColor(clan)`. Nested providers
**inherit** `progenyTheme` (components, palettes, fonts) and only swap the primary color. Because
`--pg-accent`, `--pg-accent-soft`, `--pg-border-accent`, `--pg-glow-accent`, the selection color,
focus ring, scrollbar hover, `SectionHeader` lozenge and every `filled/light/subtle` primary
component derive from `--mantine-primary-color-*`, **sheet UI turns clan-colored automatically**.
In sheet code prefer `var(--pg-accent)` / `color={primaryColor}` over hard-coded red.

## 7. Shared components

All from `~/components/ui` unless noted.

### `PageShell` — standard page frame

Sticky glass top bar + transparent main + responsive gutters + bottom safe-area padding.
For account, homebrew, coterie, admin, features and error pages (generator and sheet keep their
own shells).

```tsx
<PageShell size="lg">   {/* Container size; size={false} = full-bleed children */}
    <PageHeader … />
    …
</PageShell>
```

### `PageHeader` — one per page (`<h1>`)

```tsx
<PageHeader
    eyebrow="Homebrew"
    title="Community Library"
    description="Rules, Disciplines and predator types shared by other Storytellers."
    icon={<IconBooks size={30} stroke={1.5} />}
    actions={
        <>
            <Button variant="default">My homebrew</Button>
            <Button>Request to publish</Button>
        </>
    }
    align="start" // or "center"
/>
```

Renders eyebrow → Cinzel title (max 36px) → blood lozenge `Ornament` → Crimson description;
actions wrap below on small screens.

### `SectionHeader` — titles inside a page/panel

```tsx
<SectionHeader
    title="Characters"
    description="Saved to your account"
    actions={<Button size="xs">New</Button>}
/>
```

Accent lozenge + Cinzel caps + fading gold rule. `order={2|3|4}`, `size="lg"`, `rule={false}`.

### `Panel` — themed container (polymorphic `Paper`)

```tsx
<Panel>…</Panel>                                // plain: surface-1 + hairline
<Panel tone="raised" p="lg">…</Panel>           // cards that sit on a plain panel
<Panel tone="inset">…</Panel>                   // sunken wells, read-only values
<Panel tone="glass">…</Panel>                   // over photography
<Panel tone="ornate" grain>…</Panel>            // hero/featured blocks: gilded corners. Sparingly.
<Panel component={Link} to="/coteries/$coterieId" params={{ coterieId }} interactive selected={isCurrent}>…</Panel>
```

`interactive` = hover lift + accent border/glow + press scale. `selected` = accent border + glow.

### `EmptyState`

```tsx
<EmptyState
    icon={<IconUsersGroup size={26} />}
    title="No coteries yet"
    description="Create one and invite your players with a link."
    actions={<Button onClick={create}>Create coterie</Button>}
    compact // inside panels/lists
/>
```

Always give the next step as an action. Copy: short, in-world where natural, no filler.

### Skeletons

`SkeletonLines`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRow`, `SkeletonList`. Match the real
layout (same grid `cols`, similar heights) so nothing reflows when data arrives. Keep showing
cached data while refetching (React Query does this — don't swap to skeletons on refetch).

```tsx
{isLoading ? <SkeletonGrid count={6} cols={{ base: 1, sm: 2, lg: 3 }} cardHeight={168} /> : <Grid … />}
```

### `RouteFallback`

Full-height loader for `Suspense`/page-level loading; fades in after 120ms so fast loads never
flash. All lazy routes except the landing page already use it.

### `Dots`

The one VtM dot rating (●●○○○) for the generator, sidebar, coterie dossiers and modals. Color
comes from `color` or an ancestor's `--dot-color` (blood by default).

```tsx
<Dots filled={3} total={5} />                                  // decorative, accent rings
<Dots filled={n} total={5} emptyTone="quiet" label={`${n} of 5`} /> // neutral rings, announced
<Dots filled={2} size="lg" glow />                             // featured
```

(Sheet pips are interactive and live in `character_sheet/components/Pips.tsx`.)

### `IconButton`, `DeleteIconButton`, `DisabledReason`

```tsx
<IconButton label="Copy invite link" icon={<IconLink size={16} />} onClick={copy} />
<DeleteIconButton label={`Delete ${character.name}`} onClick={() => setPendingDelete(character)} />
<DisabledReason reason={!name.trim() ? "Name your character first" : undefined}>
    <Button disabled={!name.trim()}>Save</Button>
</DisabledReason>
```

- Icon-only buttons always have a tooltip + aria-label (`label` does both).
- Deletes are a quiet trash icon (turns blood on hover), **no text**. The confirmation button
  spells out **"Delete"**. `disabledReason` disables the button and explains why on hover/focus.

### `ConfirmActionModal` (`~/components/ConfirmActionModal`)

Custom confirm dialog for destructive/irreversible actions (never `window.confirm`). Themed
modal, blood lozenge under the title for `confirmColor="red"`, Cancel (ghost) left, confirm right.

```tsx
<ConfirmActionModal
    opened={!!pending}
    onClose={() => setPending(null)}
    onConfirm={remove}
    title="Delete character?"
    body={`“${pending?.name}” will be removed from your account. This can't be undone.`}
    confirmLabel="Delete"
    loading={isDeleting}
/>
```

For actions that are undoable but tedious to undo (archive, move between collections), skip the
dialog and show a notification with an **Undo** button instead.

### `useContextMenu` / `ContextMenu` — right-click menus for list rows

Lists of actionable items (characters, coteries, homebrew items, collections, members…) must
offer their main actions on right-click. One host per list:

```tsx
const contextMenu = useContextMenu()
…
<Panel
    interactive
    onContextMenu={(event) =>
        contextMenu.open(event, [
            { key: "open", label: "Open sheet", icon: <IconNotebook size={14} />, onClick: () => open(c) },
            { key: "copy", label: "Duplicate", icon: <IconCopy size={14} />, onClick: () => duplicate(c) },
            { type: "divider", key: "d" },
            { key: "delete", label: "Delete…", color: "red", icon: <IconTrash size={14} />, onClick: () => askDelete(c) },
        ])
    }
>…</Panel>
{contextMenu.menu}
```

Entries: `{ key, label, icon?, onClick, color?, disabled?, rightSection? }`,
`{ type: "divider", key }`, `{ type: "label", key, label }`. Works with mouse, Android long-press
and Shift+F10. `<ContextMenu items={…}>{child}</ContextMenu>` wraps a single element.

### `QuickNavigator` (`~/components/QuickNavigator`)

Mounted once in `__root.tsx`. ⌘K / Ctrl+K (or the search button in the top bar) opens it with the
input focused. Lists pages, feature-guide sections, and — when signed in — the user's coteries
and homebrew collections (fetched only once it is opened). Open it programmatically with
`quickNavigator.open()`. To add a page or item type, extend the `actions` memo there.

### Other shell pieces

- `AppTopbar` (`~/components/AppTopbar`, re-exported by `~/topbar/Topbar`): sigil + wordmark,
  uppercase nav links with a blood underline for the active route, quick-nav trigger, burger
  for the generator's step list, impersonation band (amber stripes). Height-agnostic; place it in
  an `AppShell.Header` of `52px` (or use `PageShell`).
- `BrandMark` (`~/components/ui`): the lozenge-and-drop sigil.
- `Ornament` (`~/components/ui`): small lozenge rule (`align="center" | "start"`, inherits color).
- `OrnamentalDivider` (`~/components/OrnamentalDivider`): big labelled divider for sheet sections
  (fades toward the edges; `color` prop, `size="large"`, `compact`).
- `NotFoundPage` (`~/components/NotFoundPage`): root `notFoundComponent`.
- `ErrorBoundary`: ornate error panel with source-mapped details (wraps every route).
- `CookiesBanner`: ornate panel, bottom-left (center on phones), safe-area aware.

## 8. Copy & UX rules (from Odin's rulebook)

- No AI-style decorative blurbs, no leaking implementation details ("synced every 2 min").
- Buttons are fully clickable (no text-only hit areas). Keep at least 8px between buttons and
  other elements.
- Disabled buttons explain why (`DisabledReason` / `IconButton disabledReason`).
- Errors that can be fixed automatically or explained further get a button that does it.
- Autofocus the first input when a dialog opens (Mantine `data-autofocus` on the input).
- Multi-step/long actions show progress. Prefer optimistic updates.
- Navigation state (tabs, sub-views) lives in the URL (TanStack Router search params).
- Large lists are virtualized and must scroll fast without blurring items.
- File inputs accept drag-and-drop and paste.
- Don't override browser shortcuts (⌘F, ⌘L…). ⌘K is taken by the quick navigator.
- Avoid pill overuse — Badges are `radius="sm"` tags; use them for real statuses/categories only.

## 9. Page agent checklist

- [ ] Use `PageShell` (or keep the existing generator/sheet shells) — no per-page topbar wrappers,
      no opaque full-page backgrounds unless it's photography.
- [ ] One `PageHeader` per page; `SectionHeader` for sections; `Panel` instead of ad-hoc
      `Paper`/`Box` with inline bg/border.
- [ ] Delete inline `styles`/`style` that set fonts, backgrounds, borders, radii or shadows the
      theme already provides; replace hard-coded colors with `--pg-*` tokens (or `color`/`c` props).
- [ ] Buttons: `filled` primary (one per view), `default` secondary, `subtle color="gray"` ghost,
      `color="red"` destructive, `IconButton`/`DeleteIconButton` for icon-only. All inputs in a
      row share a `size`.
- [ ] Every list of actionable items has a right-click menu (`useContextMenu`) with the same actions
      as its buttons.
- [ ] Destructive, non-recreatable actions → `ConfirmActionModal` (confirm says "Delete");
      undoable-but-hidden actions → toast with Undo.
- [ ] Loading → skeletons that reserve space (`Skeleton*`), errors per section with retry; keep
      cached data visible while refetching.
- [ ] Empty states → `EmptyState` with an action.
- [ ] Hover effects gated by `(hover: hover) and (pointer: fine)`; only transform/opacity animate;
      reduced-motion handled; durations < 300ms with the `--ease-*` curves.
- [ ] Check 1440 / 768 / 390 widths. Fixed bottom UI uses `--pg-safe-bottom`; full-height uses `dvh`.
- [ ] Don't rename test ids / aria-labels / visible strings that tests use (`grep src/test e2e`).
- [ ] Run `pnpm run lint && pnpm exec tsc --noEmit && pnpm exec vite build && pnpm run test:run`
      (not `pnpm run build` — it uploads sourcemaps).
