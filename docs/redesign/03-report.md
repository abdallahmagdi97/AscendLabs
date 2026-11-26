# Redesign report (branch `feature/site-redesign`, nothing pushed or deployed)

Worktree `C:/w/site-redesign`, off `origin/main` 1a66103. Commits: phase 0 audit/plan, 1 design system + build, 2 motion, 3 home, 4 product pages, 5 performance, 6 tests and screenshots.

## What changed
- **Build:** `node scripts/build.mjs` assembles pages from `src/` (shared header/footer partials, automatic `?v=` hashes); `--check` fails on drift. Root `.html` files are still what Vercel serves; no framework, no runtime dependency, `vercel.json` untouched.
- **Design system:** `assets/tokens.css`, `system.css`, `motion.css`, `pages.css`, `motion.js` (~9 KB total). Reference page `/design-system.html` (noindex). Rules in `02-design-system.md`.
- **Brand:** kept the real brand, charcoal / sand / electric blue (the live brand is not lime).
- **Home:** hero with the product stage visible above the fold, suite intro, sticky scroll-driven workflow story, Campaigns section (the page's one sand section), a facts-only trust section, find-your-fit rows, CTA, existing FAQ.
- **Product pages:** Broker CRM, Developer CRM, CRM hub, Agent (with Campaigns), Products hub on one template. Every Coming-soon item carries a dashed chip. The Products hub no longer says "WhatsApp and SMS as you grow".
- **Motion:** CSS scroll-driven animation first (0 KB library), small observer fallback, no GSAP/Lenis/Motion/Rive. Entrance stagger, hero settle, scroll tilt on product frames, bounded parallax, sticky story. Opacity is never animated on scroll, so text keeps full contrast. Reduced motion and no-JS show the final, complete page.
- **Removed (per approved default):** `project.html` (legacy portfolio) and nine unreferenced portfolio images including the 9.8 MB `plug-mockup.png`. Brand logo files kept.
- **Untouched:** `checkout.*`, `sign-in.html`, `vercel.json`, Anora files and mount, Turnstile contact form, pricing logic and content. Pricing, About, Contact and the legal pages keep their legacy page layouts and only gain the new header, footer, tokens and focus ring.

## Evidence
- Playwright suite (`npm test`, Chromium): 104 passed, 2 skipped (viewport-specific). Covers overflow at 390 and 1440 on 14 pages, JS errors, SEO tags, Anora mount, dead internal links, nav/CTA clicks, mobile menu, reduced motion, no-JS, story advance, Coming-soon chips, prices cross-checked against `pricing.html`, CSP compatibility (no external origins added, no inline scripts), checkout files unmodified, screenshot baselines (10).
- Lighthouse mobile lab on localhost: Performance 91-98, Accessibility 100, SEO 100, Best Practices 96, CLS 0 (pricing 0.116 locally because the Founder's Club API call is blocked from localhost).
- Screenshots: `docs/redesign/screenshots/before` (baseline, 24) and `after` (22), desktop and mobile.

## Could not be verified
- Safari and Firefox rendering and real-device scroll/GPU feel (Chromium only here). CSS scroll timelines fall back to a one-time observer reveal in browsers without support; that path is coded but only tested via the unsupported-feature branch logic, not in a real Firefox.
- Production numbers: Lighthouse was run on a local server without CDN compression; measure on the preview URL.
- Live API behaviour (Founder's Club count, Anora status, Turnstile) is cross-origin from localhost; those paths were not exercised end to end.
- Real product screenshots: none exist, so the stage uses the existing CSS sample-data UI, labelled illustrative everywhere.
- Fonts are still Google Fonts (render-blocking). Self-hosting needs downloading the font files, which I did not do without approval.

## Open decisions for the founder
1. WhatsApp Campaigns: still only a priced add-on on the pricing page. Say if it is live and should get a product page.
2. Real screenshots: supply or approve sample-data captures to replace the CSS mock UI.
3. Approve self-hosting Inter and Instrument Serif (removes the Google Fonts dependency).
4. Restyle Pricing, About, Contact and legal pages onto the new layout system? (Pricing carries billing logic, so I would do it as a separate, carefully tested step.)
5. Approval to push the branch and create a **preview** deployment. Nothing has been pushed.
