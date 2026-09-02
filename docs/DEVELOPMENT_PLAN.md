# AI Financial Copilot — Development Plan

## 1. Purpose

This document tells the 4-person team what to build, in what order, who owns what, and how work can run in parallel without team members blocking each other. It turns the finalized `PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, and `API_CONTRACT.md` into a practical, short-hackathon execution plan — not a new set of requirements.

---

## 2. Development Principles

- MVP first — build the six Must-Have features before anything optional.
- Keep every implementation as simple as the source documents allow.
- Work in parallel wherever a dependency doesn't force sequencing.
- Treat `API_CONTRACT.md` as the fixed agreement between frontend and backend.
- Integrate early and often — never leave integration for the last day.
- Test each piece as it's built, not only at the end.
- No feature, table, endpoint, or technology beyond what the four source documents define.
- Use OpenCode for small, reviewable changes — not one-shot whole-project generation.
- Working, demoable software beats extra documentation or polish.

---

## 3. MVP Scope

**MUST HAVE** (from `PRD.md` Section 6):
- Financial Data Input
- Financial Health Score
- AI Copilot
- What-If Simulator
- Urdu + English support
- Simple Dashboard
- Financial Goals (required — the Dashboard, Score, and What-If Simulator all depend on goal data per `DATA_MODEL.md`)

**OPTIONAL — IF TIME REMAINS** (from `PRD.md` Section 7): Committee/BC Trust Score, Irregular Income Mode, proactive spending warning, financial projection chart, gamification, and sample-statement file upload (manual entry is the required path; upload is optional per the finalized PRD).

---

## 4. Team Responsibilities

| Member / Role | Main Responsibility | Key Deliverables |
|---|---|---|
| Member 1 — Backend / Data | FastAPI app, SQLModel models, SQLite setup, financial data & goal APIs, Score Engine, What-If Engine, backend validation | Working backend implementing all endpoints in `API_CONTRACT.md`, tested calculation logic |
| Member 2 — Frontend | Dashboard, financial input forms, score display, What-If UI, Copilot chat UI, Urdu/English UI switch | A working frontend consuming every endpoint in `API_CONTRACT.md` |
| Member 3 — AI / Copilot | Gemini connection, backend AI integration module, context assembly, Urdu/English prompt handling, Copilot error handling | Working `/copilot/ask` integration and AI-generated score explanations |
| Member 4 — Integration / Testing / General | Cross-checking API contract adherence, end-to-end testing, bug fixing, demo flow verification, documentation consistency | A verified, working end-to-end demo flow |

---

## 5. Development Phases

### Phase 1 — Repository and Project Setup
- **Goal:** A running skeleton app everyone can build on.
- **Tasks:** repository structure (backend/frontend folders, shared docs folder), FastAPI app skeleton with a health-check route, frontend project skeleton, SQLite file/connection setup, `.env` for secrets (Gemini key), branch setup (`main`, `backend`, `frontend`, `ai-copilot`).
- **Owner:** Member 4 (setup) with Member 1 (backend skeleton) and Member 2 (frontend skeleton).
- **Dependencies:** None — this is the starting point.
- **Expected output:** Backend runs locally and responds on a health-check endpoint; frontend runs and loads a blank shell; SQLite file initializes without errors.

### Phase 2 — Backend Foundation
- **Goal:** The data layer and basic request handling exist, matching `DATA_MODEL.md`.
- **Tasks:** SQLModel models for User, Financial Profile, Expense, Goal, Score Result; database initialization on startup; Pydantic request/response schemas per `API_CONTRACT.md`; basic create/read operations for financial data and goals; input validation (Section 15 of `API_CONTRACT.md`); base FastAPI router structure (routes/schemas/services/db, per `ARCHITECTURE.md` Section 6).
- **Owner:** Member 1.
- **Dependencies:** Phase 1 complete.
- **Expected output:** `POST/GET /financial-data` and `POST/GET /goal` work end-to-end against SQLite, with validation errors returning correctly.

### Phase 3 — Core Financial Logic
- **Goal:** The deterministic Score Engine and What-If Engine exist and are correct.
- **Tasks:** implement the Financial Health Score formula (finalized in `ARCHITECTURE.md` Section 7); implement score factors output; implement goal progress calculation; implement the What-If Engine reusing the Score Engine logic (per `ARCHITECTURE.md` Section 8); wire up `GET /score` and `POST /simulate`.
- **Owner:** Member 1.
- **Dependencies:** Phase 2 complete (needs stored financial data to calculate against).
- **Expected output:** Score and What-If endpoints return correct, deterministic numbers for known test inputs.

### Phase 4 — Frontend Foundation
- **Goal:** All screens exist and are navigable, even before every backend piece is finished.
- **Tasks:** app layout and navigation; financial input form; Dashboard screen structure; score display component; What-If Simulator UI; Copilot chat UI; Urdu/English switch (using a simple label dictionary per `ARCHITECTURE.md` Section 12).
- **Owner:** Member 2.
- **Dependencies:** Phase 1 complete (frontend skeleton). Can run **in parallel** with Phases 2–3 using mock/sample JSON responses shaped exactly like `API_CONTRACT.md` examples, then swapped for real calls once backend endpoints exist.
- **Expected output:** A clickable frontend covering the full user flow (PRD Section 9), initially against mock data.

### Phase 5 — AI Copilot
- **Goal:** The Copilot and score-explanation AI calls work end-to-end.
- **Tasks:** Gemini connection and credentials via environment variables; backend AI integration module (context assembly, per `DATA_MODEL.md` Section 11); `POST /copilot/ask` implementation; AI-generated `explanation`/`suggestions` for `GET /score`; Urdu/English prompt handling; fallback behavior on AI failure (`502`, per `API_CONTRACT.md` Section 16).
- **Owner:** Member 3.
- **Dependencies:** Needs Phase 2 (stored financial data to build context from) but does **not** need Phase 3 to be finished first for the Copilot itself — only the score-explanation part needs the Score Engine (Phase 3) to exist. Can run in parallel with Phase 4.
- **Expected output:** Copilot answers real questions using real financial context, in both languages; score explanations are AI-phrased but backend-calculated.

### Phase 6 — Integration
- **Goal:** Frontend, backend, database, financial logic, and Gemini all work together as one system.
- **Tasks:** replace frontend mock data with real API calls for every endpoint in `API_CONTRACT.md`; verify every request/response shape matches the contract exactly; verify the full flow: Frontend ↔ FastAPI ↔ SQLite ↔ Financial Logic ↔ Gemini.
- **Owner:** Member 4, with Members 1–3 fixing issues found in their areas.
- **Dependencies:** Phases 2–5 substantially complete for at least the Must-Have flow.
- **Expected output:** The full demo flow (Section "Final Demo Flow" below) runs without manual data patching.

### Phase 7 — Testing and Bug Fixing
- **Goal:** Confidence that the MVP works reliably.
- **Tasks:** backend unit tests for Score Engine and What-If Engine; API tests for each endpoint (valid + invalid input); AI Copilot tests (normal + failure case); frontend manual test pass; full integration test of the demo flow; Urdu/English test pass for both UI and AI responses.
- **Owner:** Member 4 leads; all members test their own area first.
- **Dependencies:** Phase 6 substantially complete.
- **Expected output:** Known bugs fixed; demo flow runs cleanly at least twice in a row.

### Phase 8 — Final Polish and Demo Prep
- **Goal:** A confident, clean demo.
- **Tasks:** UI cleanup, clearer error messages, realistic demo data prepared in advance, final bug fixes, a quick performance sanity check (score/simulate respond fast), rehearsed demo flow, pitch preparation.
- **Owner:** All members; Member 4 coordinates.
- **Dependencies:** Phase 7 complete.
- **Expected output:** The team can run the full demo flow confidently, live, without surprises.

---

## 6. Parallel Development

| Task | Member | Can Start After | Can Run in Parallel With |
|---|---|---|---|
| Backend skeleton + health check | Member 1 | Phase 1 setup | Frontend skeleton, AI credential setup |
| Frontend skeleton + screens (mock data) | Member 2 | Phase 1 setup | Backend Foundation, Financial Logic, AI integration |
| Financial data & goal APIs (Phase 2) | Member 1 | Backend skeleton | Frontend Foundation (Phase 4) |
| Score Engine & What-If Engine (Phase 3) | Member 1 | Phase 2 | Frontend Foundation, Gemini connection setup |
| Gemini connection + AI integration module (Phase 5) | Member 3 | Financial data storage exists (Phase 2) | Frontend Foundation, Financial Logic (Phase 3) |
| Score-explanation AI wiring | Member 3 | Score Engine exists (Phase 3) | Frontend polish |
| Frontend → real API swap (Phase 6) | Member 2 + Member 4 | Relevant backend endpoint is working | Other endpoints' integration (can be done incrementally, one endpoint at a time) |
| Testing per component | All members | As soon as their own component works | Other members' testing |

Tasks that **must wait**: the Score Engine (Phase 3) needs stored financial data (Phase 2) to calculate against; the What-If Engine needs the Score Engine; AI score-explanations need the Score Engine's output; full integration (Phase 6) needs at least a working version of each Must-Have endpoint.

---

## 7. Dependency Map

```
Project Setup (Phase 1)
        |
        v
Backend Foundation (Phase 2) ---------------\
        |                                     \
        v                                      v
Core Financial Logic (Phase 3)        Frontend Foundation (Phase 4, mock data)
        |                                      |
        v                                      |
AI Copilot (Phase 5) <------------------------/
        |
        v
Integration (Phase 6)
        |
        v
Testing & Bug Fixing (Phase 7)
        |
        v
Final Polish & Demo (Phase 8)
```

Frontend Foundation (Phase 4) and early AI credential setup can start immediately after Phase 1, in parallel with Backend Foundation and Core Financial Logic.

---

## 8. MVP Priority

| Feature / Task | Priority | Reason |
|---|---|---|
| Financial Data Input | MUST | Every other feature depends on stored income/expenses |
| Financial Health Score | MUST | Core product value per PRD USP |
| What-If Simulator | MUST | PRD's core "wow" demo moment |
| AI Copilot | MUST | Core product differentiator, required by hackathon track (Gemini) |
| Financial Goals | MUST | Needed by Dashboard, Score context, and What-If goal-progress output |
| Urdu + English | MUST | Explicit PRD requirement for both UI and AI responses |
| Simple Dashboard | MUST | The demo's single-screen overview |
| Sample statement file upload | SHOULD | Nice convenience; manual entry already satisfies the MVP |
| Committee (BC/ROSCA) Trust Score | OPTIONAL | Explicitly optional in PRD Section 7 |
| Irregular Income Mode | OPTIONAL | Explicitly optional in PRD Section 7 |
| Proactive spending warning | OPTIONAL | Explicitly optional in PRD Section 7 |
| Financial projection chart | OPTIONAL | Explicitly optional in PRD Section 7 |
| Gamification (streaks/badges) | OPTIONAL | Explicitly optional in PRD Section 7 |

---

## 9. Time Management

Since exact hackathon dates were not provided, this plan uses generic stages instead of fixed dates.

- **Early stage:** Phase 1 (Setup) and the start of Phase 2 (Backend Foundation) and Phase 4 (Frontend Foundation, with mock data). Goal: a running skeleton with a clickable frontend and a basic data-storing backend.
- **Middle stage:** Complete Phase 2, Phase 3 (Financial Logic), and Phase 5 (AI Copilot), while Frontend Foundation continues. Goal: every Must-Have backend capability works in isolation, and the frontend is mostly built.
- **Late stage:** Phase 6 (Integration) — swap mock data for real API calls, verify the full flow end-to-end. Goal: the complete demo flow runs without manual intervention.
- **Final stage:** Phase 7 (Testing/Bug Fixing) then Phase 8 (Polish/Demo Prep). Goal: a stable, rehearsed demo.

The team should not move fully into the next stage until the current stage's "expected output" (Section 5) is achieved for at least the Must-Have features — optional features never justify delaying this progression.

---

## 10. OpenCode / Vibe Coding Workflow

For every task, whoever is using OpenCode should:

1. Read the relevant project documents (`PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_CONTRACT.md`, this plan) for the task at hand.
2. Understand exactly what the assigned task requires — nothing more.
3. Inspect the existing code before changing anything.
4. Plan the smallest change that accomplishes the task.
5. Implement that change only — avoid generating unrelated code or whole modules at once.
6. Run available tests/checks (or manually verify behavior if no test exists yet).
7. Verify the result actually matches the API contract / data model / PRD requirement.
8. Report clearly what was changed and why.
9. Commit the work with a clear message.
10. Push to the assigned branch (`backend`, `frontend`, or `ai-copilot`).
11. Open a pull request into `main` when the change is ready for review.

Agents should never be asked to generate the entire project in one pass — every task should be small enough for a teammate to review and verify quickly.

---

## 11. Git / Team Workflow

- **Branches:** `main` (integration branch, always working), `backend`, `frontend`, `ai-copilot` — matching the team's existing structure.
- **Shared documents** (`PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_CONTRACT.md`, this plan) live at the repository root and are treated as read-only during development — changes to them require team agreement, since both frontend and backend rely on them.
- Each member works primarily on their own branch, minimizing edits to files owned by another branch (e.g. frontend shouldn't edit backend service files, and vice versa).
- Merge into `main` frequently, in small increments, rather than one large merge at the end — this is what makes Phase 6 (Integration) possible before the final day.
- Before merging, pull/rebase from `main` to catch conflicts early.
- `API_CONTRACT.md` is the binding agreement: the frontend builds against it regardless of backend progress, and the backend implements exactly what it defines — this is what allows Phase 2/3 (backend) and Phase 4 (frontend) to proceed fully in parallel.

---

## 12. Integration Strategy

Integrate incrementally, not all at once at the end:

1. Backend health-check endpoint works.
2. Database (SQLite) initializes and stores a test record.
3. Financial data API (`/financial-data`) works end-to-end.
4. Frontend connects to the financial data API (replacing mock data for that screen only).
5. Score endpoint (`/score`) works end-to-end.
6. What-If endpoint (`/simulate`) works end-to-end.
7. Goal endpoints (`/goal`) work end-to-end.
8. Copilot endpoint (`/copilot/ask`) works end-to-end.
9. Urdu/English switching works across UI and AI responses.
10. Full demo flow (Section "Final Demo Flow") works start to finish.

Each step should be verified before moving to the next, but steps 3–8 can be integrated in whatever order their backend piece becomes ready, rather than strictly in this sequence.

---

## 13. Testing Strategy

| Area | What to Check |
|---|---|
| Data validation | Negative amounts, missing required fields, invalid language values are rejected (per `API_CONTRACT.md` Section 15) |
| Database operations | Financial data and goals save and load correctly from SQLite |
| Financial Health Score | Same input always produces the same score (deterministic); factors match the input data |
| What-If Simulator | Simulated results are correct and stored data is unchanged after a simulation call |
| API endpoints | Each endpoint in `API_CONTRACT.md` returns the documented response shape and status codes |
| AI Copilot | Answers reflect the actual financial context; a Gemini failure returns a graceful fallback, not a crash |
| Urdu/English | UI labels and AI-generated text both switch correctly for both languages |
| Frontend/backend integration | Every frontend screen works against the real backend, not just mock data |
| Complete user flow | The full flow in PRD Section 9 completes without errors |

Keep this to practical manual and lightweight automated checks — no formal QA process is needed.

---

## 14. Definition of "MVP Complete"

The MVP is complete only when all of the following are true:

- [ ] Financial data input, storage, and retrieval work.
- [ ] The Financial Health Score is calculated deterministically and displayed with factors and an explanation.
- [ ] The What-If Simulator shows correct changes to savings, score, and goal progress without altering stored data.
- [ ] Financial goals can be set and progress is shown correctly.
- [ ] The AI Copilot answers questions using real financial context, in both Urdu and English.
- [ ] The Dashboard shows score, financial summary, and goal progress in one screen.
- [ ] Every endpoint in `API_CONTRACT.md` is implemented and matches its contract.
- [ ] The frontend is fully connected to the real backend (no leftover mock data).
- [ ] Major error cases (invalid input, missing data, AI failure) are handled gracefully.
- [ ] The full demo flow runs start to finish, at least twice, without manual fixes.

Code existing without meeting these checks does not count as "MVP complete."

---

## 15. Risk Management

| Risk | Mitigation |
|---|---|
| Gemini/AI API failure or slow response during the demo | Implement the `502` fallback response early (Phase 5); rehearse the demo with the fallback path tested |
| Unclear or drifting API contract | Treat `API_CONTRACT.md` as fixed; any change requires a quick team sync before either side implements around it |
| Scope expansion ("just one more feature") | Any new idea goes to the Optional list (Section 8) and is only touched after the Must-Have checklist (Section 14) is fully met |
| Team members editing the same files | Keep to assigned branches (Section 11); merge small and often to `main` |
| Calculation errors in Score/What-If logic | Test with known sample inputs (Phase 3, Section 13) before building UI on top of it |
| Integration left too late | Follow the incremental integration steps (Section 12) starting from the middle stage, not the final stage |
| Insufficient time overall | The Must-Have list alone (Section 3) is a complete, demoable product; cut Optional features first, never Must-Have ones |

---

## 16. Final Demo Flow

1. User opens the app and selects Urdu or English.
2. User enters financial information (income, expenses, goal).
3. Dashboard shows the Financial Health Score, savings summary, and goal progress.
4. User asks the Copilot a financial question and receives an answer in the selected language, grounded in their real numbers.
5. User opens the What-If Simulator and changes an expense.
6. The system instantly shows the effect on savings, score, and goal progress.
7. User sees how the change would affect their financial goal.

This matches the user flow defined in `PRD.md` Section 9 exactly — no additional demo steps are introduced.

---

## 17. Out of Scope

The following must not be started during MVP development, per `PRD.md` Section 8:

- Live bank API integrations
- Real money transfers or real lending
- Production-level or ML-based fraud detection
- Any ML model requiring training data the team doesn't have
- Complex authentication systems
- Large-scale notification infrastructure
- Support for languages beyond Urdu and English
- Advanced gamification
- Enterprise-level scalability, uptime, or encryption work

If time remains after the Must-Have and Optional lists are both addressed, any further work should come from `PRD.md` Section 16 (Future Ideas) discussion only — not ad hoc additions.
