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

**This section has been superseded in part by the real authentication system added after the original MVP design (see `AuthUser` below and the note that follows this table). The rest of the table remains accurate.**

| Entity | Purpose | Required for MVP |
|---|---|---|
| AuthUser (`auth_users` table) | Real login account: full name, email, bcrypt-hashed password. Owns zero or one Financial Profile | Yes (added post-MVP) |
| User (Financial Profile owner, `users` table) | Identifies whose financial data a given record belongs to; now linked to exactly one `AuthUser` via `auth_user_id` | Yes |
| Financial Profile | Holds the user's income and savings | Yes |
| Expense | Holds one expense line (category + amount) belonging to a user | Yes |
| Goal | Holds the user's one financial goal (e.g. savings target) | Yes |
| Score Result | Holds the most recently calculated Financial Health Score, so the Dashboard can load it without recalculating every time | Yes |

No other entities (e.g. committee/BC data, transactions, notifications) are included — they belong to Optional/Future features that are not part of this build.

**Note on "User" (updated):** PRD Section 8's original exclusion of complex authentication described the *initial* hackathon design. A real authentication system was added afterward (see `app/auth.py`): a separate `auth_users` table stores `full_name`, `email` (unique), and a bcrypt-hashed password, and issues JWTs on login. The financial-profile `User` entity (`users` table) is distinct from `AuthUser` — it still holds only financial-profile data (`language`, timestamps) — but now carries a nullable `auth_user_id` column, uniquely indexed so at most one financial profile can belong to any given login account. A `User` row with `auth_user_id = NULL` has no verified owner and is denied by every ownership check; this only occurs for rows created before the auth system existed. No password or credential fields exist on the `User` (financial profile) entity itself — those live only on `AuthUser`.

---

## 4. Entity Relationships

```
AuthUser (auth_users table — login account)
 |
 +--- User (financial profile owner, at most one, via users.auth_user_id)
       |
       +--- Financial Profile   (one per user: income, savings)
       |
       +--- Expenses            (many per user: category + amount)
       |
       +--- Goal                (one per user: target amount, description)
       |
       +--- Score Result         (latest calculated score for that user)
```

Each Expense, the Financial Profile, the Goal, and the Score Result all belong to exactly one `User`. Each `User` belongs to at most one `AuthUser` (enforced by a partial unique index on `users.auth_user_id`, so `NULL` — an unowned/legacy row — is never treated as a collision). There are no other relationships in this MVP (e.g. no relationships between expenses, no shared/multi-user data, no user owning more than one financial profile).

---

## 5. Detailed Entity Definitions

### 5.0 AuthUser (`auth_users` table)

| Field | Type | Required? | Description |
|---|---|---|---|
| id | INTEGER (PK) | Required | Unique identifier for the login account |
| full_name | TEXT | Required | Account holder's name |
| email | TEXT (unique, indexed) | Required | Login email — enforced unique at the database level |
| hashed_password | TEXT | Required | Bcrypt hash of the account's password; the plaintext password is never stored |
| created_at | TEXT (ISO datetime) | Required | When the account was created |

*Stored values only.* Lives in a table managed independently by `app/auth.py` (see that module's docstring for why), in the same SQLite database file as everything else in this document.

### 5.1 User (Financial Profile owner, `users` table)

| Field | Type | Required? | Description |
|---|---|---|---|
| id | INTEGER (PK) | Required | Unique identifier for the financial profile |
| created_at | TEXT (ISO datetime) | Required | When this financial-profile record was created |
| language | TEXT ("en" or "ur") | Required | Language selected when the profile was created; used as the default for the Score endpoint's AI explanation and as a last-resort fallback for Copilot language detection (see Section 12) |
| auth_user_id | INTEGER (FK → AuthUser, nullable, uniquely indexed) | Optional | The login account that owns this financial profile. `NULL` means no verified owner (only possible for rows predating the auth system); a non-NULL value must be unique across all `User` rows, so one account can own at most one financial profile |

*Stored values.* No calculated fields.

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

- The Financial Health Score is **always calculated deterministically by the backend Score Engine** from raw user data. It is never calculated or modified by Gemini.
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
| **Sent to Gemini as temporary context** | Only the specific fields relevant to the user's question — typically: income, savings, relevant expense categories, goal target/progress, and the latest score value + factors |

- The backend assembles this context fresh for each Copilot request; nothing about the AI call is persisted back into SQLite as a side effect.
- The AI Copilot **only reads** context provided by the backend — it has no direct database access and **cannot create, update, or delete** any financial record. Any advice it gives is text output only, displayed by the frontend.

---

## 12. Language Data

- Profile language preference (`"en"` or `"ur"`) is stored **once per user**, on the `User` entity — not duplicated onto every financial record.
- Financial data (income, expenses, goals) is language-neutral — numbers don't need translation, only labels and Copilot text do.
- UI labels are handled by a simple translation dictionary in the frontend (per `ARCHITECTURE.md` Section 12), not by duplicating data in the database.
- **The stored `language` field is not what determines the Copilot's reply language.** The backend detects the Copilot's reply language (`"en"`, `"roman-ur"`, or `"ur"`) fresh, per message, from the actual text of the user's current question (and, for short/ambiguous messages, the previous conversation turn) — see `app/services/language_detect.py`. The stored `User.language` field is used only as (a) the default language for the Score endpoint's AI explanation, and (b) the last-resort fallback when a Copilot message has no detectable language signal of its own. Roman Urdu (`"roman-ur"`) is never stored anywhere — it exists only as a per-message Copilot-response classification, not as a value of the stored `language` field.

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

- **Database:** SQLite (confirmed, per PRD Section 12 / Architecture Section 10), one file shared by both the financial-data tables and the `auth_users` table.
- **Access layer:** SQLModel for the financial-data tables (`users`, `financial_profiles`, `expenses`, `goals`, `score_results`), each with a simple foreign key back to `users`. `app/auth.py` uses a separate, self-contained SQLAlchemy engine/session for `auth_users`, bound to the same database file, so the auth module can be added/removed without touching the financial-data models.
- **No** PostgreSQL, MongoDB, Redis, caching layers, or data warehouses are needed — the entire dataset for one user is tiny and fits comfortably in SQLite.
- **Migrations:** no external migrations framework (e.g. Alembic) is used. Instead, `create_db_and_tables()` (`app/database.py`) runs additive, idempotent steps at startup: create any missing tables, add the `auth_user_id` column to `users` if it's missing (for databases created before the auth system existed), deduplicate any pre-existing multiple-profiles-per-account rows, then create the partial unique index on `auth_user_id`. This keeps a single schema-creation step sufficient even across the auth system being added after the original tables existed.
- Table/column design (exact SQLModel classes, indexes) beyond what's described in Section 5 is left to the source code.

---

## 15. Data Privacy

- Never store API keys or secrets in the database (they belong in environment variables, per `ARCHITECTURE.md` Section 15).
- Never store bank passwords, card numbers, or any real payment credentials — none are collected in the first place. The only password-like value stored anywhere is the bcrypt **hash** of a login account's password (`auth_users.hashed_password`); the plaintext password itself is never persisted.
- Only collect the financial data actually required by the four MVP features (Sections 6–9 above), plus the login credentials required for real authentication (Section 3).
- Only send the specific fields Gemini needs to answer a given question — never the full database record (Section 11), and never any `AuthUser` field (email, password hash) at all.

---

## 16. MVP Data Model Summary

| Entity | Why We Need It | MVP Priority |
|---|---|---|
| AuthUser | Real login account (email + hashed password); owns a financial profile | Essential (added post-MVP) |
| User | Groups one person's financial data together; carries profile language preference and links to its owning AuthUser | Essential |
| Financial Profile | Income and savings — needed by Score Engine, Simulator, Copilot | Essential |
| Expense | Category spending — needed by Score Engine, Simulator, Copilot | Essential |
| Goal | Powers goal progress on Dashboard and in What-If Simulator | Essential |
| Score Result | Stores latest score so Dashboard loads without recalculating | Essential |
