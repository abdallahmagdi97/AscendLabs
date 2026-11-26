import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const MARKETING = ['index', 'products', 'pricing', 'about', 'contact', 'crm', 'broker-crm', 'developer-crm', 'agent', 'whatsapp-campaigns'];
const OTHER = ['privacy', 'terms', 'refund', 'acceptable-use', '404'];
const ALL = [...MARKETING, ...OTHER];
// The live API is cross-origin from localhost, so its calls fail here; those are not site errors.
const NETWORK_NOISE = /railway\.app|CORS|ERR_FAILED|ERR_CONNECTION|status of 4\d\d|Turnstile|challenges\.cloudflare/i;

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !NETWORK_NOISE.test(m.text())) errors.push(m.text()); });
  return errors;
}

for (const name of ALL) {
  test(`${name}: no horizontal overflow, no JS errors`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/${name}.html`);
    await page.waitForLoadState('load');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

for (const name of ALL.filter((n) => n !== '404')) {
  test(`${name}: SEO basics`, async ({ page }) => {
    await page.goto(`/${name}.html`);
    expect(await page.title()).toMatch(/\S/);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

for (const name of MARKETING) {
  test(`${name}: Anora widget mount kept`, async ({ page }) => {
    await page.goto(`/${name}.html`);
    await expect(page.locator('link[href*="assets/anora.css"]')).toHaveCount(1);
    await expect(page.locator('script[src*="assets/anora.js"]')).toHaveCount(1);
  });
}

test('internal links resolve (no dead pages)', async ({ page, request }) => {
  const seen = new Set();
  for (const name of ALL) {
    await page.goto(`/${name}.html`);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const h of hrefs) {
      if (/^(https?:|mailto:|tel:|#)/.test(h)) continue;
      seen.add(h.split('#')[0].split('?')[0].replace(/^\//, '') || 'index.html');
    }
  }
  for (const target of seen) {
    const res = await request.get(`/${target}`);
    expect(res.status(), `/${target}`).toBe(200);
  }
});

test('desktop nav and primary CTAs navigate', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop navigation');
  await page.goto('/index.html');
  await page.getByRole('link', { name: 'Pricing', exact: true }).first().click();
  await expect(page).toHaveURL(/pricing\.html/);
  await page.goto('/index.html');
  await page.locator('.hero2').getByRole('link', { name: /Book a demo/ }).click();
  await expect(page).toHaveURL(/contact\.html/);
  await page.goto('/index.html');
  await page.getByRole('button', { name: /^Products/ }).click();
  await expect(page.locator('#menu-products')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('mobile menu opens and closes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile navigation');
  await page.goto('/index.html');
  const toggle = page.locator('[data-mobile-toggle]');
  await toggle.click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.locator('[data-mobile-close]').click();
  await expect(page.locator('#mobile-menu')).toBeHidden();
});

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });
  test('entrance elements are fully visible and static', async ({ page }) => {
    await page.goto('/index.html');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const o = await page.evaluate(() => [...document.querySelectorAll('[data-rise]')].map((e) => getComputedStyle(e).opacity + '|' + getComputedStyle(e).animationName));
    expect(o.length).toBeGreaterThan(0);
    for (const v of o) expect(v).toBe('1|none');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const name of ['index', 'broker-crm', 'agent']) {
    test(`${name}: content is visible and readable`, async ({ page }) => {
      await page.goto(`/${name}.html`);
      await expect(page.locator('h1')).toBeVisible();
      const hidden = await page.evaluate(() => [...document.querySelectorAll('main h2, main h3')].filter((e) => e.closest('[hidden]') === null && getComputedStyle(e).visibility === 'hidden').length);
      expect(hidden).toBe(0);
      const faded = await page.evaluate(() => [...document.querySelectorAll('main [data-rise], main [data-scroll]')].filter((e) => Number(getComputedStyle(e).opacity) < 1).length);
      expect(faded).toBe(0);
    });
  }
});

test('sticky story advances while scrolling (motion allowed)', async ({ page }) => {
  await page.goto('/index.html');
  const story = page.locator('.story');
  await story.scrollIntoViewIfNeeded();
  const steps = page.locator('.story [data-step]');
  const last = (await steps.count()) - 1;
  await steps.nth(last).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(story).toHaveAttribute('data-active', String(last));
});

test('Coming-soon items are marked on every product page', async ({ page }) => {
  const rowChip = async (url, text) => {
    await page.goto(url);
    const row = page.locator('.row-item', { hasText: text }).first();
    await expect(row.locator('.chip-soon'), `${url} ${text}`).toHaveCount(1);
  };
  await rowChip('/broker-crm.html', 'WhatsApp click-to-chat');
  await rowChip('/broker-crm.html', 'Mobile apps');
  await rowChip('/agent.html', 'Bookings');
  for (const t of ['Projects, phases and buildings', 'Unit inventory', 'Holds and reservations', 'Contracts and collections', 'Broker network', 'Developer dashboard', 'Price lists']) await rowChip('/developer-crm.html', t);
});

test('prices shown on product pages match pricing.html', async () => {
  const pricing = readFileSync('pricing.html', 'utf8');
  for (const [file, amounts] of [['index', ['$19']], ['broker-crm', ['$19', '$49']], ['agent', ['$19']]]) {
    const html = readFileSync(`${file}.html`, 'utf8');
    const found = [...html.matchAll(/\$\d+/g)].map((m) => m[0]);
    for (const a of amounts) expect(found, `${file} mentions ${a}`).toContain(a);
    for (const f of found) expect(pricing, `${file} ${f} exists on pricing.html`).toContain(f);
  }
});

test('assets stay within the site Content-Security-Policy', async () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const csp = vercel.headers.find((h) => h.source === '/(.*)').headers.find((h) => h.key === 'Content-Security-Policy').value;
  const dir = (n) => (csp.split(';').map((s) => s.trim()).find((s) => s.startsWith(n + ' ')) || '').split(' ').slice(1);
  const scriptSrc = dir('script-src');
  const styleSrc = dir('style-src');
  for (const name of MARKETING) {
    const html = readFileSync(`${name}.html`, 'utf8');
    for (const [, src] of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
      if (/^https?:/.test(src)) expect(scriptSrc.some((s) => src.startsWith(s)), `${name} script ${src}`).toBe(true);
    }
    for (const [, href] of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
      if (/^https?:/.test(href)) expect(styleSrc.some((s) => href.startsWith(s)), `${name} style ${href}`).toBe(true);
    }
    // No inline event handlers or inline scripts (script-src has no 'unsafe-inline').
    expect(html).not.toMatch(/\son(click|load|error)=/i);
    expect([...html.matchAll(/<script(?![^>]*(src=|type="application\/ld\+json"))[^>]*>/g)].length, `${name} inline scripts`).toBe(0);
  }
});

test('checkout and sign-in files are untouched by the redesign', async () => {
  for (const f of ['checkout.html', 'checkout.css', 'checkout.js', 'sign-in.html']) {
    const p = f.endsWith('.html') ? f : `assets/${f}`;
    const html = readFileSync(p, 'utf8');
    expect(html).not.toContain('system.css');
    expect(html).not.toContain('motion.css');
  }
});

test.describe('screenshot regression (reduced motion)', () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });
  for (const name of ['index', 'products', 'broker-crm', 'agent', 'pricing']) {
    test(`${name}: first screen`, async ({ page }) => {
      await page.route(/railway\.app/, (r) => r.abort());
      await page.goto(`/${name}.html`);
      await page.waitForLoadState('load');
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(`${name}.png`, { animations: 'disabled' });
    });
  }
});

test('WhatsApp Campaigns page: real screenshot, pricing matches, deep link opens the WhatsApp plans', async ({ page }) => {
  await page.goto('/whatsapp-campaigns.html');
  const img = page.locator('.shot img').first();
  await expect(img).toBeVisible();
  expect(await img.evaluate((i) => i.naturalWidth)).toBeGreaterThan(1000);
  const pricing = readFileSync('pricing.html', 'utf8');
  for (const p of ['$29', '$59', '$99']) expect(pricing).toContain(p);
  await page.goto('/pricing.html#whatsapp');
  await expect(page.locator('#whatsapp')).toBeVisible();
});

test('fonts are self-hosted (no Google Fonts on marketing pages)', async ({ page }) => {
  for (const name of MARKETING) expect(readFileSync(`${name}.html`, 'utf8')).not.toContain('fonts.googleapis.com');
  await page.goto('/index.html');
  await page.waitForLoadState('load');
  const ok = await page.evaluate(async () => { await document.fonts.ready; return ['Inter', 'Instrument Serif'].every((f) => [...document.fonts].some((x) => x.family.replace(/"/g, '') === f && x.status === 'loaded')); });
  expect(ok).toBe(true);
});
