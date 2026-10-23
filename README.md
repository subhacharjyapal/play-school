# ⭐ Little Stars Play School — Website + Parent Portal

A full-stack, responsive website for **Little Stars Play School** (Austin, TX):
a cheerful public marketing site plus a secure **parent portal** where parents view
their child's academic progress, test results and downloadable PDF report cards.
Teachers manage classes, tests, attendance and progress reports; admins manage
admissions, people, classes, gallery and site content.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4, React Router 7, Recharts, Zod, Axios |
| Backend | Node.js + Express 4 (TypeScript), Helmet, CORS, CSRF, rate limiting |
| Database | SQLite via **Prisma ORM** (swap to PostgreSQL by changing `DATABASE_URL` + column types) |
| Auth | JWT in **httpOnly cookies**, bcrypt password hashing, token-based password reset |
| Uploads | Multer (local disk via a `StorageService` interface — S3-swappable) |
| PDF | pdfkit (streamed report cards) |
| Email | Console mock in dev (`EmailService` interface — Nodemailer-ready when SMTP is configured) |
| Tests | Vitest + Supertest (41 tests: auth, authorization, security) |

---

## Quick Start

### Prerequisites
- Node.js ≥ 20 (tested on Node 24)
- npm ≥ 10

### 1. Backend

```powershell
cd server
npm install
copy .env.example .env        # then edit values (see table below)
npx prisma migrate dev --name init --skip-seed   # creates dev.db
npm run seed                  # demo data + SVG placeholder images
npm run dev                   # API on http://localhost:4000
```

### 2. Frontend

```powershell
cd client
npm install
npm run dev                   # site on http://localhost:5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` and `/uploads`
to the backend, so cookies work with a single origin.

### Reset / re-seed at any time

```powershell
cd server
npm run seed                  # wipes and recreates all demo data
```

---

## Environment Variables (`server/.env`)

| Variable | Description | Dev default |
|---|---|---|
| `PORT` | API port | `4000` |
| `DATABASE_URL` | Prisma datasource. SQLite: `file:./dev.db` — PostgreSQL: `postgresql://user:pass@host:5432/db` | `file:./dev.db` |
| `JWT_SECRET` | **Secret** for signing session tokens (≥16 chars; use a long random string in prod) | dev-only value |
| `JWT_EXPIRES_IN` | Session lifetime | `7d` |
| `COOKIE_SECURE` | Set `true` in production (HTTPS-only cookies) | `false` |
| `CORS_ORIGIN` | Allowed browser origin | `http://localhost:5173` |
| `EMAIL_FROM` | From-header for outgoing email | school no-reply |
| `SMTP_HOST/PORT/USER/PASS` | If `SMTP_HOST` is empty → **console mock email** (prints to server terminal). Fill in to use Nodemailer | empty |
| `UPLOAD_DIR` | Upload folder name | `uploads` |
| `MAX_UPLOAD_MB` | Max gallery upload size | `5` |
| `DISABLE_RATE_LIMIT` | Dev-only escape hatch — **never `true` in production** | `false` (`.env` shipped for local dev sets `true`) |

> Secrets live only in `.env` (git-ignored). `.env.example` documents every key.
> The server validates env vars with Zod at boot and fails fast with a clear message.

---

## Demo Login Credentials

All seeded users (passwords in parentheses):

| Role | Email | Password | Notes |
|---|---|---|---|
| **Admin** | `admin@littlestars.example` | `Admin@123` | Full panel access |
| **Teacher** | `teacher1@littlestars.example` | `Teacher@123` | Priya Sharma — LKG Blue + Nursery Rainbow |
| **Teacher** | `teacher2@littlestars.example` | `Teacher@123` | Rahul Verma — UKG Sunshine + Playgroup Butterflies |
| **Parent** | `parent1@littlestars.example` | `Parent@123` | Amit Patel — 2 children |
| **Parent** | `parent2@littlestars.example` | `Parent@123` | 1 child |
| **Parent** | `parent3@littlestars.example` … `parent5@…` | `Parent@123` | 1–2 children each |

The seed also creates 1 **pending application** for the admin review demo.
New accounts created by approving applications get a random temporary password
**emailed** — in dev the email is printed in the server console (mock email service).

---

## Run Commands

| Command | Where | What |
|---|---|---|
| `npm run dev` | `server/` | API with hot reload (tsx watch) on :4000 |
| `npm run dev` | `client/` | Vite dev server on :5173 |
| `npm run seed` | `server/` | Reset + seed demo data (also regenerates SVG placeholder images) |
| `npm test` | `server/` | 41 Vitest tests (auth, parent/teacher authorization, CSRF, rate limit, sanitization) |
| `npm run build` | `server/` | Compile TypeScript to `dist/` |
| `npm run build` | `client/` | Typecheck + production build (code-split bundles) |
| `node scripts/smoke.mjs` | `server/` | 38 end-to-end checks against a *running* dev server |

---

## Features

### Public site
- **Home** — hero, highlights, live announcements, testimonials, gallery preview, CTAs
- **About** — story, mission/vision, philosophy, programs (Playgroup/Nursery/LKG/UKG),
  facilities, daily routine, staff profiles (from the DB)
- **Gallery** — masonry grid, category filters, keyboard-navigable lightbox, lazy images
- **Admissions** — full registration form (validated client + server), saved as **Pending**,
  confirmation message; admin approval **creates the parent account + student** and
  emails login credentials
- **Contact** — address/phone/email, embedded map, validated contact form (stored for admin)
- **Login / Forgot password / Reset password** — token-based reset (hashed tokens, 1 h expiry)

### Parent portal (role: PARENT)
- Dashboard with all children (photo, class, teacher) — supports multiple children
- Per-term progress cards: 6 skill ratings (1–5), teacher remarks, attendance %
- Test results table + **Recharts performance chart** + **Download report card (PDF)**
- Profile: update contact info, change password
- **Every query is ownership-checked server-side** — a parent can never read another
  parent's child (verified by automated tests)

### Teacher panel (roles: TEACHER, ADMIN)
- View assigned classes/students only
- Create/delete tests; record marks per student (auto grade, max-marks validation)
- Mark daily attendance (per-class, upsert per date)
- Write per-term progress reports with skill ratings
- Scope enforced: teachers cannot touch other teachers' classes/students

### Admin panel (role: ADMIN)
- Dashboard counts (students, pending applications, teachers, parents, classes, messages)
- Applications: review, **approve** (creates parent + student + emails credentials),
  reject, resend credentials
- Students (add/edit/archive), Parents, Teachers (create with one-time temp password,
  activate/deactivate), Classes (create/edit, assign teachers)
- Gallery manager: upload (type+size restricted), categorize, delete
- Content: announcements/events CRUD (shown on the home page); contact messages inbox

---

## Security & Privacy (children's data)

- **Authorization enforced on the server in every query** — role middleware +
  `canUserAccessStudent()` ownership checks; the UI is never trusted
- JWT in **httpOnly, SameSite** cookies (not readable by JS); passwords hashed with bcrypt
- **CSRF** double-submit cookie on all state-changing requests
- **Rate limiting**: strict limiter on login/forgot/reset, global API limiter
- **Helmet** security headers, configured CORS (credentials + explicit origin)
- **Zod validation + sanitization** (trim, control-character stripping) on all inputs;
  error responses return per-field messages
- Uploads restricted to image types + size cap; stored via a storage interface with
  path-traversal-safe deletes
- Reset tokens stored **hashed** with expiry and single use; login errors never reveal
  whether an email exists; structured logs **redact** passwords/tokens/medical notes
- 41 automated tests prove the boundaries (cross-parent 403s, teacher scope, role gates,
  CSRF 403, rate-limit 429, sanitization)

---

## Project Structure

```
├── client/                  # React + Vite + Tailwind
│   └── src/
│       ├── api/             # Axios instance (cookies+CSRF) + typed APIs
│       ├── components/      # ui kit, layout, gallery, forms, ProtectedRoute
│       ├── context/         # AuthContext (session user, login/logout)
│       ├── lib/             # constants, Zod schemas (client-side), utils
│       └── pages/           # public / parent / teacher / admin (lazy routes)
└── server/                  # Express + Prisma
    ├── prisma/              # schema.prisma, seed.ts, migrations/
    ├── scripts/smoke.mjs    # end-to-end smoke checks (needs running dev server)
    ├── src/
    │   ├── config/          # Zod-validated env
    │   ├── lib/             # prisma client, redacting logger, errors, constants
    │   ├── middleware/      # auth (JWT+roles), csrf, validate+sanitize, rateLimit, errors
    │   ├── modules/         # auth, applications, portal, teacher, admin, gallery,
    │   │                    # announcements, contact, reports (PDF), site
    │   └── services/        # auth, email (mock→Nodemailer), storage (disk→S3), approval, ownership
    └── tests/               # vitest: auth, authorization, security suites
```

---

## Notes & Known Behaviors

- **Mock email**: without SMTP configured, "emails" (approval credentials, password
  resets) are printed to the server console — grab the link/password from there.
- **Placeholder images**: the seed generates cheerful local SVGs under
  `server/uploads/` so everything works fully offline.
- **SQLite → PostgreSQL**: the schema uses string columns where SQLite lacks native
  enums; moving to Postgres means changing `datasource.provider`, setting
  `DATABASE_URL`, and optionally promoting those columns to native enums.
- **npm audit**: 3 remaining advisories come from Prisma's dev-time CLI config
  package (`deepmerge-ts`) — no fix exists on the 6.x line; it does not affect
  runtime data handling. Prisma 7 changes the client generator significantly,
  so the upgrade is intentionally deferred.
- **Rate limiting in dev**: `DISABLE_RATE_LIMIT=true` ships in the local `.env`
  so automated testing isn't throttled — remove it to exercise the limiter
  (the security test suite enables it explicitly and proves it returns 429).
