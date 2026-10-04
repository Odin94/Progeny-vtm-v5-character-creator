# Vampire 3D dice experiment

The character sheet supports an opt-in 3D roller controlled by the boolean
PostHog feature flag `vampire-3d-dice`. Create that flag with no general rollout
and target specific signed-in users by their person `email` or distinct ID
(the WorkOS user ID). Anonymous users, users outside the targeting rules, and
browsers without a fresh enabled flag keep the existing roller. Disabling the
flag restores the standard roller and clears any active experiment roll.

For local testing, the Vite development server forces the flag on at `localhost`,
`127.0.0.1`, and IPv6 loopback. This preview requires neither login nor PostHog
configuration. Production builds and non-loopback hosts still use the normal
per-user flag checks.

The flag gates the page dice, style/throw controls, and keyboard shortcuts.
Three.js, Rapier/WASM, the crystal refraction pass, and the models load lazily
only for the experimental roller. No backend or character-schema change is
needed. The existing custom/selected pools, bonuses, success/critical indicators,
roll analytics, and session-chat result sharing remain in use.

- **Quick roll:** press `R`, type `4`, then `Enter`. The count is the total
  pool: at hunger 1, this rolls three regular dice and one hunger die.
  `4d10` and `4 d 10` also work; other dice types do not. Quick-roll counts
  accept 1–100 dice. `Escape` cancels. Shortcuts ignore text entry, composing
  input, modifier chords, open dialogs, and an already rolling pool.
- **Models:** VtM uses black regular and red hunger dice; Crystal VtM uses
  ruby regular and violet hunger dice. Style and throw settings persist locally.
- **Throw controls:** intensity, drop height, direction, spread, and horizontal
  start position. The default is the kit's weighty diagonal throw from the right.
- **Results:** read the actual landed face after physics settles, then feed
  its 1–10 value to Progeny's existing result logic. No separate random result
  is assigned to a displayed 3D die.
- **Willpower:** select up to three regular dice and use the existing reroll
  button. Hunger dice cannot be selected. One superficial willpower damage is
  charged, and unselected bodies/results stay fixed. Chat updates keep the
  original roll ID and mark the update as a reroll.
- **Mobile:** the smaller dice arena sits above the controls, with smaller
  dice and additional scaling for dense pools. The viewport and control bounds
  determine the physics arena, preventing dice from landing behind controls.
- **Recovery:** clipped dice move to visible vacant positions. Cocked dice
  level their leading face in place. Both corrections preserve the leading
  value, leaving clear, visible neighbours untouched. Reduced-motion rolls
  settle immediately. WebGL/model failures resolve pending dice through the
  standard roller and show a fallback notification.

The four GLBs in `frontend/public/dice/vampire/`, symbol/hull metadata, page
physics, and refraction pass were imported from the Dice Atelier experiment
at `/Users/odin/.t3/worktrees/blender-mcp-experiments/t3code-736a816a/outputs/dice-kit`.
The React lifecycle, page-arena renderer, controls, flag gating, and Progeny
roll/reroll integration are maintained here. The engine versions match that
kit: Three.js `0.186.0` and Rapier compat `0.20.0`.

Regression tests are `vampireDiceFeatureFlag.test.tsx`,
`vampireDiceRoll.test.tsx`, and `vampireDicePhysics.test.ts`. They cover identity
gating, shortcuts, hunger substitution, landed values, willpower/fallback,
StrictMode, small-screen/high-intensity recovery, and preserving held dice.
