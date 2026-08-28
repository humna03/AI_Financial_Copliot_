# AI Financial Copilot — System Architecture

## 1. Purpose

This document defines the practical technical architecture for the AI Financial Copilot hackathon MVP. It explains how the frontend, backend, database, and AI Copilot fit together, and draws clear boundaries between components so a 4-person team using AI-assisted coding tools (e.g. OpenCode) can build quickly without rework or confusion. It is based only on the finalized `PRD.md` — no extra features or infrastructure are introduced here.

---

## 2. Architecture Goals

- **Simple architecture** — as few moving parts as possible.
- **Fast development** — buildable by a 4-person team in hackathon time.
- **Clear responsibilities** — every component has an obvious, single job.
- **Easy integration** — frontend, backend, and AI talk through one simple API layer.
- **Easy testing** — deterministic logic (score, simulator) is testable without the AI in the loop.
- **Suitable for AI-assisted development** — clear boundaries so coding agents don't blur responsibilities.
- **Easy for a 4-person team to maintain** — no layer exists unless it earns its place.

---

## 3. High-Level Architecture

```
                User
                 |
                 v
             Frontend
     (Dashboard, Copilot Chat,
      What-If Simulator, Language Switch)
                 |
                 v
          FastAPI Backend
   (routes, validation, business logic)
                 |
   -------------------------------
   |                             |
   v                             v
Core Application Services     AI Integration Layer
(Score Engine,                 (builds context,
 What-If Engine,                calls Qwen)
 Data Handling)                     |
   |                                v
   v                              Qwen
SQLite Database                (Alibaba Cloud)
```

The frontend never talks to SQLite or Qwen directly. Every request goes through the FastAPI backend, which decides what to calculate, what to store, and what (if anything) to send to Qwen.

---

## 4. System Components

### Frontend
- What it does: Collects user input, displays the Dashboard, Financial Health Score, Copilot chat, and What-If Simulator results; handles the Urdu/English language switch.
- What it does NOT do: Calculate the score, run What-If logic, or call Qwen directly. It only calls the backend API and renders what it gets back.

### FastAPI Backend
- What it does: Validates input, stores and retrieves data, runs the Score Engine and What-If Engine, builds context for the AI Copilot, and returns responses to the frontend.
- What it does NOT do: Contain any frontend UI logic.

### Financial Health Score (Score Engine)
- What it does: Applies a deterministic, rule-based formula to the user's income, expenses, and savings to produce a score, contributing factors, and improvement pointers.
- What it does NOT do: Use AI/ML to decide the score.

### What-If Simulator (Simulation Engine)
- What it does: Takes a hypothetical expense change and recalculates savings, score, and goal progress using the same deterministic logic as the Score Engine.
- What it does NOT do: Change or save the user's real data — it only calculates a hypothetical outcome unless the user explicitly chooses to apply it.

### AI Copilot (AI Integration Layer)
- What it does: Sends the user's question plus relevant financial context (assembled by the backend) to Qwen, and returns Qwen's answer, in the selected language.
- What it does NOT do: Calculate the score, modify financial records, or receive more data than it needs to answer the question.

### SQLite Database
- What it does: Stores the user's financial data (income, expenses, savings, goal) and calculated results for the duration of the demo.
- What it does NOT do: Store anything beyond what the Must-Have features (PRD Section 6) require. No committee/BC data, no future-idea data, unless an optional feature is actually built.

### Qwen / Alibaba Cloud Integration
- What it does: Generates natural-language explanations and Copilot answers from the context it is given.
- What it does NOT do: Have direct access to the database, and never acts as the source of truth for the score.

---

## 5. Component Responsibilities

| Component | Responsibilities | Does Not Handle |
|---|---|---|
| Frontend | Collect input, display score/dashboard/chat/simulator, language switch | Score calculation, What-If calculation, direct DB or Qwen access |
| FastAPI Backend | Validation, routing, orchestration, calling Score Engine / What-If Engine / AI layer | Rendering UI |
| Score Engine | Deterministic score formula, contributing factors, improvement tips | Holding a conversation, natural-language generation |
| What-If Engine | Recalculating savings/score/goal for a hypothetical expense change | Persisting changes unless the user applies them, AI reasoning |
| AI Copilot / AI Integration Layer | Building context, calling Qwen, returning a localized answer | Deciding or overriding the score, editing financial data |
| SQLite Database | Storing financial data, goal, and calculated results | Business logic, formatting, translation |
| Qwen (Alibaba Cloud) | Natural-language explanation and Q&A generation | Score calculation, data storage, direct data access |

---

## 6. Backend Architecture

Keep the FastAPI backend in a small number of clear layers — no unnecessary abstraction:

- **API / routes** — defines endpoints, receives requests, returns responses. Thin; delegates all logic downward.
- **Schemas / validation** — Pydantic models describing request/response shapes (financial data, score result, simulator result, Copilot message). Ensures bad input is rejected early.
- **Services / business logic** — the Score Engine and What-If Engine live here as plain Python functions/classes. This is where the "brain" of the app lives, and it is fully independent of the AI layer so it can be tested on its own.
- **AI integration** — a small dedicated module that builds the context object (from the database, via the services layer) and calls Qwen. Kept separate from the Score/What-If services so AI failures never affect deterministic calculations.
- **Database / models** — SQLite access, via a simple ORM (e.g. SQLModel/SQLAlchemy) or plain `sqlite3`, whichever the team is fastest with. One place responsible for reading/writing data.

No additional layers (no microservices, no message queues, no separate scoring service) are needed for this MVP.

---

## 7. Financial Health Score Architecture

- The score is **deterministic and formula/rule based** — never produced by an ML model or by Qwen.
- **Inputs**: income, expenses (by category), savings, and the user's financial goal.
- The **backend Score Engine** calculates the score, the contributing factors, and which factors are dragging the score down.
- **AI (Qwen)** is only used afterward, to turn the calculated factors into a plain-language explanation and 1–2 improvement suggestions — it explains the result, it does not decide it.
- The exact scoring formula (e.g. specific weights for savings rate, expense ratio, etc.) is **not yet defined** and is a **small implementation decision** for the Backend/Data owner to finalize early in development — it should stay simple and easy to explain in one sentence per factor.

---

## 8. What-If Simulator Architecture

- The user selects an expense category and enters a hypothetical new value.
- The backend re-runs the **same Score Engine logic** with the adjusted expense, instead of a separate calculation path — this keeps the simulator consistent with the real score by construction.
- The system returns, side by side with the current numbers:
  - the effect on monthly savings
  - the effect on the Financial Health Score
  - the effect on goal progress (e.g. time to reach the goal, or % progress)
- All of this is calculated synchronously and deterministically — no AI involved, so results are instant and reproducible.
- The simulation is a "what would happen" preview; it does not overwrite stored data unless the user takes an explicit action to apply the change.

---

## 9. AI Copilot Architecture

```
User question
     |
     v
  Backend
     |
     v
User financial context
(assembled from SQLite by the backend:
 income, expenses, savings, goal, latest score)
     |
     v
    Qwen
     |
     v
  Response
     |
     v
  Frontend
```

- The **backend** — not the frontend, and not Qwen — decides exactly which financial fields are included as context for a given question. Only what's needed to answer well is sent.
- The backend also tells Qwen which language (Urdu or English) to respond in.
- Qwen's response is returned to the backend, then passed to the frontend for display.
- The AI Copilot can **never** write to the database or change financial records — it is read-context-in, text-out only.

---

## 10. Database Architecture

The project uses **SQLite** for the hackathon demo.

Only the data actually required by the Must-Have features (PRD Section 6) is stored:
- the user's financial data (income, expenses by category, savings)
- the user's financial goal
- the calculated Financial Health Score result (so it doesn't need to be recomputed on every screen load)

No committee/BC data, no irregular-income data, and no other optional-feature data is stored unless that optional feature is actually being built.

The detailed schema (table names, fields, relationships) is intentionally **not** defined here — it will be specified separately in `DATA_MODEL.md`.

---

## 11. Data Flow

1. User enters financial data.
2. Backend validates and stores it in SQLite.
3. Backend calculates the Financial Health Score using the Score Engine.
4. Frontend displays the score and its explanation.
5. User asks the Copilot a question.
6. Backend assembles relevant financial context and sends it, with the question, to Qwen.
7. Copilot responds in the selected language.
8. User changes an expense in the What-If Simulator.
9. Backend recalculates the new outcome using the same Score Engine logic.
10. Frontend displays the before/after comparison.

---

## 12. Language Support

- The user picks Urdu or English at the start; this choice is passed with every request (or stored for the session).
- **UI text**: a simple key-based translation dictionary (English and Urdu strings per label) is enough — no complex i18n framework is needed for two languages.
- **AI responses**: the backend tells Qwen which language to answer in as part of the prompt/context, so the Copilot's actual answer — not just static labels — is generated in the selected language.
- This keeps language support practical: one small translation file for the UI, and one instruction to Qwen for the Copilot.

---

## 13. API / Integration Boundaries

- **Frontend ↔ Backend**: the only communication path for the frontend. The frontend calls backend endpoints for data submission, score retrieval, What-If calculations, and Copilot questions; it renders whatever the backend returns.
- **Backend ↔ SQLite**: the backend is the only component that reads or writes the database.
- **Backend ↔ Qwen**: the backend is the only component that talks to Qwen; it builds the context and prompt, and Qwen never talks to the frontend or database directly.
- Detailed endpoint definitions (paths, request/response formats) are intentionally left out of this document and will be defined in `API_CONTRACT.md`.

---

## 14. Error Handling

Simple, MVP-appropriate handling only:

| Situation | Handling |
|---|---|
| Invalid financial input (e.g. negative income) | Reject at validation layer, return a clear error message |
| Missing required data (e.g. no goal set) | Prompt the user to complete it before showing the score |
| AI service failure (Qwen unavailable/timeout) | Show a friendly fallback message; do not crash the app or block the score/simulator |
| Database error | Return a generic "something went wrong" message; log the error for debugging |
| Invalid What-If value | Reject or clamp to a sensible range, and explain why |

No retries-with-backoff frameworks, circuit breakers, or enterprise logging pipelines are needed for a hackathon demo.

---

## 15. Security and Privacy

Realistic, MVP-level measures only:

- Validate all user input on the backend (not just the frontend).
- Never expose the Qwen/Alibaba Cloud API key in frontend code or client-visible responses; keep it in environment variables on the backend.
- Send only the financial data actually needed to answer a Copilot question — not the entire database record.
- No real financial credentials or real bank data are ever collected, since the MVP uses mock/manual data only (PRD Section 8).

No enterprise-grade encryption standards, audit logging, or compliance frameworks are required for this MVP.

---

## 16. Technology Stack

| Area | Technology | Purpose | Status |
|---|---|---|---|
| Backend / API | Python + FastAPI | Routing, validation, business logic, orchestration | Confirmed |
| Database | SQLite | Stores financial data, goal, and score results | Confirmed |
| AI | Qwen (Alibaba Cloud) | Powers Copilot answers and score explanations | Confirmed |
| Frontend | Simplest practical web framework (e.g. a lightweight React/Vite app or plain HTML/JS) | Dashboard, Copilot chat, What-If Simulator UI, language switch | Team Decision |

---

## 17. Out of Scope

The following technical complexity will **not** be built for this hackathon:

- Microservices architecture
- Kubernetes or container orchestration
- Complex cloud infrastructure or multi-region deployment
- Live banking API integrations
- Real financial transactions or money transfers
- ML training pipelines or custom-trained models
- Message queues, event streaming, or other distributed-systems infrastructure
- Enterprise authentication/authorization systems
- Persistent, multi-session storage beyond the demo

---

## 18. Architecture Summary

In plain terms: the user interacts with a simple web frontend. That frontend always talks to one FastAPI backend, which is the "brain" of the app. The backend stores data in a small SQLite database, does all the math for the Financial Health Score and What-If Simulator itself (so the numbers are always trustworthy and consistent), and only asks the Qwen AI model to explain things in plain language or answer questions — never to decide the numbers. Everything is kept as simple as possible so a 4-person team can build it, test it, and demo it confidently within the hackathon timeline.
