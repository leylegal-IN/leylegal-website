// Vercel build step (vercel.json → buildCommand). Runs on every deploy:
//  1. Puts the address this deploy is really served on into the link-preview tags, so WhatsApp/LinkedIn
//     previews show the share image on the vercel.app address now and on leylegal.in after the switch.
//  2. Writes robots.txt (production: open to search engines; previews: closed) and sitemap.xml.
// Outside Vercel it does nothing, so local files stay as they are. BUILD_DIR lets a test run on a copy.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const { VERCEL, VERCEL_ENV, VERCEL_URL, VERCEL_PROJECT_PRODUCTION_URL, BUILD_DIR } = process.env;
if (!VERCEL) {
  console.log('build: not running on Vercel; nothing to do.');
  process.exit(0);
}

const dir = BUILD_DIR || 'public';
const production = VERCEL_ENV === 'production';
// The project's production address: its custom domain once one is added in Vercel, else its vercel.app name.
const home = VERCEL_PROJECT_PRODUCTION_URL ? `https://${VERCEL_PROJECT_PRODUCTION_URL}` : 'https://leylegal.in';
// Where this particular deploy is served (preview deploys have their own address).
const here = production || !VERCEL_URL ? home : `https://${VERCEL_URL}`;

const file = join(dir, 'index.html');
let html = await readFile(file, 'utf8');
const swaps = [
  ['<link rel="canonical" href="https://leylegal.in/">', `<link rel="canonical" href="${home}/">`],
  ['<meta property="og:url" content="https://leylegal.in/">', `<meta property="og:url" content="${here}/">`],
  ['<meta property="og:image" content="https://leylegal.in/og.png">', `<meta property="og:image" content="${here}/og.png">`],
  ["Join the waitlist: https://leylegal.in'", `Join the waitlist: ${home}'`],
];
for (const [from, to] of swaps) {
  if (!html.includes(from)) throw new Error(`build: expected to find ${from} in ${file}`);
  html = html.replace(from, to);
}
await writeFile(file, html);

await writeFile(join(dir, 'robots.txt'), production
  ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${home}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
await writeFile(join(dir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${home}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`);

console.log(`build: ${VERCEL_ENV} deploy · previews point at ${here} · canonical ${home}`);
