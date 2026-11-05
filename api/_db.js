// Shared database access for the waitlist functions. Files starting with "_" are not routes on Vercel.
// Works with any Postgres that Vercel's Storage tab connects (Neon or Supabase): it reads the
// connection string those integrations add to the project.
import postgres from 'postgres';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const local = url && /@(localhost|127\.0\.0\.1)[:/]/.test(url);

// One small connection per function instance; prepare:false keeps it compatible with pooled URLs.
// connect_timeout: if the database can't be reached, fail in seconds rather than leave a visitor waiting.
// onnotice: Postgres says "already exists, skipping" on every cold start; that isn't worth a log line.
export const sql = url ? postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 8, ssl: local ? false : 'require', onnotice: () => {} }) : null;

let ready;
// Creates the table on first use, so a new database needs no manual setup. Same schema as db/waitlist.sql.
// The second step adds the WhatsApp column to a table made before that field existed.
export function ensureTable() {
  ready ??= (async () => {
    await sql`
      create table if not exists waitlist (
        id         bigint generated always as identity primary key,
        name       text not null check (char_length(name) between 2 and 80),
        email      text not null unique check (char_length(email) <= 254),
        role       text not null check (role in ('advocate', 'student')),
        whatsapp   text check (char_length(whatsapp) <= 16),
        created_at timestamptz not null default now()
      )`;
    await sql`alter table waitlist add column if not exists whatsapp text check (char_length(whatsapp) <= 16)`;
  })().catch(err => { ready = undefined; throw err; });
  return ready;
}

export function sendJSON(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// Vercel hands over a parsed req.body; a plain Node server (scripts/dev.mjs) does not.
export async function readJSON(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) throw new Error('too large');
  }
  return raw ? JSON.parse(raw) : {};
}
