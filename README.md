
# AI Financial Copilot 💰

> An AI-powered financial decision-support tool for Pakistan — built for the Al Khidmat x Alibaba Cloud AI Hackathon (Open Innovation Track).

Most finance apps tell you what already happened. **AI Financial Copilot** tells you how healthy your finances are, why, and what to do next — and lets you test decisions before making them in real life.

---

## 🚩 The Problem

People can already see their transaction history. What they can't easily do is answer two questions:

1. **"Am I financially healthy?"** — no simple way to judge overall financial condition or what's dragging it down.
2. **"What happens if I keep spending like this — and what should I change?"** — users see the past, not the future.

## ✅ The Solution

| Component | What it does |
|---|---|
| **Financial Health Score** | Transparent, formula-based score (e.g. 72/100) from income, expenses, and savings — with a plain-language reason and improvement tips |
| **AI Copilot** | Contextual chat that uses the user's actual financial data to answer budgeting, saving, and spending questions |
| **What-If Simulator** | Adjust an expense and instantly see the effect on savings, score, and goal progress |
| **Urdu + English** | Full experience — UI and Copilot answers — works in either language |

**Positioning:** this is an *AI Financial Decision Support tool*, not another expense tracker, and not "just an AI chatbot." The score is a deterministic, explainable formula — AI is used only where it adds real value: holding a contextual conversation and explaining the score in plain language.

---

## 🌍 Real-World Scenarios

These aren't abstract features — here's the actual problem each one solves for a real user in Pakistan:

### Scenario 1: "I get my salary but don't know where it goes"
**Ali**, a junior software engineer in Karachi, earns a fixed salary. By the 25th of every month he's low on cash but has no idea why — his banking app just shows a list of transactions, not a diagnosis.
→ **Financial Health Score** looks at his income, expenses, and savings and tells him: *"Your score is 58/100 — mainly because your food + delivery spending is 40% of your income, well above a healthy range."* Now he knows the actual cause, not just the symptom.

### Scenario 2: "Should I really cut my food budget, or will it not even matter?"
**Ali** wants to save more but doesn't know if cutting Foodpanda orders actually moves the needle, or if rent is the real problem.
→ **What-If Simulator**: he drags his food expense down by Rs. 5,000 and *instantly* sees his savings go up, his score jump from 58 → 67, and his goal (e.g. an emergency fund) get 2 months closer. No spreadsheet, no guessing — a real before/after, in seconds.

### Scenario 3: "I don't want a generic chatbot, I want advice about MY money"
**Ali** asks ChatGPT for budgeting tips and gets generic advice ("try the 50/30/20 rule") that ignores his actual numbers.
→ **AI Copilot** has his real income/expense data as context, so it answers *"Based on your current spending, hitting 50/30/20 means cutting your food budget by roughly Rs. 6,000/month — here's how."* Grounded, not generic.

### Scenario 4: "Financial tools assume I'm comfortable in English"
**Ali's mother**, or a user less comfortable with English, wants the same insight but in Urdu — not just translated button labels, but an Urdu conversation with the Copilot itself.
→ **Urdu + English mode** makes the entire experience — score explanation, Copilot chat, suggestions — usable in the language the user actually thinks in. This is the difference between a tool built *for* Pakistan vs. one just *localized* for it.

### Scenario 5 (stretch): "I pay into a committee (BC) — can I trust the other members?"
Committees (BC/ROSCA) run entirely on informal trust; people default and there's no record of who's reliable.
→ **Committee Trust Score** (optional) gives a simple, transparent score from mock payment history — a small step toward making informal savings groups less risky, without pretending to be a lending platform.

**Why this matters for judges:** every "must-have" feature maps to a specific, named user moment above — this isn't feature-creep, it's one coherent flow solving one connected problem (understand → decide → act).

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Backend / API | Python + FastAPI |
| Database | SQLite |
| AI Copilot | Qwen (via Alibaba Cloud) |
| Frontend | Simple web framework (team's choice) |

No live bank integration, no ML-based scoring, no production infra — kept deliberately simple for a hackathon build. See `PRD.md` / `ARCHITECTURE.md` for full technical detail.

---

## 🎬 Demo Flow

1. Select Urdu or English
2. Enter sample financial data (manual entry)
3. View Financial Health Score + reasons + improvement tips
4. Ask the AI Copilot a financial question — get an answer grounded in your own numbers
5. Open the What-If Simulator, change an expense, instantly see the impact on savings, score, and goal progress

---

## 🎯 MVP Scope (Must-Have)

- Manual financial data input (income, expenses, savings, one goal)
- Financial Health Score (rule-based, explainable)
- AI Copilot (Qwen-powered, data-aware)
- What-If Simulator (deterministic, same formula as the score)
- Urdu + English support
- Simple dashboard

**Explicitly out of scope:** live bank APIs, real transactions/lending, ML fraud detection, P2P lending, enterprise-grade auth/scalability. Full list in `PRD.md`.

## 🌱 Optional / Stretch (only if time remains)

- Committee (BC/ROSCA) Trust Score
- Irregular Income Mode for freelancers
- Proactive spending warnings
- Financial Future projection chart
- Basic gamification (streaks/badges)

---

## 👥 Team

4-person team, Al Khidmat x Alibaba Cloud AI Hackathon:

| Role | Focus |
|---|---|
| Team Lead / Frontend-UI | Dashboard, What-If Simulator UI, language switch |
| Core AI / Backend | Qwen integration, Financial Health Score formula, API |
| Unique Feature | Committee Trust Score |
| Presentation / Pitch | Demo prep, pitch |

---

## 📂 Repo Structure

```
├── backend/          # FastAPI app, scoring logic, Qwen integration
├── frontend/          # Dashboard, Copilot chat UI, What-If Simulator
├── PRD.md             # Full product requirements
├── ARCHITECTURE.md    # Technical architecture detail
└── README.md
```

*(adjust to match your actual folder layout before pushing)*

---

## 🚀 Getting Started

```bash
# clone
git clone https://github.com/<your-org>/ai-financial-copilot.git
cd ai-financial-copilot

# backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# frontend
cd ../frontend
npm install
npm run dev
```

*(fill in real setup steps once your backend/frontend scaffolding is committed — this is a placeholder)*

---

## 📌 Success Criteria

- Full demo flow works start to finish, no errors
- What-If Simulator's value is clear to a judge within seconds
- Copilot visibly uses the user's own data, in both languages
- Product still makes sense with every optional feature removed
- Alibaba Cloud (Qwen) usage is clearly shown in the pitch

---

Built for the **Al Khidmat x Alibaba Cloud AI Hackathon** (Open Innovation Track).
