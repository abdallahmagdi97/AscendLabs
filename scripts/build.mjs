// Assembles the site's HTML pages from src/pages + src/partials into the repo root, where Vercel serves them.
// Zero dependencies. Usage: node scripts/build.mjs [--check] [--no-hash]
//   --check    write nothing; exit 1 if any generated file differs from what is committed
//   --no-hash  keep ?v= cache-busting values as written
// Page markers: <!--@header base=/ current=pricing-->  <!--@footer base=/-->
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const read = (p) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const partials = { header: read('src/partials/header.html'), footer: read('src/partials/footer.html') };

const hashOf = (file) => createHash('sha256').update(readFileSync(join(root, file))).digest('hex').slice(0, 8);
const opts = (s) => Object.fromEntries([...s.matchAll(/(\w+)=(\S*)/g)].map((m) => [m[1], m[2]]));

function render(src) {
  let out = src.replace(/<!--@(header|footer)([^>]*?)-->/g, (_, name, o) => {
    const { base = '', current = '' } = opts(o);
    let html = partials[name].replaceAll('{{b}}', base);
    if (name === 'header' && current) {
      html = html.replace(new RegExp(`(class="nav-link" href="${base}${current}\.html")`), '$1 aria-current="page"');
    }
    return html;
  });
  if (!args.has('--no-hash')) {
    out = out.replace(/(["'(\/])(assets\/[\w.\-]+)\?v=[0-9a-f]+/g, (m, pre, file) =>
      existsSync(join(root, file)) ? `${pre}${file}?v=${hashOf(file)}` : m);
  }
  return out;
}

let drift = 0;
for (const f of readdirSync(join(root, 'src/pages')).filter((n) => n.endsWith('.html'))) {
  const html = render(read(`src/pages/${f}`));
  const target = join(root, f);
  const current = existsSync(target) ? readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : null;
  if (args.has('--check')) { if (current !== html) { drift++; console.error(`out of date: ${f}`); } }
  else if (current !== html) { writeFileSync(target, html); console.log(`wrote ${f}`); }
}
if (drift) process.exit(1);
