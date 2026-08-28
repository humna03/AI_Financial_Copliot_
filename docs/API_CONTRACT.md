# AI Financial Copilot — API Contract

## 1. Purpose

This document defines the exact communication contract between the frontend, the FastAPI backend, and the AI (Qwen) integration for the AI Financial Copilot MVP. It exists so the frontend and backend developers on the team can work independently, and so AI coding agents (e.g. OpenCode) have one unambiguous reference for request/response shapes. It is based only on the finalized `PRD.md`, `ARCHITECTURE.md`, and `DATA_MODEL.md`.

---

## 2. API Principles

- Small number of endpoints — one per clear responsibility.
- Simple, flat request/response bodies — no deep nesting unless genuinely needed.
- The backend is the only source of truth for the Financial Health Score and What-If results; Qwen never calculates them.
- The frontend never calls Qwen directly — every AI call goes through the backend.
- No endpoint permanently changes stored data as a side effect of a "what-if" or "explain" action.
- Practical for a 4-person hackathon team and for AI coding agents to implement quickly.

---

## 3. Base API Structure

- Base path: `/api` (no versioning prefix, e.g. no `/v1/`) — a single hackathon MVP does not need API versioning. If the project continues past the hackathon, versioning can be introduced later.
- All endpoints return JSON.
- Resource-oriented paths, scoped under a demo user: `/api/users/{user_id}/...`

---

## 4. Authentication

Per `PRD.md` (Section 8) and `ARCHITECTURE.md` (Section 15), the MVP does not require a real authentication system.

- No login, password, or token-based auth is implemented.
- A lightweight **demo user identity** is created once per session via `POST /api/users` (see Section 6), and its `user_id` is used on all subsequent requests.
- This is not security — it is only a way to keep one demo user's data separate from another's during testing/judging. No sensitive credentials are involved.

---

## 5. Endpoint Overview

| Method | Endpoint | Purpose | MVP Feature |
|---|---|---|---|
| POST | /api/users | Create a demo user with a language preference | Language support / session setup |
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
Returns the user's current Financial Health Score, the contributing factors, and improvement suggestions. The backend's deterministic Score Engine (`ARCHITECTURE.md` Section 7) calculates the score from the stored Financial Profile and Expenses; Qwen is only used to phrase the explanation and suggestions in plain language, in the user's selected language.

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
`404 Not Found` (no financial data submitted yet), `500 Internal Server Error` (calculation failure), `502 Bad Gateway` (Qwen unavailable — score and factors are still returned; only the phrased explanation/suggestions may fall back to a simple default, per `ARCHITECTURE.md` Section 14)

#### Notes
- **Exact scoring formula: Decision Required.** `DATA_MODEL.md` (Section 9) and `PRD.md` (Section 6.2) leave the precise formula/weights to be finalized by the team before development. This endpoint's contract (score + factors + explanation) does not depend on the exact formula chosen.
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
Qwen / Alibaba Cloud
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
  "question": "Can I afford to save more this month?"
}
```
The frontend does **not** send financial data — the backend retrieves it from SQLite itself, ensuring the AI never receives more than the backend decides to share.

### Backend Context
What the backend may include when calling Qwen (assembled server-side, per `DATA_MODEL.md` Section 11):
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

### Language
The backend passes the user's stored `language` preference (from the User entity) to Qwen as part of the prompt, so `answer` is generated directly in English or Urdu — no separate translation step or duplicate endpoint per language.

### Success Status
`200 OK`

### Error Statuses
`400 Bad Request` (empty question), `404 Not Found` (no financial data yet, so no context exists), `502 Bad Gateway` (Qwen unavailable — return a friendly fallback message per `ARCHITECTURE.md` Section 14)

### Rules
- The frontend must never call Qwen directly; this endpoint is the only path.
- The Qwen API key stays on the backend and is never exposed in requests or responses.
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

- Language (`"en"` or `"ur"`) is set once, when the demo user is created (`POST /api/users`), and stored on the User entity per `DATA_MODEL.md` Section 12.
- No endpoint is duplicated per language — the same endpoints serve both languages.
- Any endpoint that returns natural-language text generated by Qwen (currently: the score `explanation`/`suggestions` in Section 7, and the Copilot `answer` in Section 10) uses the user's stored language automatically.
- UI label translation (button text, headings, etc.) is handled entirely on the frontend via a simple dictionary, per `ARCHITECTURE.md` Section 12 — it is not part of this API.

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
| 404 | Not Found | Unknown user_id, or requested resource doesn't exist yet (e.g. no financial data submitted) |
| 422 | Unprocessable Entity | Body is well-formed but fails validation rules (e.g. negative amount) |
| 500 | Internal Server Error | Unexpected backend/database failure |
| 502 | Bad Gateway | Qwen (AI service) call failed or timed out |

No other status codes are used — this keeps error handling predictable for the frontend.

---

## 15. Validation Rules

Based on `DATA_MODEL.md` Section 13:

- `monthly_income`, `monthly_savings`: numeric, ≥ 0.
- Expense `amount`: numeric, ≥ 0. Expense `category`: non-empty text.
- Goal `target_amount`: numeric, > 0.
- `language`: must be `"en"` or `"ur"`.
- `copilot/ask` `question`: non-empty text.
- `simulate` `new_amount`: numeric, ≥ 0; `category` must match an existing expense.

---

## 16. Error Handling

| Situation | Handling |
|---|---|
| Invalid input (e.g. negative amount) | `422` with a clear `message` naming the field |
| Missing required data (e.g. score requested before financial data exists) | `404` with a message telling the user what to submit first |
| Resource not found (unknown user_id) | `404` |
| Database failure | `500`, generic message, error logged server-side |
| AI service failure (Qwen timeout/unavailable) | `502` for the Copilot endpoint; for the Score endpoint, still return the calculated score with a simple default explanation instead of failing the whole request |
| Invalid simulation input | `400` or `422`, depending on whether the body is malformed or just fails a rule |

---

## 17. Security Rules

- The Qwen/Alibaba Cloud API key is stored in a backend environment variable and never appears in any request or response.
- All incoming data is validated server-side (Section 15), not just on the frontend.
- The Copilot endpoint sends Qwen only the specific context fields needed to answer the question (Section 10) — never the full financial record.
- No endpoint allows the AI response to write back to the database; only the endpoints in Sections 6 and 9 (both driven by explicit user action) can change stored financial data.
- No real financial credentials (bank logins, card numbers) are ever accepted by any endpoint, since none are part of the data model.

---

## 18. Frontend ↔ Backend Contract

| Frontend Action | API Endpoint | Request | Response |
|---|---|---|---|
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
Qwen
   |
   v
FastAPI
   |
   v
Frontend
```

- **Backend sends to Qwen:** the user's question (Copilot) or the calculated score/factors (Score explanation), plus only the financial context fields relevant to that request, plus the target language.
- **Backend expects back:** plain natural-language text (an answer, or an explanation + suggestions) — never a numeric score, and never a financial data mutation.
- Qwen has no database access and no ability to call other backend endpoints; it only receives what the backend sends in the prompt and returns text.

---

## 20. API Endpoint Summary

| Method | Endpoint | Purpose | Priority |
|---|---|---|---|
| POST | /api/users | Create demo user + language | MUST |
| POST | /api/users/{user_id}/financial-data | Create/update financial profile + expenses | MUST |
| GET | /api/users/{user_id}/financial-data | Retrieve financial profile + expenses | MUST |
| GET | /api/users/{user_id}/score | Get Financial Health Score + explanation | MUST |
| POST | /api/users/{user_id}/simulate | Run What-If simulation | MUST |
| POST | /api/users/{user_id}/goal | Create/update financial goal | MUST |
| GET | /api/users/{user_id}/goal | Get goal + progress | MUST |
| POST | /api/users/{user_id}/copilot/ask | Ask AI Copilot a question | MUST |
| GET | /api/users/{user_id}/dashboard | Get combined dashboard data | MUST |
