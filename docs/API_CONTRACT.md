# AI Financial Copilot — API Contract

## 1. Purpose

This document defines the exact communication contract between the frontend, the FastAPI backend, and the AI (Gemini) integration for the AI Financial Copilot MVP. It exists so the frontend and backend developers on the team can work independently, and so AI coding agents (e.g. OpenCode) have one unambiguous reference for request/response shapes. It is based only on the finalized `PRD.md`, `ARCHITECTURE.md`, and `DATA_MODEL.md`.

---

## 2. API Principles

- Small number of endpoints — one per clear responsibility.
- Simple, flat request/response bodies — no deep nesting unless genuinely needed.
- The backend is the only source of truth for the Financial Health Score and What-If results; Gemini never calculates them.
- The frontend never calls Gemini directly — every AI call goes through the backend.
- No endpoint permanently changes stored data as a side effect of a "what-if" or "explain" action.
- Practical for a 4-person hackathon team and for AI coding agents to implement quickly.

---

## 3. Base API Structure

- Base path: `/api` (no versioning prefix, e.g. no `/v1/`) — a single hackathon MVP does not need API versioning. If the project continues past the hackathon, versioning can be introduced later.
- All endpoints return JSON.
- Resource-oriented paths, scoped under the authenticated caller's own financial profile: `/api/users/{user_id}/...` (see Section 4 — `{user_id}` must belong to the caller).

---

## 4. Authentication

**This section is superseded by the JWT-based authentication added in the IDOR security fix. The paragraph below describing "no real authentication" reflects the original hackathon MVP design and is kept only for history — it no longer describes the current API.**

The current, authoritative behavior:

- `POST /auth/signup` and `POST /auth/login` (see `app/auth.py`) create a real account (`full_name`, `email`, `password`) and issue a JWT access token (`POST /auth/login` → `{ "access_token": "...", "token_type": "bearer" }`).
- Every `/api/users/...` endpoint below **requires** a valid JWT sent as `Authorization: Bearer <token>`. Missing, malformed, expired, or invalid-signature tokens all return `401`.
- Each authenticated account owns at most one financial profile (`users.auth_user_id`, enforced by a database-level unique index in addition to the application-level check). `POST /api/users` is idempotent per account: calling it again returns the account's existing profile instead of creating a duplicate.
- Every request to a `{user_id}`-scoped endpoint is checked against the caller's own account: a `user_id` that does not belong to the authenticated caller returns `403`, even for read-only `GET` requests. Knowing another account's `user_id` grants no access.
- `GET /auth/me` returns the caller's own account info, including `financial_user_id` (the `user_id` of the financial profile this account owns, or `null` if none has been created yet). The frontend uses this — not only its local `localStorage` cache — to recover the correct profile on a new browser/device.

---

## 4a. CORS

The API restricts cross-origin requests to explicitly configured frontend origin(s) — there is no wildcard (`*`) origin in any environment.

- Configured via the `FRONTEND_URL` environment variable (comma-separated for more than one origin), e.g. `FRONTEND_URL=http://localhost:5173` for local development, or `FRONTEND_URL=https://app.example.com,https://staging.example.com` for a deployment that needs to allow more than one origin.
- Defaults to `http://localhost:5173` (the local Vite dev server) if unset.
- `allow_credentials` is `False` — authentication is a manually-attached `Authorization` header, not a browser-managed cookie, so credentialed CORS is not needed.
- A disallowed origin's preflight (`OPTIONS`) request is rejected with `400`, and actual requests from a disallowed origin receive no `Access-Control-Allow-Origin` header (so browsers block the response from being read by page JS), even though the server still processes the request.

---

## 4b. Input Validation Limits

All financial numeric fields are validated server-side with both a lower and an upper bound (Pydantic `Field(ge=..., le=...)`). Bounding above also rejects `NaN` and `Infinity` for free, since neither compares as `<=` any finite number.

| Field | Endpoint(s) | Lower bound | Upper bound |
|---|---|---|---|
| `monthly_income`, `monthly_savings`, `expenses[].amount` | `POST /api/users/{user_id}/financial-data` | `>= 0` | `<= 100,000,000` |
| `new_amount` | `POST /api/users/{user_id}/simulate` | `>= 0` | `<= 100,000,000` |
| `target_amount` | `POST /api/users/{user_id}/goal` | `> 0` | `<= 1,000,000,000` |

Values outside these bounds, or malformed/non-numeric input, return `422` with a `VALIDATION_ERROR` response — never a crash or an unhandled exception.

---

## 5. Endpoint Overview

| Method | Endpoint | Purpose | MVP Feature |
|---|---|---|---|
| POST | /auth/signup | Create an account (full name, email, password) | Authentication |
| POST | /auth/login | Log in, returns a JWT access token | Authentication |
| GET | /auth/me | Get the caller's account info + linked financial profile id | Authentication |
| POST | /api/users | Create the financial profile for the authenticated account (idempotent) | Language support / session setup |
| POST | /api/users/{user_id}/financial-data | Create or replace the user's financial profile and expenses | Financial Data Input |
| GET | /api/users/{user_id}/financial-data | Retrieve the user's stored financial profile and expenses | Financial Data Input / Dashboard |
| GET | /api/users/{user_id}/score | Get the current Financial Health Score (calculated + explained) | Financial Health Score |
| POST | /api/users/{user_id}/simulate | Run a What-If simulation for a changed expense | What-If Simulator |
| POST | /api/users/{user_id}/goal | Create or replace the user's financial goal | Financial Goals |
| GET | /api/users/{user_id}/goal | Retrieve the user's goal and progress | Financial Goals / Dashboard |
| POST | /api/users/{user_id}/copilot/ask | Ask the AI Copilot a question | AI Copilot |
| GET | /api/users/{user_id}/dashboard | Get all data needed for the Dashboard in one call | Dashboard |

---

## 6. Financial Data Endpoints

### 6.1 Create/Update Financial Data

#### Endpoint
`POST /api/users/{user_id}/financial-data`

#### Purpose
Stores (or replaces) the user's income, savings, and expenses in one call. Matches the "Financial Profile + Expenses" entities in `DATA_MODEL.md`.

#### Request
```json
{
  "monthly_income": 80000,
  "monthly_savings": 10000,
  "expenses": [
    { "category": "food", "amount": 20000 },
    { "category": "rent", "amount": 25000 },
    { "category": "transport", "amount": 8000 },
    { "category": "bills", "amount": 7000 }
  ]
}
```

#### Response
```json
{
  "data": {
    "monthly_income": 80000,
    "monthly_savings": 10000,
    "expenses": [
      { "category": "food", "amount": 20000 },
      { "category": "rent", "amount": 25000 },
      { "category": "transport", "amount": 8000 },
      { "category": "bills", "amount": 7000 }
    ],
    "updated_at": "2026-08-28T12:00:00Z"
  }
}
```

#### Success Status
`200 OK` (data replaced) — this endpoint acts as an upsert: it creates the record on first call and replaces it on later calls, so the frontend doesn't need separate create/update logic.

#### Error Statuses
`400 Bad Request` (invalid input), `404 Not Found` (unknown user_id), `422 Unprocessable Entity` (validation failure)

#### Validation Rules
- `monthly_income` and `monthly_savings` must be ≥ 0.
- `expenses` must contain at least one entry.
- Each expense `amount` must be ≥ 0 and `category` must be non-empty text.

---

### 6.2 Get Financial Data

#### Endpoint
`GET /api/users/{user_id}/financial-data`

#### Purpose
Retrieves the user's currently stored income, savings, and expenses.

#### Request
No body.

#### Response
Same shape as Section 6.1's response.

#### Success Status
`200 OK`

#### Error Statuses
`404 Not Found` (unknown user_id, or no financial data submitted yet)

#### Validation Rules
None (read-only).

---

## 7. Financial Health Score Endpoint

#### Endpoint
`GET /api/users/{user_id}/score`

#### Purpose
Returns the user's current Financial Health Score, the contributing factors, and improvement suggestions. The backend's deterministic Score Engine (`ARCHITECTURE.md` Section 7) calculates the score from the stored Financial Profile and Expenses; Gemini is only used to phrase the explanation and suggestions in plain language, in the user's selected language.

#### Request
No body. Requires that financial data (Section 6.1) has already been submitted.

#### Response
```json
{
  "data": {
    "score": 72,
    "factors": [
      { "name": "savings_rate", "impact": "positive" },
      { "name": "food_spending", "impact": "negative" }
    ],
    "explanation": "Your score is 72 because your savings rate is healthy, but food spending is higher than usual.",
    "suggestions": [
      "Reducing food spending by 10% could raise your score.",
      "Consider increasing your monthly savings if possible."
    ],
    "calculated_at": "2026-08-28T12:00:00Z"
  }
}
```

#### Success Status
`200 OK`

#### Error Statuses
`404 Not Found` (no financial data submitted yet), `500 Internal Server Error` (calculation failure), `502 Bad Gateway` (Gemini unavailable — score and factors are still returned; only the phrased explanation/suggestions may fall back to a simple default, per `ARCHITECTURE.md` Section 14)

#### Notes
- **Finalized scoring formula** (0–100): Savings Rate (40 pts), Expense Control (35 pts), Goal Progress (25 pts). See `ARCHITECTURE.md` Section 7 for exact thresholds and scoring rules.
- The score is always calculated by the backend. The AI never determines or overrides `score`.

---

## 8. What-If Simulator Endpoint

#### Endpoint
`POST /api/users/{user_id}/simulate`

#### Purpose
Calculates the effect of a hypothetical expense change on savings, score, and goal progress — without saving anything, unless the user explicitly applies the result (Section 8.2).

#### Request
```json
{
  "category": "food",
  "new_amount": 15000
}
```

This represents **Temporary Simulation Data** — it is not written to the Expense table.

#### Response
```json
{
  "data": {
    "current": {
      "monthly_savings": 10000,
      "score": 72,
      "goal_progress_percent": 40
    },
    "simulated": {
      "monthly_savings": 15000,
      "score": 78,
      "goal_progress_percent": 55
    }
  }
}
```

The `current` block reflects **Current Data** (as stored); the `simulated` block reflects the hypothetical outcome if `category`'s amount were changed to `new_amount`. Nothing is persisted by this call.

#### Success Status
`200 OK`

#### Error Statuses
`400 Bad Request` (invalid category or amount), `404 Not Found` (no financial data or goal set yet), `422 Unprocessable Entity` (validation failure)

#### Validation Rules
- `category` must match an existing expense category for that user.
- `new_amount` must be ≥ 0.

#### 8.2 Applying a Simulation (Optional Action)
If the user chooses to keep a simulated change, the frontend calls the existing `POST /api/users/{user_id}/financial-data` (Section 6.1) with the updated expense amount. No separate "apply" endpoint is needed — this matches `DATA_MODEL.md` Section 10, which treats "applying" a what-if as a normal expense update, not a new entity or endpoint.

---

## 9. Financial Goals Endpoints

### 9.1 Create/Update Goal

#### Endpoint
`POST /api/users/{user_id}/goal`

#### Purpose
Stores (or replaces) the user's one financial goal, matching the single-goal design in `DATA_MODEL.md` Section 8.

#### Request
```json
{
  "target_amount": 200000,
  "description": "Emergency fund"
}
```

#### Response
```json
{
  "data": {
    "target_amount": 200000,
    "description": "Emergency fund",
    "created_at": "2026-08-28T12:00:00Z"
  }
}
```

#### Success Status
`200 OK` (upsert, same pattern as Section 6.1)

#### Error Statuses
`400 Bad Request`, `404 Not Found` (unknown user_id), `422 Unprocessable Entity`

#### Validation Rules
- `target_amount` must be > 0.
- `description` is optional text.

---

### 9.2 Get Goal (with Progress)

#### Endpoint
`GET /api/users/{user_id}/goal`

#### Purpose
Retrieves the goal along with calculated progress (progress is computed on request, not stored — per `DATA_MODEL.md` Section 8).

#### Request
No body.

#### Response
```json
{
  "data": {
    "target_amount": 200000,
    "description": "Emergency fund",
    "progress_percent": 40,
    "estimated_months_remaining": 19
  }
}
```

#### Success Status
`200 OK`

#### Error Statuses
`404 Not Found` (no goal set yet)

#### Validation Rules
None (read-only).

---

## 10. AI Copilot Endpoint

#### Endpoint
`POST /api/users/{user_id}/copilot/ask`

#### Flow
```
Frontend
   |
   v
FastAPI Backend
   |
   v
Retrieve relevant user financial context (from SQLite)
   |
   v
Gemini
   |
   v
Backend
   |
   v
Frontend
```

### Request
What the frontend sends:
```json
{
  "question": "Can I afford to save more this month?",
  "history": [
    { "role": "user", "content": "Meri income kitni hai?" },
    { "role": "assistant", "content": "Aap ki monthly income 80,000 hai." }
  ]
}
```
`history` is optional (omittable for older clients/single-turn callers) and holds up to the 20 most recent prior turns, oldest first, **not** including the current `question`. It gives the model real multi-turn context (e.g. resolving "is mein se" back to an amount mentioned earlier) and gives the language detector a fallback signal for short/ambiguous follow-ups like "haan" or "ok".

The frontend does **not** send financial data — the backend retrieves it from SQLite itself, ensuring the AI never receives more than the backend decides to share.

### Backend Context
What the backend may include when calling Gemini (assembled server-side, per `DATA_MODEL.md` Section 11):
- `monthly_income`, `monthly_savings`
- relevant expense categories/amounts
- goal `target_amount` and calculated `progress_percent`
- latest `score` and `factors`
- the user's `language`

Only the fields relevant to the question are included — the backend does not send the user's entire record on every call.

### AI Response
What the backend returns to the frontend:
```json
{
  "data": {
    "answer": "Based on your current savings of 10,000/month, you could increase savings by reducing food spending, which is currently above average.",
    "language": "en"
  }
}
```
`language` is one of `"en"`, `"roman-ur"`, or `"ur"` — the language actually **detected from the user's current message** (and, for short/ambiguous messages, the preceding turn), not the account's stored UI/profile language. The frontend uses this value to set that message's text direction (RTL for `"ur"`, LTR otherwise) and font.

### Language
Before calling Gemini, the backend runs the user's current message (and, if needed, the last turn of `history`) through a lightweight heuristic language detector (`app/services/language_detect.py`) to determine whether it's English, Roman Urdu, or Urdu script. That detected language — **not** the account's stored `language` preference — is what the backend instructs Gemini to reply in. The account's stored `language` (set at `POST /api/users`) is used only as the last-resort default when a message carries no detectable signal at all (e.g. the very first message in a brand-new conversation). This means a user can switch between English, Roman Urdu, and Urdu script freely within the same conversation and get an answer in kind — no separate endpoint or request field per language is needed.

### Success Status
`200 OK`

### Error Statuses
`400 Bad Request` (empty question), `404 Not Found` (no financial data yet, so no context exists), `502 Bad Gateway` (Gemini unavailable — return a friendly fallback message per `ARCHITECTURE.md` Section 14)

### Rules
- The frontend must never call Gemini directly; this endpoint is the only path.
- The Gemini API key stays on the backend and is never exposed in requests or responses.
- The AI Copilot cannot create, update, or delete any financial record — this endpoint is read-context-in, text-out only.
- The AI does not calculate or return a `score` value here — score always comes from `GET /api/users/{user_id}/score`.

---

## 11. Dashboard Endpoint

#### Endpoint
`GET /api/users/{user_id}/dashboard`

#### Purpose
Returns everything the Dashboard screen needs in a single call, instead of the frontend making several small requests.

#### Request
No body.

#### Response
```json
{
  "data": {
    "score": 72,
    "monthly_income": 80000,
    "monthly_savings": 10000,
    "expenses": [
      { "category": "food", "amount": 20000 },
      { "category": "rent", "amount": 25000 }
    ],
    "goal": {
      "target_amount": 200000,
      "description": "Emergency fund",
      "progress_percent": 40
    },
    "language": "en"
  }
}
```

#### Success Status
`200 OK`

#### Error Statuses
`404 Not Found` (no financial data submitted yet)

#### Notes
This reuses the same underlying data as Sections 6, 7, and 9 — it does not introduce new stored fields, only a combined read.

---

## 12. Language Support

- The financial profile's `language` (`"en"` or `"ur"`) is set once, when the profile is created (`POST /api/users`), and stored on the User entity per `DATA_MODEL.md` Section 12. It is used as: (a) the default language for the score's `explanation`/`suggestions` (Section 7), and (b) the last-resort fallback for Copilot language detection when a message has no detectable signal of its own (Section 10).
- The Copilot's actual reply language (`"en"` | `"roman-ur"` | `"ur"`, Section 10) is detected **per message** from the message's own text, independent of this stored preference — this is the one place a third language variant (Roman Urdu) exists, since it is a Copilot-response-only concept, not a selectable UI language.
- No endpoint is duplicated per language — the same endpoints serve all languages.
- UI label translation (button text, headings, etc.) is handled entirely on the frontend via a simple dictionary, per `ARCHITECTURE.md` Section 12 — it is not part of this API, and it only ever chooses between English and Urdu (never Roman Urdu, which is Latin-script Urdu, not a distinct interface language).

---

## 13. Common Response Format

**Success:**
```json
{
  "data": { ... }
}
```

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "monthly_income must be zero or greater"
  }
}
```

Every endpoint in this contract uses one of these two shapes — no endpoint-specific wrapper formats.

---

## 14. HTTP Status Codes

| Code | Meaning | Used When |
|---|---|---|
| 200 | OK | Successful read, or successful upsert (create/replace) |
| 201 | Created | Reserved for `POST /api/users` (a genuinely new resource) |
| 400 | Bad Request | Malformed request body |
| 401 | Unauthorized | Missing, malformed, expired, or invalid-signature JWT |
| 403 | Forbidden | Valid JWT, but the authenticated account does not own the requested `user_id` |
| 404 | Not Found | Unknown user_id, or requested resource doesn't exist yet (e.g. no financial data submitted) |
| 422 | Unprocessable Entity | Body is well-formed but fails validation rules (e.g. negative amount, or a value outside the bounds in Section 4b) |
| 500 | Internal Server Error | Unexpected backend/database failure |
| 502 | Bad Gateway | Gemini (AI service) call failed or timed out |

No other status codes are used — this keeps error handling predictable for the frontend.

---

## 15. Validation Rules

Based on `DATA_MODEL.md` Section 13, with upper bounds added per Section 4b of this document:

- `monthly_income`, `monthly_savings`: numeric, `0 <= x <= 100,000,000`.
- Expense `amount`: numeric, `0 <= x <= 100,000,000`. Expense `category`: non-empty text.
- Goal `target_amount`: numeric, `0 < x <= 1,000,000,000`.
- `language`: must be `"en"` or `"ur"`.
- `copilot/ask` `question`: non-empty text.
- `simulate` `new_amount`: numeric, `0 <= x <= 100,000,000`; `category` must match an existing expense.

---

## 16. Error Handling

| Situation | Handling |
|---|---|
| Invalid input (e.g. negative amount) | `422` with a clear `message` naming the field |
| Missing required data (e.g. score requested before financial data exists) | `404` with a message telling the user what to submit first |
| Resource not found (unknown user_id) | `404` |
| Database failure | `500`, generic message, error logged server-side |
| AI service failure (Gemini timeout/unavailable) | `502` for the Copilot endpoint; for the Score endpoint, still return the calculated score with a simple default explanation instead of failing the whole request |
| Invalid simulation input | `400` or `422`, depending on whether the body is malformed or just fails a rule |

---

## 17. Security Rules

- The Gemini API key is stored in a backend environment variable and never appears in any request or response.
- All incoming data is validated server-side (Section 15), not just on the frontend.
- The Copilot endpoint sends Gemini only the specific context fields needed to answer the question (Section 10) — never the full financial record.
- No endpoint allows the AI response to write back to the database; only the endpoints in Sections 6 and 9 (both driven by explicit user action) can change stored financial data.
- No real financial credentials (bank logins, card numbers) are ever accepted by any endpoint, since none are part of the data model.

---

## 18. Frontend ↔ Backend Contract

| Frontend Action | API Endpoint | Request | Response |
|---|---|---|---|
| Sign up | POST /auth/signup | full_name, email, password | created account |
| Log in | POST /auth/login | email, password | `{ "access_token": "...", "token_type": "bearer" }` |
| Restore/verify session | GET /auth/me | — (JWT header) | account info + linked `financial_user_id` |
| Start session / pick language | POST /api/users | `{ "language": "en" }` | `{ "data": { "user_id": 1, "language": "en" } }` |
| Submit/edit financial data | POST /api/users/{user_id}/financial-data | income, savings, expenses | stored financial data |
| Load financial data (e.g. edit screen) | GET /api/users/{user_id}/financial-data | — | stored financial data |
| View Financial Health Score | GET /api/users/{user_id}/score | — | score, factors, explanation, suggestions |
| Adjust an expense in What-If Simulator | POST /api/users/{user_id}/simulate | category, new_amount | current vs. simulated results |
| Set/edit financial goal | POST /api/users/{user_id}/goal | target_amount, description | stored goal |
| View goal + progress | GET /api/users/{user_id}/goal | — | goal + progress_percent |
| Ask the Copilot a question | POST /api/users/{user_id}/copilot/ask | question | answer, language |
| Load the Dashboard | GET /api/users/{user_id}/dashboard | — | score, financial summary, goal, language |

---

## 19. Backend ↔ AI Contract

```
Frontend
   |
   v
FastAPI
   |
   v
Financial Context
(income, savings, relevant expenses,
 goal + progress, latest score + factors,
 language — assembled server-side)
   |
   v
Gemini
   |
   v
FastAPI
   |
   v
Frontend
```

- **Backend sends to Gemini:** the user's question (Copilot) or the calculated score/factors (Score explanation), plus only the financial context fields relevant to that request, plus the target language.
- **Backend expects back:** plain natural-language text (an answer, or an explanation + suggestions) — never a numeric score, and never a financial data mutation.
- Gemini has no database access and no ability to call other backend endpoints; it only receives what the backend sends in the prompt and returns text.

---

## 20. API Endpoint Summary

| Method | Endpoint | Purpose | Priority |
|---|---|---|---|
| POST | /auth/signup | Create an account | MUST |
| POST | /auth/login | Log in, issue a JWT | MUST |
| GET | /auth/me | Get caller's account + linked financial profile id | MUST |
| POST | /api/users | Create the authenticated account's financial profile + language | MUST |
| POST | /api/users/{user_id}/financial-data | Create/update financial profile + expenses | MUST |
| GET | /api/users/{user_id}/financial-data | Retrieve financial profile + expenses | MUST |
| GET | /api/users/{user_id}/score | Get Financial Health Score + explanation | MUST |
| POST | /api/users/{user_id}/simulate | Run What-If simulation | MUST |
| POST | /api/users/{user_id}/goal | Create/update financial goal | MUST |
| GET | /api/users/{user_id}/goal | Get goal + progress | MUST |
| POST | /api/users/{user_id}/copilot/ask | Ask AI Copilot a question | MUST |
| GET | /api/users/{user_id}/dashboard | Get combined dashboard data | MUST |
