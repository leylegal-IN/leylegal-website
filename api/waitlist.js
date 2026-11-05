// POST /api/waitlist: saves one sign-up { name, email, role }.
// 201 saved · 200 already on the list (or a bot) · 400 invalid · 503 no database yet · 500 database error
import { sql, ensureTable, sendJSON, readJSON } from './_db.js';

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const ROLES = new Set(['advocate', 'student']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJSON(res, 405, { error: 'method_not_allowed' });
  }
  let body;
  try { body = await readJSON(req); } catch { return sendJSON(res, 400, { error: 'bad_json' }); }

  // Honeypot: real people never see this field, so a filled one is a bot. Answer as if it worked.
  if (body?.company) return sendJSON(res, 200, { status: 'saved' });

  const name = String(body?.name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const role = String(body?.role ?? '');
  const errors = {};
  if (name.length < 2 || name.length > 80) errors.name = 'Please enter your name.';
  if (email.length > 254 || !EMAIL.test(email)) errors.email = 'Enter a valid email address.';
  if (!ROLES.has(role)) errors.role = 'Choose advocate or law student.';
  if (Object.keys(errors).length) return sendJSON(res, 400, { error: 'invalid', fields: errors });

  if (!sql) return sendJSON(res, 503, { error: 'not_configured' });
  try {
    await ensureTable();
    const rows = await sql`
      insert into waitlist (name, email, role) values (${name}, ${email}, ${role})
      on conflict (email) do nothing
      returning id`;
    return sendJSON(res, rows.length ? 201 : 200, { status: rows.length ? 'saved' : 'exists' });
  } catch (err) {
    console.error('waitlist insert failed', err);
    return sendJSON(res, 500, { error: 'server' });
  }
}
