# AI Financial Copilot
### Product Requirements Document (PRD) — Hackathon MVP
*Domain: Financial Inclusion | Team of 4 | Pakistan*

---

## 1. Product Overview

**AI Financial Copilot** is a hackathon MVP that helps people in Pakistan understand and improve their financial health.

Most existing finance apps (banking apps, JazzCash, Easypaisa, etc.) only show what already happened — past transactions, balances, and charts. Our app goes one step further: it tells users **how healthy their finances are, why, and what to do next**, and lets them test financial decisions before making them in real life.

The MVP has three core parts:
1. A **Financial Health Score** with a clear explanation.
2. An **AI Copilot** that gives personal, data-aware financial advice.
3. A **What-If Simulator** that shows the effect of a spending change instantly.

Everything works in **Urdu and English**, since this is a Pakistan-focused product.

---

## 2. Problem

People can already send money, pay bills, and see their transaction history. What they **can't** easily do is answer two simple questions:

**A. "Am I financially healthy?"**
Users know their income and expenses, but have no simple way to judge their overall financial condition, or what's dragging it down.

**B. "What will happen if I keep spending like this — and what should I change?"**
Users see the past, not the future. They don't know how a small change (like spending less on food) would actually affect their savings or their goals.

These two problems are connected: a user first needs to understand where they stand (the score), and then needs help deciding what to do about it (the Copilot and simulator).

---

## 3. Target Users

| Priority | User | Why they need this |
|---|---|---|
| **Primary** | Salaried / young working people in Pakistan | Fixed income, want to understand spending and save more, but lack tools that explain their financial condition |
| **Secondary** | Freelancers and gig workers | Irregular income, could benefit from the same core tools; an income-smoothing mode is a possible add-on if time allows |

The MVP uses **one core product flow** for all users. It does not build separate journeys per user type.

---

## 4. Proposed Solution

| Component | What it does |
|---|---|
| **Financial Health Score** | A transparent, formula-based score (e.g. 72/100) calculated from income, expenses, and savings — with a plain-language reason and improvement tips |
| **AI Copilot** | A chat assistant that uses the user's own financial numbers to answer budgeting, saving, and spending questions — not a generic chatbot |
| **What-If Simulator** | Lets a user change an expense and instantly see the effect on savings, score, and goal progress |
| **Urdu + English** | The whole experience, including the Copilot's answers, works in either language |

AI is used where it adds real value (explaining the score, holding a contextual conversation) — not for the scoring itself, since a transparent formula is more realistic and more explainable for a hackathon demo.

---

## 5. Core Value / USP

Our USP is **not** "an AI financial chatbot."

> AI Financial Copilot understands a user's financial health, explains it clearly, helps them see what their spending choices lead to, and lets them test decisions safely before making them — all in Urdu or English.

We are positioning this as an **AI Financial Decision Support tool**, not another expense tracker.

---

## 6. MVP Features (Must Have)

These are the only features required for a strong, working hackathon demo. If we finish only this list, we still have a complete product.

### 6.1 Financial Data Input
- Manual entry of financial data (income, expenses by category, savings, one goal).
- Optional: uploading a simple sample/mock financial statement, if time allows. Manual entry alone is sufficient for the demo and must not be blocked by the upload feature.
- No live bank integration required.
- Data is stored in **SQLite** for the duration of the demo (see Section 12).

### 6.2 Financial Health Score
- A simple score (0–100) from a transparent, rule-based formula.
- Shows the main contributing factors, the reason for the score, and 1–2 improvement suggestions.
- The formula has three components: Savings Rate (40 points), Expense Control (35 points), and Goal Progress (25 points). The exact thresholds and scoring rules are defined in `ARCHITECTURE.md` Section 7.
- Score is deterministic and explainable — not an ML model.

### 6.3 AI Copilot
- A contextual chat that uses the user's actual income/expense data.
- Answers budgeting, saving, spending, and goal-related questions, and gives simple risk warnings (e.g. "your food spending is unusually high this month").
- The Copilot explains and advises; it never calculates the Financial Health Score itself and never edits the user's financial data.

### 6.4 What-If Simulator
- User adjusts a chosen expense (e.g. food) and instantly sees the effect on:
  - monthly savings
  - Financial Health Score
  - goal progress
- All effects are calculated deterministically by the backend, using the same formula as the Financial Health Score.
- This is the core "wow" moment of the demo — it must be fast and visually clear.

### 6.5 Urdu + English Support
- User picks a language at the start.
- The UI **and** the Copilot's answers work in the selected language (not just translated labels).

### 6.6 Simple Dashboard
Shows, in one clean screen:
- Financial Health Score
- Savings summary
- Key spending info
- Financial goal
- Entry points to the Copilot and the What-If Simulator

---

## 7. Optional Features (Add Only If Time Remains)

Build the Must-Have list first. Only attempt these if there is genuine time left before the deadline — none of them are required for a complete project. Optional features must never block or delay any Must-Have feature.

- **Committee (BC/ROSCA) Trust Score** — a simple, transparent score based on mock payment history, showing how reliably a member pays into a savings committee. If included: no real lending, no real transactions, no AI fraud model — just a clear rule (e.g. based on on-time payment %).
- **Irregular Income Mode** — a smoothed budget suggestion for freelancers/gig workers based on average income.
- **Simple proactive spending warning** — a one-off example alert (e.g. "spending 30% above usual this week").
- **Financial Future/Twin projection** — a simple chart projecting current habits 6–12 months forward.
- **Basic gamification** — a simple streak or badge for staying within budget.
- **Sample statement upload** (from 6.1) — if manual entry alone is not enough time to also support file upload, upload can be deferred here.

---

## 8. Out of Scope (Not Part of This MVP)

To keep the project realistic for a 4-person team in hackathon time, the following are explicitly **not** built:

- Live bank API integrations
- Real money transfers, real lending, or any real financial transactions
- Production-level or ML-based fraud detection
- Peer-to-peer lending marketplace
- Large-scale recommendation engine
- Any ML model that needs training data we don't have
- Complex authentication systems (unless trivially needed for the demo)
- Large-scale notification infrastructure
- Support for regional languages beyond Urdu and English
- Advanced gamification
- Enterprise-level scalability, uptime, or encryption standards

These may become **Future Ideas** (Section 16), but they are not promises for this build.

---

## 9. User Flow

The main demo story, start to finish:

1. User opens the app.
2. User selects Urdu or English.
3. User enters sample financial data (manual entry; upload if time allows).
4. App calculates the Financial Health Score.
5. User sees the score and the reasons behind it.
6. User sees improvement suggestions.
7. User opens the AI Copilot and asks a financial question.
8. Copilot answers using the user's actual data.
9. User opens the What-If Simulator.
10. User changes an expense value.
11. App instantly shows the effect on savings and score.
12. User sees how the change affects their financial goal.

This single flow is the entire demo — we are not building multiple parallel user journeys.

---

## 10. AI Usage

AI is used in exactly two places, both chosen because they add real value:

| Where | How |
|---|---|
| **AI Copilot** | Uses Qwen (via Alibaba Cloud, per hackathon track requirements) with the user's financial data passed in as context, so answers are personal and grounded in real numbers |
| **Financial Health Score explanations** | The score itself comes from a transparent formula (not an ML model, since we don't have labelled training data); AI is used to turn the calculated factors into a simple, readable explanation and suggestions |

We are **not** claiming AI/ML where a simple formula does the job. The backend always calculates the score and the What-If results; AI is never used to decide or override them. This keeps the score explainable and trustworthy for the demo.

---

## 11. Data Requirements

The MVP uses **mock, manually entered, or sample** financial data only — no real bank connection.

Minimum data needed:
- Income
- Expenses (with basic categories, e.g. food, rent, transport, bills)
- Savings
- One financial goal (e.g. a savings target)

Additional data (e.g. committee payment history) is only collected if an optional feature actually needs it.

---

## 12. Technology Overview (Confirmed)

| Layer | Technology | Purpose | Status |
|---|---|---|---|
| Backend / API | Python + FastAPI | Connects frontend, Copilot, and scoring logic | **Confirmed** |
| Database | SQLite | Stores user financial data, score results, and goal data for the demo | **Confirmed** — used instead of a more complex database system |
| AI Copilot | Qwen (Alibaba Cloud) | Powers the contextual chat responses | **Confirmed** — required by hackathon track |
| Frontend | Simplest practical web framework based on team familiarity | Dashboard, Copilot chat UI, What-If Simulator UI, language switch | **Team decision** — to be chosen before development starts; kept deliberately simple |

We are keeping the architecture simple and only listing tools we actually plan to use — no infrastructure is added just to look impressive. Detailed technical structure is defined separately in `ARCHITECTURE.md`.

---

## 13. Team Responsibilities

We are a team of 4. Suggested primary ownership (not rigid — everyone can help elsewhere):

| Role | Primary Focus |
|---|---|
| Backend / Data | Data input, Financial Health Score formula, SQLite schema, API |
| AI / Copilot | Qwen integration, context design, Urdu + English handling |
| Frontend / UI | Dashboard, What-If Simulator UI, language switch |
| Integration / Testing / Product | Connecting the pieces, testing the full demo flow, pitch/demo prep |

Before development starts, the team agrees on shared data formats and API shapes (e.g. what the score endpoint returns) so everyone's work fits together without rework.

---

## 14. Development Priority

**Core MVP first → testing → polish → optional features.**

- Finish all Must-Have features (Section 6) before touching anything in Section 7.
- The team must be able to stop after the Must-Have list and still present a complete, working product.
- Optional features are only attempted once the core demo flow (Section 9) works end-to-end without errors.

---

## 15. Success Criteria

- All Must-Have features (Section 6) work live in the demo.
- The full user flow (Section 9) can be completed start to finish without errors.
- The What-If Simulator clearly and quickly shows its value — a judge should understand it within seconds.
- The Copilot gives answers that clearly use the user's own financial data, in both Urdu and English.
- The project still makes complete sense even if every optional feature (Section 7) is removed.
- Alibaba Cloud tooling (Qwen) is used correctly and shown clearly in the pitch.

---

## 16. Future Ideas

Not part of this hackathon build — only mentioned to show direction:

- Committee (BC/ROSCA) Trust Score with a fuller, AI-assisted risk model
- Real bank account integration
- Production-level fraud/scam detection
- Peer-group micro-lending matchmaking
- Proactive notification system
- Financial Twin / long-term projection tools
- Support for additional regional languages
- Deeper gamification and streak systems
- Persistent, multi-session storage beyond the hackathon demo

---

*This PRD intentionally describes only what a 4-person team can realistically build and demo in the hackathon — not everything the product could eventually become.*
