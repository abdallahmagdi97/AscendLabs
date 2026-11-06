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
