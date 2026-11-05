// GET /api/waitlist-export: downloads the waitlist as a CSV that opens in Excel.
// Protected by the browser's password prompt: any username, password = WAITLIST_EXPORT_PASSWORD.
import { timingSafeEqual } from 'node:crypto';
import { sql, ensureTable } from './_db.js';

function deny(res, status, message) {
  res.statusCode = status;
  if (status === 401) res.setHeader('WWW-Authenticate', 'Basic realm="Ley Legal waitlist", charset="UTF-8"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(message);
}

function passwordOK(header, expected) {
  const [scheme, value] = String(header || '').split(' ');
  if (scheme !== 'Basic' || !value) return false;
  const given = Buffer.from(Buffer.from(value, 'base64').toString('utf8').split(':').slice(1).join(':'));
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want);
}

// Quote every cell, and defuse cells Excel would run as a formula (=, +, -, @).
const cell = v => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

const IST = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

export default async function handler(req, res) {
  const password = process.env.WAITLIST_EXPORT_PASSWORD;
  if (!password) return deny(res, 503, 'Export is switched off: set WAITLIST_EXPORT_PASSWORD in Vercel.');
  if (!passwordOK(req.headers.authorization, password)) return deny(res, 401, 'Password required.');
  if (!sql) return deny(res, 503, 'No database connected yet.');
  try {
    await ensureTable();
    const rows = await sql`select name, email, whatsapp, role, created_at from waitlist order by created_at`;
    const lines = [['Name', 'Email', 'WhatsApp (+91)', 'Role', 'Joined (IST)'].map(cell).join(',')];
    // WhatsApp is written as 98765 43210: a leading + would make Excel treat it as a formula, and a bare number loses digits.
    const wa = n => n ? n.slice(3, 8) + ' ' + n.slice(8) : '';
    for (const r of rows) lines.push([r.name, r.email, wa(r.whatsapp), r.role === 'student' ? 'Law student' : 'Advocate', IST.format(r.created_at)].map(cell).join(','));
    const day = new Date().toISOString().slice(0, 10);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="leylegal-waitlist-${day}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    // The BOM makes Excel read the file as UTF-8, so Hindi names come through intact.
    res.end('﻿' + lines.join('\r\n') + '\r\n');
  } catch (err) {
    console.error('waitlist export failed', err);
    deny(res, 500, 'Could not read the waitlist.');
  }
}
