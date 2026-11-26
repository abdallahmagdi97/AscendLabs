// Tiny static server for tests and local review: mirrors vercel.json's /checkout rewrite. Usage: node scripts/serve.mjs [port]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const port = Number(process.argv[2] || 4180);

http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (p === '/checkout') p = '/checkout.html';
  try {
    const body = await readFile(join(root, p));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    try { const nf = await readFile(join(root, '404.html')); res.writeHead(404, { 'content-type': types['.html'] }); res.end(nf); }
    catch { res.writeHead(404); res.end(); }
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
