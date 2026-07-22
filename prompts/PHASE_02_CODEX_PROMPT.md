# Codex Task — Phase 2: Task Contract Engine

Read `AGENTS.md`, `README.md`, `docs/PHASES.md`, `docs/THREAT_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/CODEX_BUILD_LOG.md`, and inspect the completed Phase 1 implementation before editing.

## Goal

Convert a user's natural-language shopping task into a deterministic, validated, versioned safety contract for later phases. Use no LLM.

Default instruction:

> Buy a power bank under ₹1,500. Do not add subscriptions. Do not share personal information. Stop before payment.

## Required implementation

- Add the seven requested typed Pydantic contract and HTTP models.
- Parse supported INR budgets, item category, payment/stop boundaries, subscriptions, recurring payments, sensitive-data sharing, form submission, and external-navigation approval.
- Apply deny-by-default safety rules and return visible parse warnings.
- Expose `POST /api/contracts/parse` with stable structured JSON.
- Add a display-only Task Contract panel to `/demo/shopping` using `NEXT_PUBLIC_API_URL` with a safe local default.
- Test parser behavior, validation, response stability, UI rendering, warnings, prohibited permissions, and API errors.
- Update architecture, README, environment example, and the Codex build log.

## Boundaries

- Do not begin Phase 3 or define a Worker/ProposedAction protocol.
- Do not intercept or execute cart actions.
- Do not add an LLM, browser automation, authentication, database, or external commerce/payment integration.
- Preserve the Phase 1 typed cart-action boundary.

## Verification

Run frontend tests, frontend lint, frontend production build, and backend pytest. Review the Git diff and search for accidental Phase 3 functionality before completion.
