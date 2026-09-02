# AI Financial Copilot — Data Model

## 1. Purpose

This document defines the minimum data model needed to implement the AI Financial Copilot MVP. It exists so the team stores exactly the data the four core features (Financial Health Score, AI Copilot, What-If Simulator, Dashboard) actually need — nothing more — and so AI coding agents (e.g. OpenCode) have one clear reference for what belongs in SQLite. It is based only on the finalized `PRD.md` and `ARCHITECTURE.md`.

---

## 2. Data Model Goals

- Simple — as few tables and fields as possible.
- Minimal — only data the MVP features actually use.
- Easy to implement — buildable quickly with SQLModel/Pydantic.
- Easy to understand — clear for both technical and non-technical teammates.
- Suitable for SQLite — no features SQLite can't easily support.
- Suitable for FastAPI — maps cleanly to request/response schemas.
- Suitable for AI-assisted development — unambiguous boundaries for coding agents to follow.

---

## 3. Data Entities

| Entity | Purpose | Required for MVP |
|---|---|---|
| User (Demo Session) | Identifies whose financial data a given record belongs to, so data isn't mixed between demo users | Yes |
| Financial Profile | Holds the user's income, savings, and language preference | Yes |
| Expense | Holds one expense line (category + amount) belonging to a user | Yes |
| Goal | Holds the user's one financial goal (e.g. savings target) | Yes |
| Score Result | Holds the most recently calculated Financial Health Score, so the Dashboard can load it without recalculating every time | Yes |

No other entities (e.g. committee/BC data, transactions, notifications) are included — they belong to Optional/Future features that are not part of this build.

**Note on "User":** PRD Section 8 excludes complex authentication. "User" here does not mean a login system — it is the simplest possible identifier (e.g. a generated demo user/session ID) used only to group one person's financial data together in SQLite. No password or credential fields exist on this entity.

---

## 4. Entity Relationships

```
User
 |
 +--- Financial Profile   (one per user: income, savings, language)
 |
 +--- Expenses            (many per user: category + amount)
 |
 +--- Goal                (one per user: target amount, description)
 |
 +--- Score Result         (latest calculated score for that user)
```

Each Expense, the Financial Profile, the Goal, and the Score Result all belong to exactly one User. There are no other relationships in this MVP (e.g. no relationships between expenses, no shared/multi-user data).

---

## 5. Detailed Entity Definitions

### 5.1 User

| Field | Type | Required? | Description |
|---|---|---|---|
| id | INTEGER (PK) | Required | Unique identifier for the demo user/session |
| created_at | TEXT (ISO datetime) | Required | When this demo user record was created |
| language | TEXT ("en" or "ur") | Required | Selected language; stored here since it applies to everything the user sees (see Section 12) |

*Stored value.* No calculated fields.

### 5.2 Financial Profile

| Field | Type | Required? | Description |
|---|---|---|---|
| id | INTEGER (PK) | Required | Unique identifier |
| user_id | INTEGER (FK → User) | Required | Owner of this profile |
| monthly_income | REAL | Required | User's stated monthly income |
| monthly_savings | REAL | Required | User's stated current monthly savings |
| updated_at | TEXT (ISO datetime) | Required | Last time the profile was edited |

*All stored values* — these are raw inputs the Score Engine and Copilot need; they cannot be calculated from anything else.

### 5.3 Expense

| Field | Type | Required? | Description |
|---|---|---|---|
| id | INTEGER (PK) | Required | Unique identifier |
| user_id | INTEGER (FK → User) | Required | Owner of this expense |
| category | TEXT | Required | One of the basic categories from PRD Section 11 (e.g. food, rent, transport, bills, other) |
| amount | REAL | Required | Monthly amount for this category |

*Stored value.* Kept as one row per category per user — not a full transaction ledger (see Section 7).

### 5.4 Goal

| Field | Type | Required? | Description |
|---|---|---|---|
| id | INTEGER (PK) | Required | Unique identifier |
| user_id | INTEGER (FK → User) | Required | Owner of this goal |
| target_amount | REAL | Required | The savings target the user is working toward |
| description | TEXT | Optional | Short label for the goal (e.g. "Emergency fund"), for display only |
| created_at | TEXT (ISO datetime) | Required | When the goal was set |

*Stored value.* Goal **progress** (e.g. % complete) is a **calculated value** — derived at request time from `monthly_savings` and `target_amount` — and is not stored (see Section 8).

### 5.5 Score Result

| Field | Type | Required? | Description |
|---|---|---|---|
| id | INTEGER (PK) | Required | Unique identifier |
| user_id | INTEGER (FK → User) | Required | Owner of this score |
| score_value | INTEGER | Required | The calculated Financial Health Score (e.g. 0–100) |
| calculated_at | TEXT (ISO datetime) | Required | When this score was calculated |
| factors_summary | TEXT (JSON) | Required | The contributing factors used to reach this score, stored so the Dashboard can show "why" without recalculating |

*Stored calculated value* — this is the one calculated result the MVP stores, and only for Dashboard performance (so the score doesn't need to be recomputed on every page load). See Section 9 for why this is the one exception to "don't store what can be calculated."

---

## 6. Financial Data

The application only needs the data required to run the four MVP features:

- **Monthly income** and **monthly savings** (Financial Profile) — needed for the Score Engine, What-If Simulator, and Copilot context.
- **Expenses by category** (Expense) — needed for the Score Engine, What-If Simulator, and Copilot context.
- **One financial goal** (Goal) — needed for goal progress on the Dashboard and in the What-If Simulator.

The application does **not** collect or store:
- Bank account credentials
- Credit/debit card numbers
- Live bank transactions
- Any real payment information

This matches PRD Section 8 (no live bank integration, no real transactions) and Section 15 of `ARCHITECTURE.md`.

---

## 7. Expense Data

Expenses are stored as **one row per category per user** (e.g. one row for "food", one for "rent"), matching the basic categories in PRD Section 11 (food, rent, transport, bills, and similar). This is enough to power the Score Engine, the What-If Simulator (which adjusts one category's amount), and Copilot context.

This is intentionally **not** a transaction-level system — there are no individual purchase records, timestamps per purchase, merchant names, or recurring-transaction logic. That level of detail is unnecessary for the MVP and would belong to a full accounting/expense-tracking product, which is out of scope.

---

## 8. Financial Goals

The Goal entity stores only what's needed for the MVP:
- `target_amount` — the number the user is working toward.
- `description` — an optional label, for display only.

**Goal progress** (e.g. "60% of the way there" or "3 months to reach your goal at current savings rate") is **calculated on request**, using `monthly_savings` from the Financial Profile and `target_amount` from the Goal. It is not stored, because it changes every time the profile or expenses change and is cheap to recompute — storing it would risk it going stale.

This same calculation is what the What-If Simulator re-runs with a hypothetical `monthly_savings` value (see Section 10).

---

## 9. Financial Health Score Data

Three kinds of values are involved:

| Kind | Examples | Stored? |
|---|---|---|
| Raw user data | monthly_income, monthly_savings, expenses by category | Yes — in Financial Profile / Expense |
| Calculated values | goal progress, What-If results, score components | No — calculated on request |
| Score-related values | score_value, factors_summary | Yes — in Score Result, as the one stored calculated value (for Dashboard performance) |

- The Financial Health Score is **always calculated deterministically by the backend Score Engine** from raw user data. It is never calculated or modified by Qwen.
- The **scoring formula has been finalized** by the team. It combines three components (Savings Rate 40 pts, Expense Control 35 pts, Goal Progress 25 pts = 100 max). See `ARCHITECTURE.md` Section 7 for the exact thresholds.
- **Goal Progress calculation:** `progress_percent = (annual_savings / target_amount) × 100`, where `annual_savings = monthly_savings × 12`, capped at 100%. This is calculated on request from `monthly_savings` (Financial Profile) and `target_amount` (Goal) — no additional stored field is required for the current MVP.
- Whenever the Financial Profile or Expenses change, the backend should recalculate the score and write a new `Score Result` row (or update the existing one) so the Dashboard always reflects current data.

---

## 10. What-If Simulator Data

The What-If Simulator does **not** need its own database table. It works entirely in memory, per request:

```
Current financial data (Financial Profile + Expenses, read from SQLite)
        +
Temporary changed expense (sent in the request, not saved)
        ↓
   Recalculate (same Score Engine logic as Section 9)
        ↓
Show result: new savings, new score, new goal progress
```

Because the PRD does not require saved/named scenarios (that would be a Future Idea, not part of this MVP), no `Scenario` table is created. If the user chooses to actually apply a What-If result, that is a normal update to the existing `Expense` row — not a new entity.

---

## 11. AI Copilot Data Context

| | |
|---|---|
| **Stored in SQLite** | Financial Profile, Expenses, Goal, latest Score Result |
| **Sent to Qwen as temporary context** | Only the specific fields relevant to the user's question — typically: income, savings, relevant expense categories, goal target/progress, and the latest score value + factors |

- The backend assembles this context fresh for each Copilot request; nothing about the AI call is persisted back into SQLite as a side effect.
- The AI Copilot **only reads** context provided by the backend — it has no direct database access and **cannot create, update, or delete** any financial record. Any advice it gives is text output only, displayed by the frontend.

---

## 12. Language Data

- Language preference (`"en"` or `"ur"`) is stored **once per user**, on the `User` entity — not duplicated onto every financial record.
- Financial data (income, expenses, goals) is language-neutral — numbers don't need translation, only labels and Copilot text do.
- UI labels are handled by a simple translation dictionary in the frontend (per `ARCHITECTURE.md` Section 12), not by duplicating data in the database.
- When calling Qwen, the backend passes the user's stored language preference so the Copilot answers in the right language — no separate data model impact beyond the one `language` field.

---

## 13. Validation Rules

- `monthly_income` and `monthly_savings` must be zero or positive numbers.
- `amount` on Expense must be zero or positive (no negative expenses).
- `target_amount` on Goal must be a positive number.
- `category` on Expense must be non-empty text.
- `language` must be one of the two supported values (`"en"`, `"ur"`).
- Required fields (income, at least one expense, a goal) cannot be empty before a score can be calculated.

This is not a full API validation spec — detailed request/response validation belongs in `API_CONTRACT.md`.

---

## 14. Database Design

- **Database:** SQLite (confirmed, per PRD Section 12 / Architecture Section 10).
- **Access layer:** SQLModel (or plain SQLAlchemy/`sqlite3`) is sufficient — five small tables (User, Financial Profile, Expense, Goal, Score Result), each with a simple foreign key back to User.
- **No** PostgreSQL, MongoDB, Redis, caching layers, or data warehouses are needed — the entire dataset for a demo user is tiny and fits comfortably in SQLite.
- **No** migrations tooling is required for the hackathon; a single schema creation step at app startup is enough.
- Table/column design (exact SQLModel classes, indexes, migrations) is intentionally left for implementation, not this document.

---

## 15. Data Privacy

- Never store API keys or secrets in the database (they belong in environment variables, per `ARCHITECTURE.md` Section 15).
- Never store bank passwords, card numbers, or any real payment credentials — none are collected in the first place.
- Only collect the financial data actually required by the four MVP features (Sections 6–9 above).
- Only send the specific fields Qwen needs to answer a given question — never the full database record (Section 11).

---

## 16. MVP Data Model Summary

| Entity | Why We Need It | MVP Priority |
|---|---|---|
| User | Groups one person's data together; carries language preference | Essential |
| Financial Profile | Income and savings — needed by Score Engine, Simulator, Copilot | Essential |
| Expense | Category spending — needed by Score Engine, Simulator, Copilot | Essential |
| Goal | Powers goal progress on Dashboard and in What-If Simulator | Essential |
| Score Result | Stores latest score so Dashboard loads without recalculating | Essential |
