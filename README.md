# Creative Studio — Portfolio + Admin Inbox

A React + Vite portfolio site with a working contact form, an admin inbox, and a small Node API.
No extra npm packages were needed for the backend.

## What's included

**Public site (`/`)**
- Navigation, about, services, projects and contact sections.
- **Get Started** buttons jump to the contact form and focus the name field.
- **View Project** opens a project details dialog with a "Discuss a similar project" action.
- Contact form validates in the browser and posts to the API; shows real success/error states.

**Admin site (`/admin`)**
- Password login (token kept in `sessionStorage` for 24 hours).
- Inbox of submitted messages with unread highlighting, mark-as-read, delete, refresh and stats.

**API (`server/index.js`)**
- `POST /api/contact` — validate and store a message.
- `POST /api/admin/login` — sign in.
- `GET /api/admin/messages` — list messages + stats (auth required).
- `PATCH /api/admin/messages/:id` — mark as read (auth required).
- `DELETE /api/admin/messages/:id` — delete (auth required).
- `GET /api/config`, `GET /api/health`.

## Run locally

```bash
npm install
npm run dev
```

This starts Vite (http://localhost:5173) and the API (http://localhost:3001) together.
`/api` requests from Vite are proxied to the API.

Open:
- Public site: http://localhost:5173/
- Admin site: http://localhost:5173/admin

Demo login password: **admin123** (change it in `.env`).

## Production-style run

```bash
npm run build
npm start
```

The API then also serves the built `dist/` folder and the `/admin` route from http://localhost:3001.

## Configuration

Copy `.env.example` to `.env` (a `.env` with demo values is already included):

```env
PORT=3001
ADMIN_PASSWORD=admin123
```

Change `ADMIN_PASSWORD` before sharing the admin page with anyone.

## Demo mode / real email

Email delivery is intentionally in **demo mode**: submissions are saved to
`server/data/messages.json` and shown in the admin inbox; no email is sent.
The form and admin UI both say so clearly.

To send real email later, replace the body of `deliverEmail()` in `server/index.js`
with a provider call (for example the Resend API using a key from `.env`) and return
`{ sent: true }` on success. The API response already carries `emailSent` and `demo`
flags, so the front end will update automatically.

Stored messages are ignored by git (`server/data/messages.json`).

## Deploy to Fly.io

The project includes a `Dockerfile`, `.dockerignore`, and `fly.toml` for Fly.io.
The API and the built React app run together on port 8080, and a persistent volume
keeps `messages.json` between deploys.

```bash
fly auth login
fly apps create creative-studio-iradukunda   # pick a globally unique name
fly volumes create messages_data --region ams --size 1
fly secrets set ADMIN_PASSWORD="choose-a-strong-password"
fly deploy
```

If you change the app name or region, update `app` and `primary_region` in `fly.toml`
and use the same region for the volume. The live URL will be
`https://<app-name>.fly.dev` (public site at `/`, admin at `/admin`).
