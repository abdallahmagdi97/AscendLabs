# Design system (Phase 1)

Files: `assets/tokens.css` (scales), `assets/system.css` (primitives, header, footer), `assets/site.css` (legacy components and the official colour tokens, unchanged). Live reference: `/design-system.html` (noindex, unlinked). Pages are assembled by `node scripts/build.mjs` from `src/pages` and `src/partials`; edit `src/`, never the root `.html` files, then run the build (`--check` fails when they drift; it also refreshes `?v=` cache hashes).

## Colour (unchanged, official)
Charcoal #1E1E1C, sand #D8CBB3, electric blue #2F6BFF. Blue is used only for actions, the active nav rule and one emphasised phrase per page. New depth tokens: `--surface-0..3`, `--hairline`, `--hairline-strong`. One light "paper" (sand) section per page via `.on-paper`, which re-scopes text and focus colours.

## Type
Inter (UI and headlines) plus Instrument Serif italic for one phrase per hero (`.serif`). One 1.25 scale, nine fluid steps `--fs-0..8`; classes `.h-display .h-1 .h-2 .h-3 .h-4 .body-lg .body .kicker .num`. These replace the nine ad-hoc headline classes (`t-h1-prod`, `t-h2-sm` ...) as pages are rebuilt. Prices use `.num` (tabular figures).

## Space and layout
4px base: `--sp-1..10` (4 → 144). `.wrap` / `.container` max 1240, `.section` rhythm `--section-y`, `.split` (5/7 asymmetric), `.rows` + `.row-item` (numbered editorial rows instead of three-up card grids), `.stack-3..6`.

## Components
Buttons: `.btn-primary` (blue, charcoal on paper), `.btn-quiet`, `.btn-sm`, `.arr` arrow nudges on hover. Tags: `.tag`, `.tag-live`, `.tag-soon` (dashed = not available yet, used for every Coming-soon item). Header: sticky, solid, hairline, accent rule under the current page. Footer: dark well, contact line (info@ascend-labs.cc), four link columns. One focus ring (2px `--focus`, offset 3px).

## Motion language (implemented in Phase 2)
Easings `--ease-out`, `--ease-inout`; durations 120 / 240 / 480 / 800 ms; stagger 60 ms; parallax cap 24 px. Transform and opacity only, nothing loops, everything gated by `prefers-reduced-motion` and by the `.js` class so the page is complete without scripting.

## Rules
No gradient or glow blobs, no glassmorphism, no repeated three-up card grids, no inline `style` for spacing, no new colours, no invented stats or testimonials, Coming-soon features always carry `.tag-soon`.
