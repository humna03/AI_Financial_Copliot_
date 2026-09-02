# AI Financial Copilot — AGENTS.md

## 1. Purpose

This file contains instructions for AI coding agents (e.g. OpenCode) working in this repository. Before making any change, an agent must understand what this project is and which documents govern it. AGENTS.md defines **development rules and behavior** — it does not replace the project's actual requirements, which live in the documents listed in Section 3.

---

## 2. Project Overview

**AI Financial Copilot** is a hackathon MVP for the financial inclusion domain in Pakistan. It helps users understand their financial health, get personalized AI-backed advice, and test spending decisions before making them — in Urdu or English.

Core MVP features: Financial Data Input, Financial Health Score, AI Copilot, What-If Simulator, Urdu + English support, Dashboard, and Financial Goals.

Confirmed stack: Python, FastAPI, Pydantic, SQLModel, SQLite, and Google Gemini for AI. Development is AI-assisted ("vibe coding") using OpenCode, done in small, reviewable tasks across a 4-person team.

---

## 3. Source of Truth

| Document | Purpose | Authority |
|---|---|---|
| PRD.md | What the product must do | Product requirements — highest authority for scope and features |
| ARCHITECTURE.md | How the system is structured | Authority for component boundaries and structure |
| DATA_MODEL.md | What data is stored and where | Authority for database entities and fields |
| API_CONTRACT.md | How frontend and backend communicate | Authority for endpoints, request/response shapes |
| DEVELOPMENT_PLAN.md | What to build, in what order, who owns what | Authority for task sequencing and ownership |
| DEFINITION_OF_DONE.md | When a task is actually finished | Authority for completion criteria |

This file (`AGENTS.md`) does not duplicate their contents — it tells the agent how to work with them. When these documents conflict with anything in this file, **the documents above win**; this file only governs agent behavior and discipline.

---

## 4. General Agent Rules

The agent MUST:
- Read relevant documentation before coding.
- Inspect existing code before changing it.
- Understand the task before implementing.
- Make the smallest reasonable change.
- Follow the existing architecture, data model, and API contract.
- Preserve existing functionality.
- Avoid unnecessary dependencies or refactoring.
- Test its changes and verify actual results.
- Clearly report what it changed.

The agent MUST NOT:
- Invent requirements.
- Add unrequested features.
- Rewrite the project unnecessarily.
- Change architecture, API contracts, or database structure without a documented reason.
- Expose secrets.
- Claim success without verification.

---

## 5. Before Starting Any Task

1. Read the task/request.
2. Identify which project documents are relevant to it.
3. Read those documents (only the relevant ones — not the entire set every time).
4. Inspect the existing repository structure.
5. Find the relevant existing code.
6. Understand dependencies and existing behavior.
7. Create a short implementation plan.
8. Only then start coding.

---

## 6. Task Execution Workflow

```
Understand → Inspect → Plan → Implement → Test → Verify → Review → Report
```

- **Understand**: what is actually being asked.
- **Inspect**: what already exists in the code.
- **Plan**: the smallest change that satisfies the task.
- **Implement**: make that change only.
- **Test**: run relevant checks.
- **Verify**: confirm the real output matches expectations.
- **Review**: check the diff for unrelated changes.
- **Report**: summarize per Section 29.

Avoid large, uncontrolled changes at any step.

---

## 7. Scope Control

- Implement only the requested task.
- Do not add "nice-to-have" features automatically.
- Do not introduce technologies without a clear need.
- Do not refactor unrelated code.
- Do not optimize prematurely.
- Do not create unnecessary abstractions.
- Do not increase complexity just to look more "professional."

For this hackathon MVP: **working, verified functionality beats impressive-looking complexity.**

---

## 8. Architecture Rules

Respect the separation defined in `ARCHITECTURE.md`:
- API/routes
- Schemas/validation
- Business logic/services
- Database/models
- AI integration

Do not invent additional layers (no new services, queues, or microservices). Keep the architecture as simple as `ARCHITECTURE.md` describes it.

---

## 9. Backend Rules

- Use the FastAPI conventions already established in the repository.
- Use Pydantic for request/response validation.
- Use SQLModel according to `DATA_MODEL.md`.
- Use SQLite as the only MVP database.
- Keep business logic (Score Engine, What-If Engine) separate from route handlers.
- Validate user input and return errors per `API_CONTRACT.md`.
- Do not introduce another backend framework.

---

## 10. Database Rules

- Follow `DATA_MODEL.md` exactly — no unnecessary tables or fields.
- Do not store data that should simply be calculated (e.g. goal progress).
- Avoid destructive database changes unless explicitly required; preserve existing data where possible.
- If a database change is genuinely required: identify its impact, update `DATA_MODEL.md`, and test the change.

---

## 11. Financial Health Score Rules

- The score is **deterministic**; the backend is the **sole source of truth**.
- AI does **not** decide the authoritative score — it only explains it.
- The calculation must follow the finalized scoring rules from the source documents.
- Score-related logic must be testable.
- The agent must **not invent a new scoring formula**.

**If the scoring formula is unclear or missing: STOP and report the issue. Do not guess.**

---

## 12. What-If Simulator Rules

- Keep simulation calculations deterministic.
- Never modify the user's real, stored financial data during a simulation.
- Treat scenario inputs as temporary values, not new stored records.
- Return the required calculated results (savings, score, goal progress).
- Reuse the existing Score Engine logic — do not duplicate calculation code.
- Do not create permanent scenario storage unless explicitly required by the source documents.

---

## 13. AI Copilot Rules

```
Frontend → FastAPI Backend → Financial Context → Gemini → FastAPI Backend → Frontend
```

The agent MUST:
- Keep AI credentials/secrets on the backend only.
- Never expose API keys to the frontend.
- Send only the relevant financial context needed to answer the question.
- Support English and Urdu as required.
- Handle AI service failures gracefully.
- Prevent AI from directly modifying financial records.
- Prevent AI from becoming the authoritative source for deterministic calculations.

The agent MUST NOT:
- Let the frontend call Gemini directly.
- Let AI modify database records directly.
- Use AI to calculate the authoritative Financial Health Score.
- Add RAG, fine-tuning, or autonomous agent systems unless explicitly required.

---

## 14. API Rules

Follow `API_CONTRACT.md`. Before changing an endpoint:
- Inspect the existing endpoint.
- Check the API contract.
- Check how the frontend uses it, if available.
- Check request/response models.
- Consider integration impact.

Do not casually rename or remove endpoints. If a contract change is genuinely required: identify it clearly, update `API_CONTRACT.md`, update dependent code, and test the change.

---

## 15. Frontend Integration Rules

The frontend depends entirely on `API_CONTRACT.md`. Do not make backend changes that silently break frontend expectations. When an API response changes:
- Check `API_CONTRACT.md`.
- Check frontend consumers if available.
- Update dependent code as needed.
- Test the integration.

---

## 16. Urdu + English Rules

- Preserve the selected language's behavior across features.
- Do not hard-code English-only responses where bilingual support is required.
- Ensure language changes never affect financial calculations — the numbers must be identical regardless of language.
- Ensure AI responses follow the requested language.
- Do not duplicate APIs per language — one endpoint, driven by a language field/preference.

---

## 17. Error Handling Rules

Handle relevant cases: invalid input, missing required data, invalid financial values, database errors, AI service failures, invalid simulation values.

- Do not hide errors silently.
- Do not expose internal secrets or sensitive implementation details to users.

---

## 18. Security and Secrets

The agent MUST:
- Never hard-code API keys.
- Never commit secrets.
- Use environment variables for all secrets.
- Avoid logging sensitive financial information unnecessarily.
- Validate incoming data.
- Avoid exposing internal error details unnecessarily.

If a secret is discovered in the repository: do not copy it elsewhere, report the issue, and do not expose it in any response. Do not introduce enterprise security systems beyond these basics.

---

## 19. Code Quality Rules

Code should be readable, simple, maintainable, appropriately structured, and consistently named, with minimal duplication.

Avoid: unnecessary abstractions, unnecessary design patterns, huge functions, dead code, debug statements, unused dependencies, and unrelated refactoring.

---

## 20. Testing Rules

Use the testing approach defined in `DEVELOPMENT_PLAN.md` and `DEFINITION_OF_DONE.md`. Depending on the task, test: business logic, API endpoints, database operations, validation, the Financial Health Score, What-If calculations, AI integration, language behavior, and the relevant integration flow.

Run only the checks relevant to the change — not everything, every time.

---

## 21. Verification Rules

The agent must verify the actual result. It must NOT say "implementation complete" only because code was generated successfully.

After coding:
1. Run relevant tests/checks.
2. Inspect errors.
3. Fix genuine issues.
4. Re-run tests.
5. Verify expected behavior.
6. Check for unintended changes.

If something could not be tested, say so explicitly in the report.

---

## 22. Definition of Done

Use `DEFINITION_OF_DONE.md` as the authority for when a task is actually finished. Before declaring any task complete, check it against the relevant checklist in that document — do not duplicate that checklist here.

---

## 23. Git Rules

- Work only on the assigned branch.
- Avoid modifying another member's unrelated work.
- Create focused commits with clear messages.
- Avoid committing generated junk files or secrets.
- Before finishing, inspect `git status` and `git diff` to confirm only the intended files changed.

---

## 24. Documentation Change Rules

If an implementation changes something defined in the project documentation, update the relevant document:

- API change → `API_CONTRACT.md`
- Database change → `DATA_MODEL.md`
- Architecture change → `ARCHITECTURE.md`
- Development process change → `DEVELOPMENT_PLAN.md`

Do not modify documentation for internal implementation details that don't change any documented contract.

---

## 25. Handling Unclear Requirements

If a task is ambiguous:
1. Inspect the project documents.
2. Inspect existing code.
3. Look for an existing project convention.
4. Prefer the simplest interpretation already supported by the documentation.
5. If the decision could affect architecture, API, database, or product behavior — **do not guess**.
6. Report the ambiguity and ask for clarification.

The agent must never invent a major product decision on its own.

---

## 26. Handling Conflicts

If two source documents conflict:
- Do not silently choose one.
- Identify the conflict clearly.
- Check whether the hierarchy in Section 3 resolves it (PRD.md is the highest-level requirement authority).
- If it doesn't resolve safely, report the conflict before making a risky change.

---

## 27. Dependency Rules

Before adding a new package:
- Is it actually required?
- Can the task be solved with the existing stack?
- Does it increase complexity?
- Does it conflict with the hackathon constraints?

Prefer existing dependencies. If a new one is genuinely required: use a stable, appropriate package, add it correctly to the dependency file, verify it works, and explain why it was added.

---

## 28. OpenCode Working Style

Work incrementally. A good task looks like:

> "Implement X according to Y document."

Not:

> "Build the entire application."

- Inspect before editing.
- Make focused changes.
- Test after changes.
- Avoid uncontrolled large rewrites.
- Report completed work and verification.

If a requested task is too large, break it into smaller logical steps rather than attempting one uncontrolled rewrite.

---

## 29. Agent Completion Report

At the end of a task, provide a concise report:

**Changed** — what files/features were changed.
**Why** — what requirement the change satisfies.
**Tests** — what tests/checks were run.
**Result** — whether they passed.
**Notes** — any limitations, unresolved issues, or decisions required.

Keep it short — no long explanations.

---

## 30. Never Do These Things

- Do not invent requirements.
- Do not add unnecessary features.
- Do not rewrite unrelated code.
- Do not expose secrets or hard-code API keys.
- Do not let the frontend call Gemini directly.
- Do not let AI control the authoritative Financial Health Score.
- Do not overwrite real financial data during a What-If simulation.
- Do not change API contracts casually.
- Do not change database structure without considering `DATA_MODEL.md`.
- Do not claim tests passed without running them.
- Do not claim a task is complete without verification.
- Do not introduce unnecessary technologies.
- Do not over-engineer the MVP.

---

## 31. Final Agent Checklist

Before declaring a task complete:

- [ ] Relevant documentation was read
- [ ] Existing code was inspected
- [ ] Task scope is understood
- [ ] Only required changes were made
- [ ] Architecture was respected
- [ ] Data model was respected
- [ ] API contract was respected
- [ ] Validation was handled
- [ ] Relevant tests/checks were run
- [ ] Actual behavior was verified
- [ ] No secrets were exposed
- [ ] No unrelated files were changed
- [ ] Documentation was updated if necessary
- [ ] git diff was reviewed
- [ ] Definition of Done is satisfied
- [ ] Final report clearly states what changed and what was verified
