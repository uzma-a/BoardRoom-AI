# 🏛️ Boardroom AI

**Your AI Board of Directors.**

Boardroom AI is a multi-agent decision-support app. Submit a business idea and six AI executives (CTO, CFO, Marketing, Legal, Risk and CEO) analyze it independently, compare their findings with a deterministic debate step, and return one cited resolution. Every session is saved, and you can keep questioning the board afterwards.

> Six perspectives. One decision. No single point of failure.

---

## Table of Contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Key engineering decisions](#key-engineering-decisions)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Trying it out](#trying-it-out)
- [Security](#security)
- [Resilience and error handling](#resilience-and-error-handling)
- [API reference](#api-reference)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## What it does

Most AI tools give you one model's opinion on a business idea. Boardroom AI runs a board meeting:

- **CTO**: technical feasibility, AI/ML complexity, scalability
- **CFO**: development cost, revenue model, financial risk
- **Marketing**: market size, competitors, go-to-market strategy
- **Legal**: compliance, licensing, regulatory risk
- **Risk**: cross-cutting execution, market and product risk, written after reviewing where the specialists agree and disagree
- **CEO**: one final resolution that cites each specialist by name

Features:

- **Live board meeting.** Each executive's status streams to the dashboard as it changes (waiting, thinking, done), followed by a debate timeline.
- **Executive report.** Board resolution, scorecard, per-executive votes, detailed analysis with sources, recommended next steps, and PDF export.
- **Session history.** Completed sessions are saved, listed in History, and can be reopened and re-exported.
- **Ask the Board.** Ask follow-ups such as "Why?" or "What if we cut the price by 30%?". Answers come from the saved findings, name the specialist behind each point, and say so when a question goes beyond what the board analyzed. Conversations are remembered per session.
- **Clean sources.** Search-grounding links are resolved to real URLs, and expired ones are dropped, so the report shows domains like `wikipedia.org`.

---

## How it works

```
1. Submit an idea
        ↓
2. Four specialists analyze in parallel (CTO, CFO, Marketing, Legal)
        ↓
3. Debate Engine compares their votes, confidence and language,
   deterministically, with no LLM call and no invented dialogue
        ↓
4. Risk agent reviews the debate's conflicts and synthesizes cross-cutting risk
        ↓
5. CEO agent cites every specialist by name and issues the resolution
        ↓
6. The resolution is saved to history; you can reopen it and ask follow-ups
```

---

## Architecture

```
┌─────────────┐      SSE / REST      ┌──────────────┐
│  Frontend    │ ───────────────────▶ │   Backend    │
│  (Next.js)   │ ◀─────────────────── │  (FastAPI)   │
└─────────────┘                      └──────┬───────┘
                                             │
                                    ┌────────▼─────────┐
                                    │   Coordinator     │
                                    │  (Google ADK)     │
                                    └────────┬─────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        ▼                    ▼                    ▼
                 ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
                 │ CTO/CFO/    │     │ Debate Engine │     │  Risk & CEO  │
                 │ Marketing/  │────▶│ (deterministic│────▶│    Agents    │
                 │ Legal       │     │  comparison)  │     │              │
                 └─────────────┘     └──────────────┘     └──────┬───────┘
                        │                                         │
                        ▼                                         ▼
                 ┌──────────────────────────────┐        ┌────────────────┐
                 │ Gemini 2.5 Flash + Google     │        │ SQLite history │
                 │ Search grounding              │        │ + follow-up Q&A│
                 └──────────────────────────────┘        └────────────────┘
```

Every LLM-backed agent is wrapped in a `SafeAgentWrapper`. If one agent fails (rate limit, API error), it degrades to a flagged fallback finding instead of crashing the session.

---

## Key engineering decisions

| Decision | Why |
|---|---|
| **Debate Engine is rule-based, not an LLM** | A "debate" produced by another LLM call would be invented dialogue that looks authoritative. This step compares real votes, confidence gaps and overlapping risk language, so the same findings always give the same summary and every claim traces back to a field on a finding. |
| **Per-agent failure isolation** (`SafeAgentWrapper`) | One failed Gemini call shouldn't discard four good analyses. A failed agent becomes a flagged finding with 0 confidence and a neutral vote, so it can't skew the tally. |
| **SSE streaming with a batch fallback** | Live updates need streaming, but some networks block long-lived connections. If the stream never opens, the frontend calls the batch endpoint and replays the real response as paced events. |
| **Prompt injection defense in depth** | User input is fenced as data in every prompt. Specialist outputs are fenced again before Risk and CEO read them, since they're derived from untrusted input. |
| **Least-privilege tools** | A hardcoded allowlist per agent. Risk and CEO have no external tools at all, and violations fail at startup. |
| **Follow-ups are one grounded call, not a re-run** | Questions are answered from the saved resolution with a single tool-free Gemini call. That's cheap and fast, and the model is told to label anything beyond the record as its own extrapolation. |
| **Grounding links resolved at write time** | Gemini's search-grounding redirects expire. They're resolved to real URLs right after the run, while they still work, and dead ones are dropped. |
| **Typed contracts end to end** | Pydantic models on the backend, mirrored TypeScript types on the frontend, so schema drift shows up as a compile error. |

---

## Tech stack

**Backend**
- Python, FastAPI (REST and Server-Sent Events)
- Google Agent Development Kit (`SequentialAgent`, `ParallelAgent`, custom `BaseAgent`)
- Gemini 2.5 Flash with Gemini's built-in Google Search grounding
- SQLAlchemy and SQLite for session history
- Model Context Protocol (MCP) web-search integration, available behind a config flag
- httpx, Pydantic

**Frontend**
- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS, Framer Motion, Lucide icons
- Custom reducer and Context for live session state
- jsPDF for client-side, code-split PDF export

**Practices**
- Defense-in-depth security, graceful degradation, accessibility (contrast audit, keyboard navigation, skip links), code-splitting and memoization.

---

## Project structure

```
Boardroom AI/
├── backend/
│   ├── agents/        # CTO, CFO, Marketing, Legal, Risk, CEO, coordinator, SafeAgentWrapper, follow-up agent
│   ├── api/           # /api/analyze, /api/stream, /api/sessions, /api/sessions/{id}/ask
│   ├── debate/        # Deterministic Debate Engine
│   ├── mcp_servers/   # Optional MCP integrations (web search, filesystem)
│   ├── memory/        # Live session state + SQLite history (db.py)
│   ├── models/        # Pydantic schemas (AgentFinding, BoardResolution, ...)
│   ├── prompts/       # Per-agent system prompts
│   ├── security/      # Validation, injection defense, rate limiting, tool allowlists
│   ├── utils/         # Logging, exceptions, parsing, grounding-link resolver
│   ├── config.py
│   ├── main.py
│   └── requirements.txt
│
└── boardroom-ai-frontend/
    ├── app/
    │   ├── (marketing)/   # Landing, Architecture, About
    │   └── dashboard/     # Dashboard + history list and detail pages
    ├── components/
    │   ├── ui/            # Design-system primitives
    │   ├── board/         # Agent cards, debate timeline
    │   ├── report/        # Executive report, scorecard, PDF export
    │   ├── history/       # Session list, session detail, Ask the Board chat
    │   ├── dashboard/     # Sidebar, top nav, idea input
    │   └── marketing/     # Landing page sections
    ├── context/           # Board session provider
    ├── hooks/
    ├── lib/
    │   ├── api/           # SSE stream, batch fallback, sessions and follow-up clients
    │   ├── board/         # Reducer, event mapping, replay logic
    │   └── pdf/           # PDF generator
    ├── types/             # Shared TypeScript contracts
    └── package.json
```

---

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- A Google Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Backend

```bash
cd backend
python -m venv venv

source venv/bin/activate        # macOS/Linux
venv\Scripts\Activate.ps1       # Windows PowerShell

pip install -r requirements.txt

cp .env.example .env            # Windows: copy .env.example .env
# Edit .env and set GOOGLE_API_KEY

uvicorn main:app --reload --port 8000
```

Check it's running at [http://localhost:8000/health](http://localhost:8000/health). The SQLite history file is created automatically on first start.

### Frontend

```bash
cd boardroom-ai-frontend
npm install

cp .env.example .env.local      # Windows: copy .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL should point at the backend, e.g. http://localhost:8000

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Both servers need to be running, so use two terminals.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `GOOGLE_API_KEY` | Gemini API key | `AIza...` |
| `GEMINI_MODEL_PRO` / `GEMINI_MODEL_FLASH` | Model names | `gemini-2.5-flash` (free-tier keys have no quota for `gemini-2.5-pro`) |
| `ALLOWED_ORIGINS` | CORS allowlist; set to your frontend origin when deployed | `["http://localhost:3000"]` |
| `MCP_WEB_SEARCH_ENABLED` | Use the MCP web-search server instead of Gemini's built-in search | `false` |
| `MCP_FILESYSTEM_ENABLED` | Provision the filesystem MCP server (not used by the pipeline) | `false` |
| `RATE_LIMIT_PER_MINUTE` | Requests per client per minute | `10` |

See `backend/.env.example` for the full list.

### Frontend (`boardroom-ai-frontend/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL | `http://localhost:8000` |

---

## Trying it out

1. Open the dashboard and submit an idea, for example:
   > *A subscription box that delivers artisanal coffee from small-batch US roasters, with a mobile app to rate beans and personalize shipments.*
2. Add a target market (for example `United States`). It changes the analysis, so clear it between unrelated ideas.
3. Watch the six executive cards move from *Waiting* to *Thinking* to *Analysis complete*, then read the debate timeline.
4. Review the board resolution, expand the detailed analysis, and export the PDF.
5. Use **Ask the Board** under the report ("What would change the board's decision?"), then open **History** to find the session again later.

Ideas with real regulatory friction (crypto lending in India, importing coffee into India) are good for seeing the board disagree. Low-risk domestic ideas tend to draw more approvals.

---

## Security

- **Prompt injection defense.** Every idea and follow-up question is fenced as data in the prompt, and findings are re-fenced before downstream agents read them.
- **Per-agent tool allowlisting.** Risk and CEO have no external tools.
- **Rate limiting.** A sliding-window limiter per client on the analysis and follow-up endpoints.
- **Input and file validation.** Idea length and content are checked before any agent sees them. Session ids are format-validated. File exports are sandboxed, extension-allowlisted and size-limited.
- **No secrets in logs.** API keys are redacted, and error responses never include stack traces.

---

## Resilience and error handling

- **`SafeAgentWrapper`.** One failed agent becomes a flagged fallback instead of aborting the session. This also covers API quota exhaustion (429) and Gemini overload (503).
- **SSE with batch fallback.** The dashboard falls back to `/api/analyze` and replays the response if streaming can't connect.
- **Failed runs aren't saved.** A session where every agent failed is skipped, so history only holds useful reports.
- **PDF text sanitization.** Characters the PDF base font can't render (such as ₹ and smart quotes) are converted instead of showing as broken glyphs.

---

## API reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/analyze` | POST | Batch analysis. Returns the complete `BoardResolution` |
| `/api/stream` | GET | Live SSE stream: `agent_started`, `agent_finished`, `debate_summary`, `resolution`, `error`, `done` (the `done` event carries the saved `session_id`) |
| `/api/sessions` | GET | Summaries of saved sessions, newest first |
| `/api/sessions/{id}` | GET | The full stored resolution for one session |
| `/api/sessions/{id}/ask` | POST | Ask a follow-up question; body is `{question, history}` |

---

## Known limitations

- **Gemini free-tier quota is 20 requests/day.** A board session uses 6 calls and each follow-up uses 1, so heavy testing runs out quickly. Quotas reset at midnight Pacific Time. Enabling billing on the key removes the cap.
- **Gemini can return 503 under load.** Affected agents fall back to flagged findings. Re-running usually fixes it, and automatic retry is on the roadmap.
- **History uses a local SQLite file**, so it won't survive redeploys on hosts with ephemeral disks. Point it at a hosted database for real persistence.
- **No authentication.** Sessions aren't tied to a user, and anyone with the app URL can see saved sessions.
- **Follow-up conversations are stored in the browser** (`localStorage`), not the database, so they don't sync across devices.
- **No chat after a batch-fallback run.** That response carries no session id. Open the session from History instead.
- **The MCP web-search server** needs Node.js/`npx` and an API key for its provider. It's off by default and agents use Gemini's built-in search grounding.

---