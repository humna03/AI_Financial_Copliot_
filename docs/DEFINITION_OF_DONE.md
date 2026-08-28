# AI Financial Copilot — Definition of Done

## 1. Purpose

This document defines what "DONE" means at every level of this project — a single task, a feature, an API, a component, and the full MVP. It exists because **"code was generated" does not mean "the task is complete."** With AI-assisted/vibe coding through OpenCode, it is easy to produce code quickly without verifying it actually does what was required. A task is only DONE when the required functionality has been implemented, checked against the project's own documentation, and verified to actually work — not just written.

---

## 2. General Definition of Done

Any task, of any size, is DONE only when all of these are true:

- The requested functionality is implemented.
- It follows `PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_CONTRACT.md`, and `DEVELOPMENT_PLAN.md` — no extra scope was added.
- Required input validation is handled.
- Expected error cases are handled, not ignored.
- Relevant tests/checks have actually been run (not just written).
- Existing functionality was not unnecessarily broken.
- The result has been manually or automatically verified — not assumed.
- The developer (or agent) can clearly explain what changed and why.
- The change is ready to be integrated with the rest of the project.

---

## 3. Task-Level Definition of Done

Use this checklist after finishing any individual task.

**Requirements**
- [ ] The task matches the PRD and relevant project documents.
- [ ] No unnecessary scope was added.

**Implementation**
- [ ] Code is implemented in the correct part of the project (per `ARCHITECTURE.md` Section 6).
- [ ] Existing architecture and conventions are followed.
- [ ] No unrelated files or features were changed.

**Validation**
- [ ] Required inputs are validated.
- [ ] Invalid inputs are handled correctly (not silently accepted or crashed on).

**Testing**
- [ ] Relevant tests/checks have been run.
- [ ] New logic has a test or manual check where practical.
- [ ] Existing tests still pass.

**Verification**
- [ ] The actual result has been checked (run it, call it, look at the output).
- [ ] The developer has not relied only on an AI agent's claim that the task is complete.

**Integration**
- [ ] The change follows `API_CONTRACT.md` and `DATA_MODEL.md` where applicable.
- [ ] The change does not knowingly break another component.

---

## 4. Backend Definition of Done

A backend task is DONE only when:

- The FastAPI route exists at the correct path and method, per `API_CONTRACT.md`.
- Request/response bodies are validated with Pydantic models matching the contract.
- SQLModel models match `DATA_MODEL.md` exactly (no extra or missing fields).
- SQLite reads/writes work correctly for the feature.
- Business logic (Score Engine, What-If Engine, etc.) lives in the services layer, not in the route itself (per `ARCHITECTURE.md` Section 6).
- Errors are handled and return the correct status code (per `API_CONTRACT.md` Section 14).
- The endpoint has been manually tested or covered by a test, with real requests — not just read through.

Not required: microservices, complex deployment pipelines, enterprise monitoring, Kubernetes, or advanced performance/load testing.

---

## 5. Financial Health Score Definition of Done

The Financial Health Score feature is DONE only when:

- Required financial inputs (income, expenses, savings) are validated before calculation.
- The calculation follows the formula finalized by the team (per `DATA_MODEL.md` Section 9 / `API_CONTRACT.md` Section 7 — marked "Decision Required" until the team finalizes it; once finalized, the implementation must match exactly what was agreed).
- The calculation is deterministic — the same input always produces the same score.
- The backend is the sole source of truth for the score value.
- The AI (Qwen) does not determine, adjust, or override the score — it only explains it.
- The score's contributing factors can be shown and explained to the user.
- Test cases with known sample inputs confirm the expected score and factors.
- Reasonable edge cases are handled (e.g. zero expenses, zero income) without crashing.

This document does not define the formula itself — that comes only from the team's finalized decision, per the source documents.

---

## 6. What-If Simulator Definition of Done

The What-If Simulator is DONE only when:

- The user can submit a supported scenario (a category + new amount, per `API_CONTRACT.md` Section 8).
- The scenario is treated as temporary — nothing is written to the database unless the user explicitly applies the change via the normal financial-data update endpoint.
- The user's real stored financial data is never accidentally overwritten by a simulation call.
- The backend (not the frontend, not Qwen) calculates the simulated result.
- The result correctly reflects the changed value using the same logic as the Score Engine.
- The response includes the required outputs — simulated savings, score, and goal progress.
- Calculation tests confirm correct results for known scenarios.

---

## 7. AI Copilot Definition of Done

The AI Copilot feature is DONE only when:

- The Qwen/Alibaba Cloud connection works reliably from the backend.
- Only the backend communicates with Qwen — the frontend never calls it directly.
- API keys/secrets are stored in environment variables and never exposed to the frontend or in responses.
- Relevant user financial context (per `DATA_MODEL.md` Section 11) is assembled server-side and passed to Qwen.
- Only the context needed to answer the question is sent — no unnecessary or unrelated sensitive data.
- AI responses are grounded in the provided context, not generic advice.
- The AI cannot create, update, or delete any database record.
- The AI is never treated as the source of truth for the Financial Health Score.
- English responses work correctly.
- Urdu responses work correctly.
- A Qwen failure is handled gracefully (returns a fallback message, per `API_CONTRACT.md` Section 16) instead of crashing the request.
- Copilot behavior has been tested with real questions in both languages, including a simulated failure case.

Not required: RAG pipelines, fine-tuning, autonomous multi-step agents, or any AI system beyond the single-call Copilot and score-explanation defined in the source documents.

---

## 8. Frontend Definition of Done

A frontend feature is DONE only when:

- The UI matches the intended user flow (per `PRD.md` Section 9).
- Required data can be entered and displayed correctly.
- API calls match `API_CONTRACT.md` exactly (paths, request/response shapes).
- Loading states are shown where a request takes noticeable time (e.g. Copilot, score calculation).
- Errors are shown in an understandable way, not as raw error codes or blank screens.
- Urdu/English switching works for this feature, where relevant.
- A user can complete the relevant part of the core flow without a developer explaining anything.

Not required: pixel-perfect design, animations, or UX polish beyond what's needed for a confident demo.

---

## 9. API Definition of Done

An API endpoint is DONE only when:

- It uses the correct HTTP method and path, exactly as in `API_CONTRACT.md`.
- The request body matches the contract's schema.
- The response body matches the contract's schema, including the `data`/`error` wrapper (Section 13 of `API_CONTRACT.md`).
- Validation rules from `API_CONTRACT.md` Section 15 are enforced.
- The correct status codes are returned for success and each documented error case.
- Error cases (invalid input, missing resource, service failure) are handled, not just the happy path.
- The endpoint works correctly against the real database/business logic — not only against mock data.
- The endpoint has actually been called and its response checked (via a test, a tool like curl/Postman, or the real frontend).

`API_CONTRACT.md` is the binding agreement — an endpoint that technically "works" but doesn't match the contract is not DONE.

---

## 10. Database Definition of Done

Database-related work is DONE only when:

- The schema matches `DATA_MODEL.md` — same entities, same required fields, no invented tables or columns.
- Field-level validation (e.g. non-negative amounts) is enforced before data is stored.
- SQLite create/read/update operations work correctly for the entity being worked on.
- No unnecessary data is stored (e.g. no fields beyond what `DATA_MODEL.md` defines).
- A user's financial data cannot be accidentally overwritten or corrupted by another operation (e.g. a What-If simulation must never write to the Expense table).

Not required: indexing strategy, query optimization, or database scaling work.

---

## 11. Language Support Definition of Done

Urdu + English support is DONE only when:

- The user can select a language, and it is stored and used consistently for that user.
- Required UI text needed for the core MVP flow is available in both languages.
- The Copilot and score explanation respond in the selected language.
- Switching or using either language does not break any calculation or API behavior — the underlying numbers stay identical regardless of language.

Not required: translating optional-feature text, marketing copy, or anything outside the Must-Have MVP flow.

---

## 12. Integration Definition of Done

```
Frontend
   ↓
FastAPI
   ↓
SQLite / Financial Logic
   ↓
Qwen (where required)
   ↓
FastAPI
   ↓
Frontend
```

Integration between components is DONE only when:

- Components communicate correctly across this full path for a given feature.
- Requests and responses follow `API_CONTRACT.md` at every step.
- Real data flows through the system — not mock/sample data standing in for a missing piece.
- Errors are visible and handled, not silently swallowed.
- The relevant part of the main user flow (per `PRD.md` Section 9) works end-to-end.

---

## 13. Testing Definition of Done

Focus testing effort on what actually protects the MVP demo:

- Normal, expected inputs for financial data, goals, and simulator requests.
- Invalid inputs (negative numbers, missing required fields, unsupported language).
- A few realistic edge cases (e.g. zero income, zero expenses, goal already reached).
- The Financial Health Score produces correct, repeatable results for known inputs.
- What-If calculations produce correct results and never modify stored data.
- Each API endpoint returns the right shape and status code for success and failure.
- Database operations correctly save and retrieve data.
- The AI Copilot responds correctly to sample questions, and fails gracefully when Qwen is unavailable.
- Urdu and English both work for UI and AI-generated text.
- Frontend and backend work together, not just individually.
- The complete demo flow (per `DEVELOPMENT_PLAN.md` Section 16) runs end-to-end without errors.

Not required: exhaustive test coverage, load testing, or a formal QA process.

---

## 14. Code Quality Definition of Done

- Code is readable, with clear naming for variables, functions, and files.
- No unnecessary duplication of logic (e.g. Score Engine logic is not copy-pasted into the What-If Engine — it's reused, per `ARCHITECTURE.md` Section 8).
- No unnecessary dependencies added beyond the confirmed stack.
- No leftover debug code, print statements, or commented-out blocks.
- No exposed secrets or API keys in code or commits.
- No unrelated changes bundled into the same commit/PR.
- Code follows the existing project structure (routes/schemas/services/db, per `ARCHITECTURE.md`).

No strict enterprise style guide is imposed beyond this.

---

## 15. Documentation Definition of Done

- If an implementation changes something a document promises (an API shape, a data field, an architectural boundary), that document is updated to match.
- Any change to a request/response shape is reflected in `API_CONTRACT.md`.
- Any change to stored fields or entities is reflected in `DATA_MODEL.md`.
- Any change to component responsibilities or structure is reflected in `ARCHITECTURE.md` where necessary.

Small internal code changes (e.g. renaming a local variable) do not require documentation updates.

---

## 16. Git / Integration Definition of Done

- The change is committed to the correct branch (`backend`, `frontend`, or `ai-copilot`, per `DEVELOPMENT_PLAN.md` Section 11).
- The commit message clearly states what changed.
- The change is pushed when it's ready for the team to see or integrate.
- It is merged into `main` following the team's normal workflow — small, frequent merges rather than one large merge at the end.

---

## 17. MVP Definition of Done

The full MVP is DONE only when all of the following are true:

- [ ] Financial Data Input works — data can be entered, validated, and stored.
- [ ] Financial Health Score works correctly and deterministically.
- [ ] AI Copilot works and answers using real financial context, in both languages.
- [ ] What-If Simulator works and never corrupts stored data.
- [ ] Urdu + English support works across UI and AI-generated content.
- [ ] Financial Goals can be set and progress is calculated correctly.
- [ ] The Dashboard shows score, financial summary, and goal progress correctly.
- [ ] The FastAPI backend implements every endpoint in `API_CONTRACT.md`.
- [ ] The SQLite database stores and retrieves data correctly.
- [ ] The frontend is fully integrated with the real backend (no leftover mock data).
- [ ] The Qwen integration works and fails gracefully when unavailable.
- [ ] Major error cases across the system are handled.
- [ ] Core tests/checks (Section 13) pass.
- [ ] The complete demo flow (per `DEVELOPMENT_PLAN.md` Section 16) runs from beginning to end without errors, at least twice in a row.

---

## 18. OpenCode / AI Agent Completion Checklist

Before an OpenCode agent reports any task as complete, it must:

1. Read the relevant project documentation for the task.
2. Understand exactly what the assigned task requires.
3. Inspect the existing code before modifying it.
4. Make only the required changes — nothing extra.
5. Follow `ARCHITECTURE.md`.
6. Follow `DATA_MODEL.md`.
7. Follow `API_CONTRACT.md`.
8. Run relevant tests/checks.
9. Verify the actual output (not just that the code runs without a syntax error).
10. Check for obvious errors or edge-case failures.
11. Confirm existing functionality still works.
12. Report exactly what was changed.
13. Report exactly what tests/checks were run.
14. Clearly state anything that could not be verified (e.g. "AI response quality was not automatically tested, only manually spot-checked").
15. Never claim a task is complete without having verified it.

The agent should stop once the Definition of Done for that task is satisfied — it should not keep making further changes beyond what was asked, and it should not iterate indefinitely chasing improvements outside the task's scope.

---

## 19. Final Definition of Done Checklist

Use this concise checklist before declaring any task complete:

- [ ] Requirement understood
- [ ] Correct files changed
- [ ] Implementation complete
- [ ] Validation handled
- [ ] Tests/checks passed
- [ ] API/data contracts followed
- [ ] No unrelated changes
- [ ] Actual result verified
- [ ] Documentation updated if required
- [ ] Ready for integration
