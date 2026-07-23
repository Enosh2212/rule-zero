# Rule Zero

**A pre-action security layer for autonomous AI agents.**

Rule Zero evaluates an AI agent's proposed browser actions before execution. It allows safe actions, blocks policy violations, requests human approval for consequential actions, and records an evidence-backed audit trail.

## Hackathon MVP

The MVP uses controlled web environments to demonstrate realistic agent risks without browsing arbitrary malicious websites.

1. **Shopping Trap** — hidden subscription, pre-selected warranty, budget violation, and prompt injection.
2. **Scholarship Form** — excessive personal-data request, unapproved submission, and suspicious redirect.
3. **Travel Booking** — price drift, pre-selected insurance, upgrade pressure, and payment boundary.

## Core workflow

```text
User instruction
  -> Task Contract
  -> Worker proposes action
  -> Action Interceptor
  -> Policy + Threat Evaluation
  -> ALLOW / BLOCK / ASK
  -> Safe Recovery
  -> Audit Report
```

## Repository structure

```text
frontend/   Next.js mission-control and live-demo interface
backend/    FastAPI contracts, policy engine, orchestration, and audit API
docs/       Architecture, threat model, roadmap, testing, and Codex evidence
prompts/    Phase-scoped Codex prompts
```

## Local setup

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

- `/` — project landing page
- `/demo` — evaluator-focused nine-stage Guided Demo
- `/demo/shopping` — detailed Phase 1–7 Security Lab

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`

Task Contract API:

```text
POST http://localhost:8000/api/contracts/parse
```

Worker proposal API:

```text
POST http://localhost:8000/api/worker/propose
```

Rule Zero evaluation API:

```text
POST http://localhost:8000/api/interceptor/evaluate
```

The Phase 4 interceptor returns deterministic `ALLOW`, `BLOCK`, or `ASK_APPROVAL` decisions with rule findings, contract conflicts, consequence assessment, and trace. `execution_occurred` is always false.

The Phase 3 worker is a deterministic, stateless simulator. It emits typed proposals only; it cannot change the cart, cross checkout, submit an order, or make a payment.

The frontend uses `NEXT_PUBLIC_API_URL` and safely defaults to `http://localhost:8000` for local development. Copy `frontend/.env.example` to `frontend/.env.local` only when you need to override that URL.

### Tests

```powershell
cd backend
pytest
```

## Phase 5 Safe Action Gate APIs

```text
GET  http://localhost:8000/api/scenarios/shopping-trap/state
POST http://localhost:8000/api/actions/execute
POST http://localhost:8000/api/approvals/decide
```

Phase 5 adds manual, server-revalidated execution for controlled local Shopping Trap state. `ALLOW` requires an explicit click, `BLOCK` is refused, and `ASK_APPROVAL` requires an exact action/contract/state-bound decision. Payment, order submission, data disclosure, and real navigation never execute. Autonomous recovery remains reserved for Phase 6.

## Phase 6 Safe Recovery APIs

```text
POST http://localhost:8000/api/recovery/plan
POST http://localhost:8000/api/recovery/execute-step
```

The deterministic recovery planner classifies a verified failure, preserves the original Task Contract, and returns an HMAC-bound ordered plan. Each replacement action still requires an explicit click and passes through the existing Rule Zero Interceptor and Safe Action Gate. Recovery never retries payment, overrides `BLOCK`, raises the budget, or auto-approves an action.

## Phase 7 Audit APIs

```text
POST http://localhost:8000/api/audit/start
POST http://localhost:8000/api/audit/append
POST http://localhost:8000/api/audit/verify
POST http://localhost:8000/api/audit/export
```

Phase 7 records completed Phase 3–6 artifacts into a stateless HMAC-linked event chain. The backend validates artifact relationships and state continuity, redacts sensitive material, verifies tampering, and exports JSON or Markdown. Manual replay reads recorded events only and never invokes Worker, Interceptor, approval, execution, or recovery operations.

## Product principle

No consequential action should execute only because a model requested it. Rule Zero combines deterministic policy checks, semantic threat analysis, human approval boundaries, and evidence-first auditing.

## Guided Demo

The Phase 8 Guided Demo coordinates the existing Phase 2–7 typed APIs into one deterministic Shopping Trap walkthrough. Every operational transition remains an explicit user click. The frontend does not make policy decisions, auto-execute allowed actions, auto-approve requests, override blocks, or auto-run recovery.

Rule Zero evaluates consequential agent actions before execution.

## Status

Phase 8 — guided evaluator experience and UI consolidation. The detailed Security Lab remains available. Phase 9 has not begun.
