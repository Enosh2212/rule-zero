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

The Phase 3 worker is a deterministic, stateless simulator. It emits typed proposals only; it cannot change the cart, cross checkout, submit an order, or make a payment.

The frontend uses `NEXT_PUBLIC_API_URL` and safely defaults to `http://localhost:8000` for local development. Copy `frontend/.env.example` to `frontend/.env.local` only when you need to override that URL.

### Tests

```powershell
cd backend
pytest
```

## Product principle

No consequential action should execute only because a model requested it. Rule Zero combines deterministic policy checks, semantic threat analysis, human approval boundaries, and evidence-first auditing.

## Status

Phase 3 — deterministic Worker Action Protocol. Worker output is proposal-only; Rule Zero evaluation and action execution are reserved for later phases.
