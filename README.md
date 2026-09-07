# AI Financial Copilot 💰

> An AI-powered personal finance web app that gives users a transparent Financial Health Score, a data-aware AI Copilot, and a What-If Simulator — in English, Urdu, and Roman Urdu.

Most finance apps show you a list of transactions. **AI Financial Copilot** turns your income, expenses, savings, and goals into a plain-language score, lets you chat with an AI Copilot that actually knows your numbers, and lets you test spending decisions before making them in real life.

---

## Overview

AI Financial Copilot is a full-stack web application (React + TypeScript frontend, FastAPI + SQLite backend) that helps a user:

- Understand their financial situation through a transparent, formula-based **Financial Health Score**.
- Track **income, expenses, and savings** in one place.
- Set and monitor progress toward a single **savings goal**.
- Explore **what-if financial scenarios** (e.g. "what if I cut my food budget by 5,000?") and see the effect on savings, score, and goal progress before committing.
- Ask an **AI Financial Copilot** questions about their own numbers, in English, Roman Urdu, or Urdu script — whichever the user actually types in.
- View a **dashboard** with expense breakdown, income-vs-expenses, savings/goal progress, and score insights, all computed from the user's real stored data.

The scoring formula is deterministic and explainable — the backend always calculates it. The AI (Google Gemini) is used only to *explain* the score in plain language and to power the Copilot conversation; it never determines or overrides the score, and it never writes to the database.

---

## Current Feature Set (Implemented)

| Feature | Status |
|---|---|
| Landing page (hero, features, how-it-works, score/copilot/simulator showcases, final CTA, footer) | ✅ Implemented |
| Email/password authentication (signup, login, JWT sessions, protected routes) | ✅ Implemented |
| Financial profile (income, savings, expenses by category) | ✅ Implemented |
| Financial goal (single target amount + optional description) | ✅ Implemented |
| Financial Health Score (deterministic 0–100 score + AI-generated explanation) | ✅ Implemented |
| What-If Simulator (adjust one expense, compare current vs. simulated outcome) | ✅ Implemented |
| AI Financial Copilot (multi-turn chat, grounded in the user's real financial data) | ✅ Implemented |
| Multilingual Copilot (English / Roman Urdu / Urdu script, detected per message) | ✅ Implemented |
| Dashboard analytics (KPIs, expense breakdown chart, income-vs-expenses chart, savings/goal panel, score insights, recent activity) | ✅ Implemented |
| UI internationalization (English / Urdu interface labels, RTL layout) | ✅ Implemented |
| Light / dark / system theme, with persistence | ✅ Implemented |
| Page transitions, scroll-reveal, count-up score ring, chart animations, reduced-motion support | ✅ Implemented |
| Responsive layout (desktop down to mobile) | ✅ Implemented (see [Responsive Design](#responsive-design)) |
| Settings page (account info, theme, language) | ✅ Implemented |

**Not implemented / out of scope for this build:**

- Live bank account integration or real transactions.
- Historical/multi-period financial trend charts (see [Dashboard Analytics](#dashboard-analytics)).
- Multiple goals per user (the data model supports exactly one goal per user).
- Password reset / email verification flows.
- Automated CI pipeline or deployment configuration (see [Deployment](#deployment)).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite, React Router, Redux Toolkit, Tailwind CSS, Recharts, Axios, lucide-react |
| Backend / API | Python + FastAPI, Pydantic, SQLModel |
| Database | SQLite |
| Authentication | JWT (python-jose) + bcrypt password hashing (passlib), self-contained `app/auth.py` module |
| AI Copilot & score explanations | Google Gemini (`google-genai` SDK) |

No live bank integration, no ML-based scoring, no production infrastructure — the Financial Health Score is a deterministic formula; Gemini is used only for natural-language explanation and conversation.

---

## Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, error handlers, router registration
│   │   ├── auth.py            # Self-contained signup/login/JWT auth module
│   │   ├── config.py          # Settings (env-driven)
│   │   ├── database.py        # SQLModel engine + additive migrations
│   │   ├── models/            # SQLModel tables: User, FinancialProfile, Expense, Goal, ScoreResult
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── routes/            # health, score, simulate, financial_data, dashboard, copilot
│   │   └── services/          # score_engine, what_if_engine, copilot_context,
│   │                          # copilot_service, gemini_client, language_detect
│   ├── test_*.py               # Pytest test suite
│   ├── conftest.py             # Shared test DB setup
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/              # Landing, auth, dashboard, financial profile, goals,
│   │   │                        # score, simulator, copilot, settings, 404
│   │   ├── components/         # ui/, layout/, dashboard/, score/, copilot/, common/
│   │   ├── layouts/             # AppLayout (authenticated shell), AuthLayout
│   │   ├── hooks/               # useAuth, useTheme, useTranslation, useSessionRestore, ...
│   │   ├── store/               # Redux Toolkit: auth, theme, language, ui slices
│   │   ├── api/                 # Axios wrappers per resource (auth, dashboard, score, ...)
│   │   ├── utils/               # i18n dictionary, currency/date helpers, language detection
│   │   ├── types/               # Shared TypeScript types
│   │   └── constants/routes.ts  # Route path constants
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── PRD.md                  # Product requirements
│   ├── ARCHITECTURE.md         # System architecture
│   ├── DATA_MODEL.md           # Database schema/entities
│   ├── API_CONTRACT.md         # Endpoint-by-endpoint API reference
│   ├── DEVELOPMENT_PLAN.md     # Task sequencing / team ownership
│   └── DEFINITION_OF_DONE.md   # Completion checklists
├── AGENTS.md                    # Rules for AI coding agents working in this repo
└── README.md
```

---

## AI Financial Copilot — Behavior

The Copilot is a multi-turn chat, grounded in the authenticated user's real financial data.

**How it works:**

1. The frontend sends the user's question plus up to the last 10 conversation turns (`POST /api/users/{user_id}/copilot/ask`) — it never sends financial data itself.
2. The backend verifies the caller owns the `user_id`, then assembles a context object server-side from SQLite: monthly income, monthly savings, expenses, goal + calculated progress, and the latest stored score + factors.
3. The backend detects which language the user's **current message** is written in (English, Roman Urdu, or Urdu script) using a lightweight, dependency-free heuristic — not the account's stored UI language. Short/ambiguous messages (e.g. "haan", "ok") fall back to the language of the previous turn.
4. The backend builds a prompt combining the financial context, recent conversation history, explicit language instructions, and the question, and sends it to Gemini.
5. Gemini's answer is returned to the frontend along with the `language` that was detected for that turn, so the chat bubble can be rendered with the right text direction and font.

**Multilingual behavior:**

| Input | Copilot responds in |
|---|---|
| English | Natural, conversational English |
| Roman Urdu (e.g. "Meri savings kitni hain?") | Natural, conversational Roman Urdu — not a stiff translation |
| Urdu script (e.g. "میری بچت کتنی ہے؟") | Natural, conversational Urdu (Perso-Arabic) script |
| Mixed English/Roman Urdu | Natural mixed, Roman-Urdu-dominant response |

Language is determined from the actual text of the user's message and recent conversation, **not** from the app's UI language setting or the account's stored language preference. This is a best-effort heuristic (Urdu-script detection is exact; Roman Urdu vs. English uses a small hand-built word list plus a dominance threshold), not a guaranteed-perfect language classifier — very short or unusual messages can occasionally be misclassified.

**Rendering:**
- Urdu-script responses render right-to-left with the Noto Nastaliq Urdu font.
- English and Roman Urdu responses render left-to-right with the app's normal body font.
- Each chat message is rendered with its own direction/font based on its detected language, independent of the app's UI language.
- Copilot responses support a practical subset of markdown — paragraphs, bullet/numbered lists, headings, bold/italic/inline code — rendered without a full markdown library or `dangerouslySetInnerHTML`.

**Error/loading handling:** while waiting for a response the UI shows a "thinking" state; if Gemini is unavailable the backend returns `502` and the frontend shows a localized "Copilot is unavailable, try again" message rather than crashing.

**What the Copilot cannot do:** it cannot create, update, or delete financial records, and it never calculates or overrides the Financial Health Score — that value always comes from the backend's Score Engine.

---

## Dashboard Analytics

All dashboard metrics are **backend-data-driven** — every number is derived from the authenticated user's own stored data via `GET /api/users/{user_id}/dashboard` (plus two secondary calls: `GET /api/users/{user_id}/score` for factors/suggestions, and `GET /api/users/{user_id}/financial-data` for the profile's last-updated timestamp). Nothing on the dashboard is mocked or hard-coded.

| Metric | Represents | Data source | Calculated where | If data is missing |
|---|---|---|---|---|
| Income | Monthly income | `FinancialProfile.monthly_income` | Backend (stored value) | Dashboard shows an empty state prompting the user to add financial data |
| Savings | Monthly savings | `FinancialProfile.monthly_savings` | Backend (stored value) | Same as above |
| Total Expenses | Sum of all expense categories | `Expense` rows for the user | Frontend sums the `expenses` array returned by the dashboard endpoint | Shown as 0; "no expenses" empty state shown in the breakdown chart if the list is empty |
| Savings Rate | `monthly_savings / monthly_income` | Derived from the two fields above | Frontend (display-only derivation; not returned as a field by the API) | `null`/omitted if income is 0 |
| Financial Score | 0–100 deterministic score | `Score Engine` (`calculate_score`), recomputed on each dashboard load | Backend | The dashboard requires a goal and expenses to exist; if either is missing, the endpoint returns `404` and the frontend shows the "add financial data" empty state |
| Expense Breakdown | Per-category share of spending | `Expense` rows | Backend returns the raw list; frontend renders the chart | Chart shows a "no expense data yet" empty state |
| Income vs Expenses | Current-period income vs. total expenses vs. savings | Same fields as above | Frontend | Renders with zeros; no separate empty state |
| Savings / Goal Progress | Remaining after expenses, and progress toward the goal | `FinancialProfile` + `Goal`, progress calculated as `(monthly_savings × 12) / target_amount`, capped at 100% | Backend calculates `progress_percent` and `estimated_months_remaining`; frontend calculates the "remaining after expenses" figure | If no goal exists the dashboard endpoint 404s (see Financial Score row) |
| Recent Activity | List of recent account events | Two events only: "score recalculated" (`calculated_at` from the dashboard response) and "profile updated" (`updated_at` from the financial-data endpoint) | Frontend assembles the list from the two API responses above | Shows a "no recent activity yet" empty state if neither timestamp is available |

**Important limitation:** there is **no historical/multi-period chart**. "Income vs Expenses" is a **current-period comparison** (this month's income vs. this month's tracked expenses), not a trend over time, because the data model only stores the current `monthly_income`/`monthly_savings`/expense snapshot — it does not keep a history of past months. "Recent Activity" is similarly limited to the two timestamps described above, not a full audit log.

**Authenticated-user scoping:** every dashboard/score/financial-data/goal endpoint requires a valid JWT and verifies that the requested `user_id` belongs to the authenticated caller (`403 Forbidden` otherwise) — a user can only ever see their own data.

---

## API Reference

Base path: `/api` (auth endpoints are mounted at `/auth`, outside the `/api` prefix). All responses use `{ "data": ... }` on success or `{ "error": { "code", "message" } }` on failure.

| Method | Route | Auth required | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | No | Create an account (`full_name`, `email`, `password`) |
| POST | `/auth/login` | No | Log in with email/password, returns a JWT (`access_token`) |
| GET | `/auth/me` | Yes | Return the caller's account info, including the linked financial profile's `user_id` if one exists |
| GET | `/api/health` | No | Health check |
| POST | `/api/users` | Yes | Create the financial profile for the authenticated account (idempotent — returns the existing profile if one already exists) |
| POST | `/api/users/{user_id}/financial-data` | Yes | Create/replace income, savings, and expenses (upsert) |
| GET | `/api/users/{user_id}/financial-data` | Yes | Retrieve stored income, savings, and expenses |
| POST | `/api/users/{user_id}/goal` | Yes | Create/replace the user's one financial goal |
| GET | `/api/users/{user_id}/goal` | Yes | Retrieve the goal with calculated progress |
| GET | `/api/users/{user_id}/score` | Yes | Get the calculated Financial Health Score, factors, and an AI-generated explanation/suggestions |
| POST | `/api/users/{user_id}/simulate` | Yes | Run a What-If simulation for one changed expense category (nothing is saved) |
| POST | `/api/users/{user_id}/copilot/ask` | Yes | Ask the AI Copilot a question (optionally with recent conversation history) |
| GET | `/api/users/{user_id}/dashboard` | Yes | Get everything the dashboard needs in one call |

Every `{user_id}`-scoped route verifies the JWT identifies the account that owns that financial profile — a mismatched `user_id` returns `403 Forbidden`, even for `GET` requests.

**Error codes used across the API:** `400` (malformed request), `401` (missing/invalid JWT), `403` (JWT valid but doesn't own this `user_id`), `404` (resource doesn't exist yet — e.g. no financial data submitted), `422` (validation failure), `500` (unexpected backend error), `502` (Gemini unavailable — for `/score`, the numeric score/factors are still returned with a default non-AI explanation; for `/copilot/ask`, the whole request fails).

See `docs/API_CONTRACT.md` for full request/response bodies, field-level validation limits, and worked examples.

---

## Architecture

```
User
 │
 ▼
React Frontend  (pages/, components/, hooks/, store/, api/)
 │  Axios, JWT attached from localStorage
 ▼
FastAPI Backend
 │  routes/  →  schemas/ (validation)  →  services/ (business logic)
 │
 ├── SQLModel/SQLite  (models/: User, FinancialProfile, Expense, Goal, ScoreResult)
 │                    (app/auth.py: self-contained auth_users table + JWT)
 │
 └── Gemini client  (services/gemini_client.py, copilot_context.py,
                      copilot_service.py, language_detect.py)
```

- **Frontend → Backend**: the frontend never talks to SQLite or Gemini directly; every request goes through the FastAPI API, with the JWT attached by an Axios interceptor.
- **Score Engine** (`services/score_engine.py`) and **What-If Engine** (`services/what_if_engine.py`) are pure, deterministic Python — the What-If engine reuses the Score Engine's exact calculation so simulated and real scores are always computed the same way.
- **AI integration** (`services/gemini_client.py`, `copilot_context.py`, `copilot_service.py`, `language_detect.py`) is a separate layer: it assembles context from the database (read-only), builds the prompt, and calls Gemini. Gemini has no database access and cannot modify records.
- **Authentication** (`app/auth.py`) is a self-contained module with its own SQLAlchemy engine bound to the same SQLite file, its own `auth_users` table, and a `get_current_user` dependency used by every protected route. The financial-profile `User` model links to it via a nullable, uniquely-indexed `auth_user_id` column.

See `docs/ARCHITECTURE.md` for full component responsibilities and data-flow diagrams.

---

## Authentication

- **Signup** (`POST /auth/signup`): full name, email, password (min. 8 characters) → creates an `auth_users` row with a bcrypt-hashed password.
- **Login** (`POST /auth/login`): email + password → returns a JWT `access_token` (HS256, expires after `ACCESS_TOKEN_EXPIRE_MINUTES`, default 60).
- **Session persistence**: the frontend stores the token and account info in `localStorage` and restores the session on app load (`useSessionRestore`); a `401` response from any API call clears the stored session and redirects to login.
- **Route protection**: `ProtectedRoute` redirects unauthenticated users to `/login`; `GuestOnlyRoute` redirects already-authenticated users away from `/login`/`/register`.
- **Authorization**: every financial-data endpoint checks that the JWT's account actually owns the requested `user_id` (`403` otherwise) — this is enforced server-side, not just hidden in the UI.
- **One financial profile per account**: enforced both at the application level and by a partial unique database index on `users.auth_user_id`.
- Environment variables involved: `AUTH_SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES` (see [Environment Variables](#environment-variables) — no values are reproduced here).

---

## Theme

The approved theme is emerald/teal with restrained gold accents, implemented as CSS custom properties in `frontend/src/index.css`, consumed by Tailwind utility classes and inline `var(--token)` references.

**Dark mode**

| Token | Value |
|---|---|
| Background | `#020F0D` |
| Sidebar | `#061A17` |
| Card | `#0E2925` |
| Card Hover | `#123B35` |
| Primary Emerald | `#00D1B2` |
| Bright Teal | `#00E6C3` |
| Dark Green | `#062B24` |
| Primary Text | `#F5FFFC` |
| Secondary Text | `#8DB9AE` |
| Border | `#174A41` |
| Gold | `#FACC15` |
| Danger | `#FF6B6B` |

**Light mode**

| Token | Value |
|---|---|
| Background | `#F8FBF9` |
| Sidebar | `#FFFFFF` |
| Card | `#FFFFFF` |
| Card Hover | `#F1FAF5` |
| Primary Green | `#1B5E3B` |
| Accent Lime | `#A7F3A0` |
| Light Green | `#DDF7E2` |
| Primary Text | `#082A20` |
| Secondary Text | `#4E8172` |
| Border | `#C8E3D8` |
| Gold | `#D9A514` |
| Danger | `#FF6B6B` |

- **Modes:** light, dark, or system — chosen via the Settings page (`ThemeToggle`) or defaults to `system` on first load.
- **Persistence:** stored in `localStorage` (`afc_theme_mode`) and re-applied on load.
- **System mode:** listens for OS-level `prefers-color-scheme` changes while the app is open (`useSystemThemeListener`) and re-applies immediately, not just on next reload.
- **Architecture:** CSS variables are defined once in `:root` (light) and overridden under `.dark`/`[data-theme='dark']`; Tailwind's `ink-*` color scale and component classes reference these variables (plus `*-rgb` variants for opacity-aware usages), so components never hard-code hex values directly.

---

## Animation & Transitions

Design principle: animations are subtle, smooth, and responsive rather than decorative or distracting.

Implemented:
- **Page transitions** — a fade + slide-up entrance, re-triggered on every route change (`PageTransition`, keyed by pathname).
- **Scroll reveal** — landing-page sections fade/slide in once they enter the viewport, via a single-use `IntersectionObserver` per element (`ScrollReveal`).
- **Score ring animation** — the score ring animates from 0 up to the real score value on mount/change (`ScoreRing`), rather than snapping to the final value.
- **Chart animations** — Recharts-driven fade/grow animations on the expense breakdown and income-vs-expenses charts, and staggered fade-in on dashboard KPI cards.
- **Card/button/input transitions** — background, color, border, shadow, and transform transitions on interactive elements.
- **Mobile menu / accordion-style transitions** — the mobile nav panel animates open/closed via a `grid-template-rows` transition.
- **Theme transitions** — background/text/border color transitions when switching light/dark.
- **Reduced-motion support** — a global `prefers-reduced-motion: reduce` media query collapses all CSS animation/transition durations to near-zero; a matching `usePrefersReducedMotion` hook disables JS-driven animations (score ring count-up, chart animation, scroll-reveal) for users who asked for less motion.

**Not implemented:** a landing-page FAQ section/accordion does not currently exist in the codebase (see [Landing Page](#landing-page)).

---

## Landing Page

The current landing page (`frontend/src/pages/LandingPage.tsx`), synchronized with the navbar's anchor links, contains these sections in order:

1. **Hero** — headline, subtext, primary/secondary CTAs, hero visual.
2. **Features** (`#features`) — five feature cards: Financial Health Score, AI Copilot, What-If Simulator, Financial Insights, Goals.
3. **How It Works** (`#how-it-works`) — four-step walkthrough: add financial info → analyze → get insights → ask Copilot / simulate.
4. **Financial Health Score showcase** (`#score`).
5. **AI Copilot showcase** (`#copilot`) — includes example prompt chips.
6. **What-If Simulator showcase** (`#simulator`).
7. **Final CTA** — headline + "Get started" button.
8. **Footer**.

There is currently **no FAQ section** on the landing page. The navbar's anchor links (`#features`, `#how-it-works`, `#score`, `#copilot`, `#simulator`) match these section ids exactly, so navigating from the navbar scrolls to the correct section (with `scroll-margin-top` applied so content isn't hidden under the sticky navbar).

---

## Internationalization

**UI language** (interface labels, button text, headings) is distinct from **AI language** (what the Copilot and score explanations are generated in):

| | Controls | Values | Where it lives |
|---|---|---|---|
| UI language | Static interface text throughout the app | `en`, `ur` | Redux `language` slice, persisted to `localStorage` (`afc_language`), switched instantly via Settings/`LanguageSwitcher` |
| AI language | What the Copilot replies in, per message | `en`, `roman-ur`, `ur` | Detected per-message from the actual text (see [AI Financial Copilot — Behavior](#ai-financial-copilot--behavior)); independent of the UI language toggle above |
| Account language (legacy) | Default language used for the Financial Health Score's AI-generated `explanation`/`suggestions` | `en`, `ur` | Set once at signup (`FinancialProfile` owner's `User.language`), not user-editable afterward in Settings |

- **Supported UI languages:** English and Urdu, via a flat key→string dictionary (`frontend/src/utils/i18n.ts`); no external i18n framework is used.
- **RTL behavior:** setting the UI language to Urdu sets `document.documentElement.dir = 'rtl'` and `lang = 'ur'`; CSS rules under `[dir='rtl']` switch to the Noto Nastaliq Urdu font, adjust line-height, and force numeric/tabular values back to LTR so numbers still read correctly inside RTL text.
- **Persistence:** the UI language choice is stored in `localStorage` (`afc_language`) and reapplied on load.
- **Roman Urdu** is only ever an *AI response* language, detected per Copilot message — it is not one of the two selectable UI languages, since the interface labels themselves are only translated into English and Urdu script.

---

## Responsive Design

The layout has been designed and visually verified across common breakpoints — desktop, laptop, tablet, and mobile widths (1440, 1280, 1024, 768, 480, and 375px) — using Tailwind's responsive utility classes throughout (sidebar collapses to a mobile menu, grid layouts reflow from multi-column to single-column, etc.). This reflects layout design intent and manual verification during development; it is not a substitute for automated cross-device/cross-browser test coverage, which does not currently exist in this project (see [Known Limitations](#known-limitations)).

---

## Setup Instructions

### Prerequisites
- Python 3.11+ (for FastAPI/SQLModel)
- Node.js 20+ and npm (for the Vite/React frontend)
- A Google Gemini API key (for the AI Copilot and score explanations — the app still runs without one, but those two features will fail/fall back)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt --break-system-packages   # if using a system Python without a venv
# or: python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

cp .env.example .env
# then edit .env and set at minimum:
#   AUTH_SECRET_KEY=<a real random secret, not the placeholder>
#   GEMINI_API_KEY=<your Gemini API key>

uvicorn app.main:app --reload
```

The API serves on `http://localhost:8000` by default. On first run it creates `financial_copilot.db` (SQLite) and its tables automatically (no separate migration step is required).

**Test dependencies:** the backend's `test_*.py` files use `pytest` and FastAPI's `TestClient` (which requires `httpx`). Neither is currently pinned in `requirements.txt` — install them separately if you want to run the test suite:

```bash
pip install pytest httpx --break-system-packages
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL defaults to http://localhost:8000 — change only if your backend runs elsewhere

npm run dev
```

The app serves on Vite's default dev port (typically `http://localhost:5173`).

### Development Commands

| Command | Where | Purpose |
|---|---|---|
| `uvicorn app.main:app --reload` | `backend/` | Run the API with hot reload |
| `pytest` | `backend/` | Run the backend test suite (requires `pytest`/`httpx` — see above) |
| `npm run dev` | `frontend/` | Run the Vite dev server with HMR |
| `npm run build` | `frontend/` | Type-check (`tsc -b`) then production-build the frontend |
| `npm run lint` | `frontend/` | Run `oxlint` over the frontend source |
| `npm run preview` | `frontend/` | Preview the production build locally |

---

## Environment Variables

**Backend** (`backend/.env`, see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `APP_NAME` | Application display name |
| `APP_ENV` | Environment label (`development`, etc.) |
| `DEBUG` | Debug flag |
| `DATABASE_URL` | SQLite connection string |
| `AUTH_SECRET_KEY` | JWT signing secret — **must** be changed from the placeholder in any real deployment |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime in minutes |
| `FRONTEND_URL` | Comma-separated allowed CORS origin(s) — no wildcard is ever used |
| `GEMINI_API_KEY` | Google Gemini API key (Copilot + score explanations) |
| `GEMINI_MODEL` | Gemini model name (defaults to `gemini-2.5-flash`) |

**Frontend** (`frontend/.env`, see `frontend/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL the frontend calls for the backend API |

No secret values are reproduced in this document — only variable names and their purpose, per the values above never being filled in with real credentials.

---

## Database

- **Technology:** SQLite, accessed via SQLModel (financial data) and a separate SQLAlchemy engine bound to the same file (authentication — see `app/auth.py`'s module docstring for why it's self-contained).
- **Entities:**
  - `auth_users` — `id`, `full_name`, `email` (unique), `hashed_password`, `created_at`. Owns zero or one financial profile.
  - `users` (financial profile) — `id`, `created_at`, `language` (`en`/`ur`, set at creation), `auth_user_id` (nullable FK to `auth_users`, uniquely indexed so one account can own at most one financial profile).
  - `financial_profiles` — `id`, `user_id`, `monthly_income`, `monthly_savings`, `updated_at`.
  - `expenses` — `id`, `user_id`, `category`, `amount`. One row per category per user (not a transaction ledger).
  - `goals` — `id`, `user_id`, `target_amount`, `description` (optional), `created_at`. Exactly one goal per user.
  - `score_results` — `id`, `user_id`, `score_value`, `calculated_at`, `factors_summary` (JSON string) — the one calculated value the app stores, so the dashboard doesn't need to recompute the score just to show its history.
- **Migrations:** additive, idempotent migrations run at startup (`create_db_and_tables`) — e.g. adding the `auth_user_id` column and its unique index to an existing database — rather than a separate migrations framework/tool.
- **Seed data:** none — the app has no seeding step; every account starts with no financial profile until it completes signup and submits financial data.
- **What powers dashboard analytics:** exclusively `financial_profiles`, `expenses`, and `goals` (read fresh on every dashboard load), plus the latest `score_results` row for factor/suggestion detail — see [Dashboard Analytics](#dashboard-analytics).

See `docs/DATA_MODEL.md` for full field-level detail.

---

## Deployment

No deployment configuration (Dockerfiles, CI/CD pipelines, hosting configuration) currently exists in this repository. Running the app today means running the backend (`uvicorn`) and frontend (`npm run dev` / `npm run build` + a static host) as separate processes, pointed at each other via `FRONTEND_URL` (backend CORS) and `VITE_API_BASE_URL` (frontend API base). Deploying to a real environment would require adding this configuration; it is not invented here.

---

## Known Limitations

- **No historical financial data.** The app stores only the current income/savings/expense snapshot per user, not a time series — so "Income vs Expenses" is a current-period comparison, not a trend chart, and there is no month-over-month history anywhere in the dashboard.
- **AI provider dependency.** The Copilot and the score's plain-language explanation depend on Google Gemini being reachable and configured (`GEMINI_API_KEY`). If Gemini is unavailable: the score endpoint still returns the numeric score/factors with a simple non-AI fallback explanation; the Copilot endpoint fails outright with `502`.
- **Language detection is a heuristic, not a guarantee.** Roman Urdu vs. English classification for the Copilot uses a small hand-built word list and a dominance threshold — very short, unusual, or heavily code-mixed messages can occasionally be classified into the wrong language.
- **Single goal per user.** The data model supports exactly one financial goal per user; there is no way to track multiple concurrent goals.
- **No automated tests for the frontend.** Only the backend has an automated test suite (`pytest`); there is no frontend unit/integration/E2E test tooling configured.
- **Backend test dependencies aren't pinned.** `pytest` and `httpx` (required by the existing `test_*.py` files) are not listed in `backend/requirements.txt` — install them manually to run the suite.
- **No deployment configuration.** See [Deployment](#deployment) above.
- **No password reset or email verification.** Signup/login is email + password only, with no recovery flow.

---

## Success Criteria

- Full flow works end-to-end: sign up → add financial data → set a goal → view score → run a what-if simulation → ask the Copilot → view the dashboard.
- The Copilot visibly grounds its answers in the user's own numbers, in whichever language (English, Roman Urdu, or Urdu script) the user actually writes in.
- The Financial Health Score is explainable — a user can see exactly which factors (savings rate, expense ratio, goal progress) are helping or hurting it.
- The What-If Simulator's before/after comparison is clear within seconds, without ever touching the user's real stored data until they explicitly re-save it.

---

Built as an AI-powered financial decision-support tool, originally for the Al Khidmat x Alibaba Cloud AI Hackathon (Open Innovation Track); the implemented AI provider is Google Gemini.
