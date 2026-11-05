// Local preview: serves public/ at / as Vercel does, review/ at /review/ (local only), and runs the
// real functions in api/ at /api/<name>. Settings come from .env.local (see .env.example).
//   npm run dev        → http://localhost:4173/
//   npm run dev:db     → a throwaway Postgres for testing (in another terminal)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

// Load .env.local before any api/ module reads process.env.
const envFile = join(ROOT, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

async function sendFile(res, file, status = 200) {
  const body = await readFile(file);
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Content-Length': body.length });
  res.end(body);
}

// Resolve a URL path inside a base folder, refusing anything that climbs out of it.
async function find(base, path) {
  const full = normalize(join(base, decodeURIComponent(path)));
  if (!full.startsWith(base)) return null;
  for (const candidate of [full, join(full, 'index.html'), full + '.html']) {
    try { if ((await stat(candidate)).isFile()) return candidate; } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const api = pathname.match(/^\/api\/([a-z0-9-]+)$/);
    if (api && existsSync(join(ROOT, 'api', api[1] + '.js'))) {
      const mod = await import(pathToFileURL(join(ROOT, 'api', api[1] + '.js')).href);
      return await mod.default(req, res);
    }
    const inReview = pathname === '/review' || pathname.startsWith('/review/');
    const file = await find(join(ROOT, inReview ? 'review' : 'public'), inReview ? pathname.slice(7) || '/' : pathname);
    if (file) return await sendFile(res, file);
    return await sendFile(res, join(ROOT, 'public', '404.html'), 404);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
}).listen(PORT, '127.0.0.1', () => {
  const db = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  console.log(`Ley Legal dev server: http://localhost:${PORT}/  (review boards at /review/)`);
  console.log(db ? 'Waitlist API: connected to the database in .env.local' : 'Waitlist API: no DATABASE_URL in .env.local, so sign-ups will get "not configured"');
});
