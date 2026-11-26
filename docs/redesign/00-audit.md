# Phase 0: Audit of ascend-labs.cc (baseline `origin/main` 1a66103, 2026-11-26)

Baseline screenshots (desktop 1440 and mobile 390, full page, scrolled through so reveals fire): `docs/redesign/screenshots/before/`.

## 1. Stack
- Static HTML, no framework, no build step, no `package.json`. Vercel serves the files as they are.
- One stylesheet `assets/site.css` (60 KB, 762 lines, hand-written), one script `assets/site.js` (25 KB, plain JS, no dependencies), plus `anora.js/.css` (assistant widget) and `checkout.js/.css`.
- Fonts: Google Fonts (Inter 400-700, Instrument Serif italic), render-blocking `<link>`, not self-hosted.
- Routing: file based (`/pricing.html`); `/checkout` rewrite; `/campaigns.html` redirects to `agent.html#campaigns`. Cache: assets `max-age=3600, must-revalidate`, cache-busting by `?v=hash` query strings written by hand.
- Security headers: strict per-path CSP in `vercel.json`. Marketing CSP allows only `self`, Turnstile, Cloudflare Insights, Google Fonts, and the Railway API. **Any external animation library must be self-hosted** (or the CSP widened, which I will not do without approval).
- Existing motion: a section fade/translate reveal (`.js .reveal`, IntersectionObserver, `prefers-reduced-motion` respected), menu/FAQ transitions. Nothing else. No scroll-driven or hero choreography.

## 2. Brand (answer to the founder's "electric lime")
**The live brand is not lime. It is charcoal + sand + electric blue.** `assets/site.css` header: "Charcoal #1E1E1C, Sand #D8CBB3, Electric Blue #2F6BFF (official, immutable)". The logo mark (`ascend-mark.png`, `favicon.svg`) is blue. No lime or green accent exists on any page (green is only the functional "ok" colour and WhatsApp's own brand green).
Recommendation: keep **electric blue #2F6BFF as the single controlled accent**. Moving to lime would break the logo, favicon, OG image, app UIs and the "official, immutable" rule in the stylesheet. If the founder really wants lime, it is a rebrand and must start from the logo, not the website. Decision needed (see 01-plan.md, question 1).

## 3. Page inventory
| Page | Role | Notes |
|---|---|---|
| index | Home | Hero + "two products" card, product showcase, sand band, 4 steps, picker, CTA, FAQ |
| products | Product hub | Overlaps heavily with home showcase; "Start free" cards |
| crm | CRM hub | Broker vs Developer |
| broker-crm, developer-crm | Product pages | Own layout each |
| agent | Ascend Agent | Includes Campaigns (email); `#campaigns` anchor |
| pricing | Pricing | Tabs: Broker CRM, Agent, Email campaigns, WhatsApp; Founder's Club (live count from API) |
| about, contact | Company | Contact has Turnstile form |
| checkout, sign-in | App flows | **Do not touch** (own CSP, Pixel iframe) |
| privacy, terms, refund, acceptable-use, 404 | Legal / utility | Share the site chrome |
| **project** | **Legacy portfolio page** | See finding P1 |

## 4. Findings
Severity: **H** high, **M** medium, **L** low.

### Design / hierarchy
- **H, no real product imagery anywhere.** Every "screenshot" is a CSS mock labelled "Illustrative UI · sample data". Honest, but it is the single biggest credibility gap for a premium SaaS site. The founder forbids fabrication, so the redesign must either use real screenshots (none exist in the repo: needs the founder to supply or approve captures from the live apps) or keep clearly-labelled illustrative UI at a much higher fidelity.
- **H, home hero is weak.** Headline is good ("Every lead answered. Every deal followed through."), but the right side is an empty-looking "Two products" card with grey placeholder tiles. It is the first thing a visitor sees and communicates nothing about the product.
- **M, the same pattern repeats**: card grids (3-up feature cards on every product page, 4 steps, 3 pick cards, 4 value cells) and a sand CTA band on nearly every page. Hierarchy is flat: most sections are one H2 plus a card grid.
- **M, overlapping pages.** Home showcase, `products.html` and `crm.html` say the same thing three times (CRM for the firm / Agent for the agent).
- **M, mixed headline styles.** Sans plus serif-italic accent word is the brand signature, but is applied to nearly every H2 so it stops being a signature; headline sizes come from 9 separate classes (`t-display`, `t-h1`, `t-h1-xl`, `t-h1-prod`, `t-h1-sm`, `t-h2`, `t-h2-md`, `t-h2-sm`, `t-h3x`) with unrelated clamps.
- **L, the sand band** is the only moment of contrast and is used inconsistently.

### Design system / code
- **M, 37 inline `style=""` attributes on the home page** (17-31 on other pages): ad-hoc spacing and weights outside the token set.
- **M, the whole header, both menus, the mobile menu and the footer (~120 lines) are copy-pasted into 14 HTML files.** Every nav change is a 14-file edit and drift is likely. (A static site has no includes; a tiny build-time include script solves it without a framework. See plan.)
- **L, spacing and radii are partly tokenised** (`--radius-*`, `--section`, `--gutter`) but type, spacing steps, duration and easing are not (one `--ease`, durations hard-coded 0.15-0.4 s).
- **L, colour tokens are good** (WCAG-aware derived tokens `--blue-solid`, `--accent-text`); keep them.

### Interaction / motion
- Reveal-on-scroll is the only scroll behaviour. No hero entrance, no scroll storytelling, no depth. Hover/focus states exist and focus rings are visible (3 px `--focus`): keep.
- Reveal content is hidden until JS runs, gated by `.js` class, so the no-JS page is readable. Good pattern to preserve.

### Accessibility
- Positives: skip link, one `h1` per page, all images have `alt`, `aria-expanded` on menus/FAQ, dialog role on mobile menu, reduced-motion handled, WCAG-checked colour tokens.
- To verify in Phase 6 (not yet measured): keyboard focus trap in the mobile menu, tab order of the Products mega-menu, contrast of `--fg-3` on `--card`.

### SEO / metadata
- Positives: title, meta description, canonical, OG/Twitter, JSON-LD (Organization, FAQPage) on pages checked; sitemap and robots present.
- **M, `project.html`** has no meta description, uses a different nav and `logo.png`, loads 3+ Behance images from external hosts (3 requests 404 locally; likely blocked by the site CSP in production because `img-src` has no Behance origin), and is not in the sitemap or any nav.
- **L, `404.html` has no canonical** (fine); `sitemap.xml` has no `checkout`/legal pages (fine, intentional); `lastmod` all 2026-11-22.
- **L, product naming inconsistency:** `products.html` "Start free" card says "Ascend Campaigns: email campaigns... with WhatsApp and SMS as you grow", while every other page folds Campaigns into Ascend Agent and the nav says "Ascend Agent". Needs a single naming decision (question 2).

### Performance (static measurements; Lighthouse run comes in Phase 5)
- **H, `assets/plug-mockup.png` is 9.8 MB and unreferenced**; also `logo-white.jpeg` 211 KB, `duck-diet.png` 219 KB, `lunavie.webp` 164 KB, `golden-share.png` 116 KB, several unreferenced (portfolio leftovers). They are not served to visitors (nothing links them) but bloat the repo and deploy. Plan: remove after the founder confirms.
- **M, Google Fonts are render-blocking** and cross-origin (two connections). Self-hosting woff2 (Inter variable + Instrument Serif italic) removes the dependency and the CSP font allowance.
- **M, 8-14 `<img>` per page lack `width`/`height`** (menu/mark icons): layout-shift risk.
- **L, 60 KB CSS + 25 KB JS un-minified**, loaded on every page. Acceptable but easy to shrink.
- No horizontal overflow at 390 px or 1440 px on any audited page (measured `scrollWidth == clientWidth`).
- Console errors seen locally are only CORS failures against the production API from `localhost` (`/api/anora/public/status`, `/api/billing/founders-club`); expected off-origin, not site bugs.

### Mobile
- Long pages (home 8,482 px tall at 390). Sections stack as single columns; cards are fine but monotonous. Sticky mobile CTA exists (`.mobile-sticky`).

## 5. Things that must keep working (constraints verified in the repo)
- Anora: `<link href=assets/anora.css>` + `<script src=assets/anora.js defer>` on marketing pages (not checkout, sign-in, legal).
- Contact form: Turnstile (`challenges.cloudflare.com` in `script-src`, `frame-src`).
- Optional Cloudflare Web Analytics beacon in `site.js` (token off).
- Pricing tabs, Founder's Club live count, "Buy now" links, billing period toggle, `#crm` / `#agent` deep links in `site.js`.
- Checkout: untouched. `checkout.css/js` and `checkout.html` stay as is.
- `vercel.json` CSP: no new external origins.

## 6. Availability facts used in the redesign (from `pricing.html` and product pages)
- Broker CRM: Starter $19, Growth $49, Business $99 per month, per firm; users 3 / 10 / 25; Custom above 25. Developer CRM: pricing on request.
- Ascend Agent: $19/month per agent ($190/year); follow-ups and email campaigns available; **Bookings, follow-up templates/sequences: Coming soon.**
- Email campaigns: Starter $19, Growth $49, Business $99 (5k / 25k / 50k emails); Founder's Club Growth at $39 for 12 months, 100 places.
- WhatsApp: Essentials $29, Growth $59, Business $99; Meta fees extra; on sale on the pricing page. **Availability of WhatsApp Campaigns as a live product is not stated on any product page and the backend plan doc is dated as plan only: needs the founder to confirm (question 3).**
- Coming soon (must not look available): Facebook/Instagram lead ads, automatic reassignment, WhatsApp click-to-chat in CRM, Projects/units/payment plans, mobile apps, Arabic, Bookings.
- Yearly = 2 months free. Free trial 14 days, no card.
