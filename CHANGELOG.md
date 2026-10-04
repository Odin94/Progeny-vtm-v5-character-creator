# Changelog

## Unreleased

- Open the dice roller without rerendering the whole sheet, and prepare WebGL in idle time after the controls paint. Keep sorting manual after rerolls, and allow Sort dice to finish and arrange an active roll immediately.
- Highlight dice selected for rerolls with a red glow. The dice context menu can sort results into an upright, readable grid, remove all dice, or reroll the selection for one willpower.
- Show outcome captions on 3D dice, use Default/Crystal style names, swap Crystal die colors while preserving their symbols, and allow desktop dice above the roller controls.
- Fill the mobile description editor’s available height and keep its controls above the safe area, removing unused space at the bottom.
- Add subtle undo and redo controls for recent description edits, grouping nearby keystrokes and keeping history when the description modal closes.
- Show a compact description and appearance preview below Predator Type in the sheet’s top grid, with a mobile-friendly modal to read and edit the full text.
- Add opt-in 3D vampire dice with adjustable throws, landed-face results and willpower rerolls, while keeping the standard roller for users outside the feature flag.
- Stop the Merits and Flaws creator step from repeatedly saving unchanged selections and freezing the page.
- Give the recovered-draft dialog more room and pad its title and content for readability.
- Apply shared modal spacing correctly on mobile and avoid analytics initialization errors when analytics is not configured.
- Prevent stale character saves from overwriting newer cloud changes and resume autosaving restored offline drafts.
- Repair live character connections with authenticated, validated and revision-protected updates.
- Preserve Unicode text across all JSON import flows.
- Keep delayed edits attached to their original character and offer downloads for interrupted or conflicting drafts from the sheet menu.
