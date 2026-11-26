// Captures full-page screenshots of every page at desktop and mobile widths (reduced motion = final visual state).
// Usage: node scripts/capture.mjs [outDir]   (starts its own server on 4181)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] || 'docs/redesign/screenshots/after';
mkdirSync(out, { recursive: true });
const pages = ['index', 'products', 'pricing', 'about', 'contact', 'crm', 'broker-crm', 'developer-crm', 'agent', 'whatsapp-campaigns', 'privacy', '404'];
const server = spawn(process.execPath, ['scripts/serve.mjs', '4181'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch();
for (const [label, viewport, mobile] of [['desktop', { width: 1440, height: 900 }, false], ['mobile', { width: 390, height: 844 }, true]]) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
  for (const p of pages) {
    const page = await ctx.newPage();
    await page.route(/railway\.app/, (r) => r.abort());
    await page.goto(`http://localhost:4181/${p}.html`);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${label}-${p}.png`, fullPage: true });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
server.kill();
console.log('screenshots in', out);
