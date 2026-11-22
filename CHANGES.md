# Changes: one founding offer, the Founder's Club

Branch `feature/founders-club` (growth programme G-02, backend `docs/growth`). The founder chose the backend's Founder's Club as the only founding offer: Ascend Campaigns Email Growth at $39 a month instead of $49 for the first 12 months, 100 places, one per organisation, monthly billing.
- **Removed:** the "50% off your first year on yearly plans, for the first 50 firms and the first 200 agents, until 31 March 2027" notes on the CRM and Agent tabs, which no backend promotion supports.
- **Email tab:** the note and the Email Growth bullet describe the Founder's Club exactly as the backend sells it, without the vague "first 100 eligible customers".
- **FAQ** (page and JSON-LD): "What is the Founder's Club?" replaces the 50% answer.
- **Places left:** reads `/api/billing/founders-club`. It shows "N of 100", "none, the club is full", or "while places last" when the server has no club yet. Before, it stayed stuck on "checking" when the server said "not available". `site.js?v=` bumped on every page.
- **Not changed:** the DRAFT COPY Email/WhatsApp prices, still waiting on the founder's approval.

# Changes: "Start free" paths to the open sign-ups

Branch `feature/start-free` (growth programme G-01, backend `docs/growth`). CRM and Campaigns sign-up were open in production, but the site only offered "Book a demo" and said sign-up opens in January.
- **Header** on every page: "Start free" (primary, to `products.html#start`) and "Book a demo" (secondary). The narrow-screen header button and the mobile menu lead with "Start free".
- **`products.html#start`:** a new "Start free" section with Broker CRM (`app.ascend-labs.cc/signup?model=broker`), Developer CRM (`?model=developer`) and Campaigns (`campaigns.ascend-labs.cc/signup`).
- **Product pages:**
  - Broker CRM and Developer CRM: hero and closing band start with "Start free".
  - Agent: "Try Campaigns free", since Campaigns is the live part of the bundle.
  - CRM chooser cards: a "Start free" link on each.
- **Removed claims that were no longer true:** "Self-serve sign-up opens in January" and "Card payments open with self-serve sign-up".
- **Attribution:** sign-up links (`a[data-signup]`) carry the visitor's first-touch `utm_source/medium/campaign` from `sessionStorage`, so the apps record where sign-ups came from.
- **Not changed (waiting on the founder):**
  - the founding-offer wording, which conflicts with the backend;
  - the DRAFT COPY email/WhatsApp prices;
  - the "14-day free trial, no card" claim, which depends on whether production runs the trial.

# Changes: the real Ascend logo, A-arrow in Electric Blue

Branch `feature/ascend-logo`. The founder asked for the real logo everywhere, with the A-arrow in Electric Blue #2F6BFF, consistent across products.
- **Header, mobile menu and home "suite" card:** `assets/ascend-logo-dark.png`, the blue A with Sand lettering. It replaces the Sand wordmark, and the 404 page's blue one.
- **Footer:** `assets/ascend-mark.png`, the blue A, no longer on a Sand tile.
- **Product tiles:** the letter placeholders (C, B, D, A) are now the blue A with a small product label: CRM, Broker, Developer or Agent (`.pi.pi-brand`). The illustrative app mock-up shows the blue A too.
- **Icons:** `favicon.ico`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` and `icon-192`/`icon-512` (manifest), all with the blue A. The touch and app icons sit on Charcoal.
- **JSON-LD logo:** `assets/ascend-logo-light.png`, the blue A with Charcoal lettering.
- **Old files** (`logo-wordmark*.png`, `logo-mark.png`) are no longer referenced; only the unlinked `project.html` uses `logo.png`. New file names, plus new `?v=` hashes, mean the immutable asset cache cannot keep showing the old artwork.
- **Not changed:** `og-image.png` (the social share image). It needs a redesign with the new logo.

# Changes: Ascend Broker CRM and Ascend Developer CRM

Branch `feature/crm-business-models`. Source: the founder's Broker/Developer CRM PRD of 22 Nov and ADR-003 in the backend's `docs/crm-business-models` (one app host, two product pages).

## What changed

**Content and structure**
- `crm.html` is now the chooser ("Two CRMs. One platform."), with links to both product pages. Its URL is kept, so old links keep working.
- `broker-crm.html`: new. It carries the brokerage content that was on `crm.html`.
- `developer-crm.html`: new.
  - "Available today" lists the shared modules that work now: leads and buyers, assignment, first-response tracking, meetings and site visits, roles, HR.
  - "Coming next" covers projects, units, pricing and payment plans, reservations, contracts, broker network and dashboard. Each carries the "Coming soon" badge.
  - Pricing is on request.
- The Products menu (desktop and mobile) has three cards: Broker CRM (B), Developer CRM (D) and Agent. The footer lists both CRMs. The Sign-in menu and `sign-in.html` read "Ascend CRM — Broker & Developer". Both CRMs open at `app.ascend-labs.cc`, which shows the right product from the account.
- The wording "brokerages and developer sales teams" is replaced everywhere (meta, JSON-LD, copy).
- Pricing:
  - The CRM tab is "Broker CRM" and its plans are unchanged.
  - A note says Developer CRM is priced on request.
  - The "Projects, units & payment plans" row is removed from the Broker comparison.
- Contact form:
  - Product options are Broker CRM, Developer CRM, Agent, "More than one" and "Not sure yet".
  - Old links map as follows: `?product=crm` to Broker CRM; `campaigns`, `email` and `whatsapp` to Agent. The last two were a bug, since they preselected nothing.
  - The backend accepts `broker-crm` and `developer-crm` from the same release.

**Technical**
- `.menu-grid` has three columns, so `site.css` and `site.js` have new `?v=` hashes on every page.
- `sitemap.xml` lists the two new pages, and every `lastmod` is 2026-11-22. `site.webmanifest` describes both CRMs.

**Content I need from the founder**
- Developer CRM pricing, once decided.
- When each Developer CRM module ships, so its "Coming soon" badge can come off.

# Changes: Ascend CRM + Ascend Agent site rewrite

Branch `feature/crm-agent-split`. Source of truth for copy: the founder brief of 2 Nov. Where the brief and the product disagreed, the project owner's decisions below won.

## What changed

**Content and structure**
- `index.html`, `crm.html`, `pricing.html`, `products.html`, `about.html`, `contact.html`: rewritten or edited to the brief (two offers: Ascend CRM for firms, Ascend Agent for agents).
- `agent.html`: new. Follow-ups, Bookings (Coming soon) and Campaigns blocks, with the email mock-up in the `#campaigns` block.
- `campaigns.html`: removed. `vercel.json` sends `/campaigns.html` to `/agent.html#campaigns` with a permanent (308) redirect.
- `terms.html`, `privacy.html`, `refund.html`, `acceptable-use.html`: new preview-only placeholders (noindex, "Preview Draft — Not Legally Binding" notice, `<article class="legal-content" data-legal-status="preview">`). No "you agree" wording anywhere, no consent checkbox linking to them.
- `sign-in.html`: copy updated to Ascend CRM / Ascend Agent (+ Follow-ups, Bookings). Now `noindex` (utility page).
- Header (Products and Sign in menus, mobile menu) and footer are identical on every page.
- "Coming" items carry the existing grey "Coming soon" badge. Product icons are the letters C and A. No store badges, no social proof, no bundles, no scheduler, no Arabic.

**Deviations from the brief (project-owner decisions)**
- Agent reporting reads "Delivery, bounce & unsubscribe reports" (the product does not track opens or clicks). Brief said "engagement" / "see who opened".
- "never a separate bill" dropped: "More tools are on the way. They join Ascend CRM or Ascend Agent."
- Each priced plan shows "Billed by invoice until online checkout opens." Plan user limits (3 / 10 / 25) are in the copy as written but the product does not enforce them yet.
- Founding offer and "self-serve opens in January" kept as written.

**Technical**
- Contact form posts JSON to the Railway API (`/api/public/contact`) with name, email, company, role, product, intent, message, marketingOptIn, website (honeypot), page and any UTM / gclid / fbclid captured in `sessionStorage`. 202 = success, 400 = field error, 429 = rate-limit message, 503 and network errors = `mailto:` fallback. Submit is disabled while sending; status is announced through an `aria-live` region. `method="post"` with a `mailto:` action, so personal data never goes into a URL if JavaScript fails. `?product=` and `?intent=` preselect.
- Reveal bug fixed (see below). `assets/pricing.js` deleted: both pricing panels are static HTML and `site.js` only toggles tabs and the monthly/yearly period.
- `vercel.json`: HSTS, nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy, a Content-Security-Policy, immutable caching for `/assets/*`, the campaigns redirect. No host redirect and no `cleanUrls`.
- Assets are referenced with `?v=<hash>` so immutable caching is safe. HTML keeps Vercel's default revalidation.
- `404.html` (root-relative links), `robots.txt`, `sitemap.xml` (www URLs, legal pages left out while noindex), `favicon.ico`, SVG / 32 px / apple-touch icons, `site.webmanifest`, 1200x630 `assets/og-image.png`.
- Per-page title, description, canonical and `og:*` / `twitter:*` (summary_large_image). JSON-LD: Organization (home and others), SoftwareApplication (crm, agent), FAQPage (home, pricing, agent), BreadcrumbList (crm, agent).
- Accessibility: focus ring now 3:1 against white, visible on dark surfaces; skip link works on every page (`main` is focusable); real `<table>` for the plan comparison; ARIA tabs with arrow / Home / End on pricing; FAQ as buttons with `aria-expanded`; dropdowns close on Escape and when focus leaves; 44 px tap targets on touch widths; no-JS fallbacks.
- "How it works": 4 columns wide, 2x2 tablet, stacked on phones.

## The reveal bug (verified first, then fixed)
Before: opening the old homepage and jumping to the bottom (`scrollTo` / anchor / restored scroll) left the 5 sections above the viewport at `opacity: 0`, because the observer only revealed elements that intersected. After: content is visible by default; only `.js .reveal` hides, sections above or near the viewport are revealed, a scroll sweep catches fast scrolls, `prefers-reduced-motion`, print and no-JS show everything, and a 1.5 s safety net reveals all if the observer never reports. Same jump now leaves 0 hidden sections.

## Housekeeping notes
- The Node page generator used to produce the shared header/footer is not committed; the repo stays plain static HTML.
- `project.html` (legacy, unlinked, loads a CDN stylesheet) is untouched. The new CSP will block its external stylesheet; consider deleting it.
- Large unused images in `assets/` (for example `plug-mockup.png`, 9.8 MB) are untouched.

## Content I need from the founder
1. Final legal text for Terms, Privacy, Refund and Acceptable Use (blocks checkout and the public launch). The pages are placeholders and are not in the sitemap.
2. Confirmation that the Agent plan limits (1,000 emails, 20 campaigns, 10,000 contacts a month) match what the product enforces.
3. Decision on enforcing the CRM user limits (3 / 10 / 25) before "Up to N users" is sold as a limit.
4. One Agent sign-in URL once one-sign-in across Ascend Agent ships (January). Today "Open app" goes to the Campaigns app.
5. Approval of the social-sharing image and tagline, and a real product screenshot or two to replace the "Illustrative UI" mock-ups when ready.
6. Store-badge links when the apps are live; the Arabic site brief (Phase 5).
7. Confirmation of the claims "30-minute walkthrough", "we usually reply within 24 hours" and "Built in Egypt for property teams in Egypt and the Gulf".
8. How the founding offer is invoiced until Polar discounts exist, so the wording on the demo call matches.
