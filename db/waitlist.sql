-- The waitlist table. api/_db.js creates it automatically on first sign-up;
-- this file is the same schema, for reference or for running by hand in the database's SQL editor.
create table if not exists waitlist (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 2 and 80),
  email      text not null unique check (char_length(email) <= 254),
  role       text not null check (role in ('advocate', 'student')),
  whatsapp   text check (char_length(whatsapp) <= 16),   -- optional, stored as +91XXXXXXXXXX
  created_at timestamptz not null default now()
);
-- For a table created before the WhatsApp field existed:
alter table waitlist add column if not exists whatsapp text check (char_length(whatsapp) <= 16);
