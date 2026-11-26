# Redesign plan: "Ascend, precision in motion"

Branch `feature/site-redesign`, worktree `C:/w/site-redesign`, off `origin/main` 1a66103. Nothing is pushed or deployed. Findings behind this plan: `00-audit.md`.

## Decisions I need from the founder before Phase 1 (defaults in bold)
1. **Accent colour.** The live brand is electric blue #2F6BFF, not lime (audit section 2). **Keep blue as the single accent**, sharpened with a more restrained use. Lime would mean a rebrand of logo, favicon, OG image and apps.
2. **Product naming.** Site nav says Ascend CRM (Broker, Developer) + Ascend Agent; one page says "Ascend Campaigns". **Landing pages: Ascend Broker CRM, Ascend Developer CRM, Ascend Agent (follow-ups + Campaigns), plus "Ascend Campaigns" as a section and sub-page inside Agent for email, and WhatsApp the same way.** Tell me if you want separate top-level product pages instead.
3. **Is WhatsApp Campaigns live today?** Pricing sells it, product pages don't mention it, backend doc is dated "plan only". **Default: it gets a page only after you confirm it is live; until then it appears as a priced add-on on the pricing page exactly as now, not as a headline product.**
4. **Real product screenshots.** None exist in the repo (the current "screenshots" are CSS mocks). **Default: I build a high-fidelity, clearly labelled "sample data" UI from the real feature set; if you give me (or approve me capturing, with sample data only) real screenshots of the live apps, I swap them in.** I will not capture from production data.
5. **Trust section.** There are no customer logos, quotes or numbers in the repo, so **the trust section will contain only verifiable facts** (built in Egypt, consent and unsubscribe handling, data ownership statements already on the site, security headers/Turnstile not claimed as certifications). No testimonials or stats unless you provide real ones.
6. **Delete `project.html`** (legacy portfolio, off-brand, not linked) and unreferenced portfolio images including the 9.8 MB `plug-mockup.png`? **Default: yes for `project.html` and unreferenced images; I list them in the commit for your review.** If it is a live portfolio you want, I will restyle it instead.

## Recommended architecture (smallest effective)
- **Stay static, no framework.** The pages are content, not an app; a framework adds JS weight and hurts Lighthouse and the CSP.
- **Add one dev-only build script** (`scripts/build.mjs`, Node, zero runtime deps) that assembles pages from `src/` partials (`header`, `footer`, `head`) into the root files Vercel already serves. It fixes the 14-way copy-paste of header/footer and computes the `?v=` hashes. Output stays plain HTML in the repo root, so Vercel config does not change. (If you would rather not have any build step, the fallback is a `check-chrome` script that fails when pages drift.)
- **Dev dependencies only** (`package.json` devDependencies): `@playwright/test` for Phase 6. Nothing ships to visitors from npm.
- **Motion: no heavy library.** Evaluation against this stack:
  | Option | Size (min+gz) | Verdict |
  |---|---|---|
  | CSS scroll-driven animations (`animation-timeline: view()/scroll()`) + `@starting-style` | 0 KB | **Primary.** Runs on the compositor, native scroll, works in current Chrome/Edge/Safari 26; fallback = static final state |
  | IntersectionObserver + CSS variables (already used) | 0 KB | **Fallback** for browsers without scroll timelines (Firefox, older Safari); also drives the hero entrance |
  | GSAP + ScrollTrigger | ~28 KB (free licence, self-hosted) | Only if pinned multi-step storytelling cannot be done in CSS. Held in reserve; would need self-hosting because of the CSP |
  | Lenis smooth scroll | ~4 KB | **Rejected**: hijacks native scrolling, conflicts with the "native mobile scrolling" requirement and with Anora/Turnstile focus |
  | Motion (framer) / Rive | 18 KB / 150 KB+ runtime | **Rejected**: React-oriented / large for no gain on static pages |
  Everything gated by `prefers-reduced-motion` and by `.js` so the page is complete without scripting.
- **CSP:** no new origins. Self-host fonts (removes Google Fonts from `style-src`/`font-src` later, optional).
- **Checkout, sign-in, Anora, Turnstile, pricing logic:** files and behaviours untouched; only visual tokens may be shared by `site.css`, and I will re-test pricing tabs, Founder's Club, contact form and the Anora mount.

## Creative direction (summary; full system is Phase 1 output `02-design-system.md`)
- **Concept: precision.** Instrument-panel discipline: hairline grids, tabular figures, exact alignment, one accent used only where something is actionable or active. Product first, copy short.
- **Surfaces:** near-black ramp (#141413 → #1E1E1C → #262623), sand (#D8CBB3) for text and a single light "paper" section per page for rhythm, blue only for actions, active states and one hero highlight. No gradient blobs, no glow, no glassmorphism.
- **Type:** Inter (self-hosted variable) for UI, Instrument Serif italic only for one emphasised phrase per page hero. One modular scale (1.250) with 9 steps replacing the 9 headline classes. Tabular numerals for pricing.
- **Layout vocabulary** (replacing repeated 3-card grids): split product stage with sticky copy, numbered editorial rows, a "workflow rail" (lead → assign → follow up → close) that advances on scroll, comparison table, full-bleed product frame with perspective tilt, asymmetric 12-column compositions.
- **Spacing:** 4 px base, scale 4/8/12/16/24/32/48/64/96/144; section rhythm tokens; container 1240.
- **Motion language:** two easings (`--ease-out` cubic-bezier(.2,0,0,1), `--ease-inout` (.65,0,.35,1)), durations 120/240/480/800 ms, stagger 60 ms; movement is translate/opacity/clip only (GPU friendly), parallax capped at 24 px, nothing loops.

## Phases (each ends with a commit; build and Playwright green before the next)
| # | Output | Gate |
|---|---|---|
| 0 | This audit + plan + baseline screenshots (done) | **Founder review of this document** |
| 1 | `02-design-system.md`, new `assets/tokens.css`, type/spacing/motion tokens, buttons/nav/footer/section primitives, a `/design-system` page (not in nav, `noindex`) | Primitives render, no regressions on existing pages |
| 2 | `assets/motion.css` (+ small `motion.js` fallback), hero entrance, scroll-driven storytelling primitives, tilt/depth frame, reduced-motion path | No-JS page complete; reduced-motion shows final state; no CLS |
| 3 | New home | All claims checked against pricing.html and "Coming soon" list |
| 4 | Product pages on one template: Broker CRM, Developer CRM, Agent (+ Campaigns, WhatsApp subject to question 3), crm.html hub, products.html | Coming-soon items visibly badged; prices match pricing.html |
| 5 | Mobile, fonts self-host, image optimisation, Lighthouse | Target Performance 90+ mobile, A11y/SEO/Best-practices ≥ 95 |
| 6 | Playwright suite: nav/CTA, overflow, reduced motion, JS errors, screenshot regression; before/after PNGs | All green; before/after saved to `docs/redesign/screenshots/` |
| 7 | Cross-page review, final report; **preview deploy only after your explicit approval to push** | Report lists what could not be verified |

## Risks and not-verifiable items (known now)
- Real device GPU/scroll feel and Safari/Firefox rendering can only be approximated with Playwright's Chromium (WebKit/Firefox engines can be added if their browsers are installed).
- The live API (Founder's Club count, Anora status) is CORS-blocked from localhost, so those parts are tested with mocks.
- Lighthouse lab scores on localhost are indicative only; the final number must be measured on the preview URL.
