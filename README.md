# leylegal.in

The Ley Legal homepage and its waitlist, deployed on Vercel.

| Path | What it is |
|---|---|
| `public/` | The website: `index.html`, `404.html`, icons, `og.png` (link-preview image), `robots.txt`, `sitemap.xml` |
| `public/hi.js` | The Hindi version of every line on the homepage (the EN / हिंदी switch in the top bar). English stays in `index.html` and `app.js`. |
| `api/waitlist.js` | `POST /api/waitlist`: saves a sign-up (name, email, optional WhatsApp number, advocate or law student) to Postgres |
| `api/waitlist-export.js` | `GET /api/waitlist-export`: downloads the waitlist as a spreadsheet (CSV), password protected |
| `db/waitlist.sql` | The table. It is created automatically on the first sign-up |
| `scripts/build.mjs` | Runs on every Vercel deploy: puts the right address into link previews, writes `robots.txt` and `sitemap.xml` |
| `scripts/dev.mjs` | Local preview of the site and the API |
| `review/`, `design/` | Design review boards and exported images. Local only, not deployed |

## Deploy on Vercel (one time)

1. **Import the project.** Push this folder to Ley Legal's GitHub and import it in Vercel, or run `npx vercel` here. No settings to change: `vercel.json` sets the build and output folder.
2. **Connect a database.** In the Vercel project, open **Storage → Create Database** and pick Postgres (Neon) or Supabase. Connect it to the project for Production and Preview. Vercel adds the connection string (`DATABASE_URL` / `POSTGRES_URL`) by itself.
3. **Set the export password.** In **Settings → Environment Variables**, add `WAITLIST_EXPORT_PASSWORD` with a long random value.
4. **Redeploy** so the new settings take effect (Deployments → ⋯ → Redeploy).
5. **Add the domain.** In **Settings → Domains**, add `leylegal.in` and `www.leylegal.in`, then set the DNS records Vercel shows at the registrar. Link previews and the sitemap switch to leylegal.in on the next deploy.

## Download the waitlist

Open `https://leylegal.in/api/waitlist-export`. The browser asks for a username and password: type anything as the username and the `WAITLIST_EXPORT_PASSWORD` as the password. A CSV downloads that opens in Excel (Hindi names included).

## Run it locally

```bash
npm install
cp .env.example .env.local
npm run dev:db
```

Then, in a second terminal:

```bash
npm run dev
```

The site is at http://localhost:4173/, and the review boards are at http://localhost:4173/review/. `npm run dev:db` starts a throwaway in-memory Postgres. It takes about 15 seconds to start, so wait for "listening on port 5544" before signing up. Sign-ups made locally vanish when it stops; if it stops, restart it and then restart `npm run dev`.
