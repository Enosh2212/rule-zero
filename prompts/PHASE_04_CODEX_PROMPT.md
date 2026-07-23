# Codex Task — Phase 4: Rule Zero Interceptor

Read repository instructions, phases, threat model, architecture, build log, and completed Phase 1–3 implementations before editing.

## Goal

Evaluate one typed Worker proposal against one validated Task Contract and controlled context, returning deterministic `allow`, `block`, or `ask_approval` without executing anything.

## Required implementation

- Add typed models for decisions, rule IDs/severity/findings, conflicts, consequences, context, request/response, and trace.
- Implement the documented RZ-BASE, BUDGET, CATEGORY, ADDON, SUB, RECUR, PAY, ORDER, DATA, NAV, SOURCE, DEFAULT, and FINISH rules.
- Resolve decisions using `BLOCK > ASK_APPROVAL > ALLOW` and document exact precedence.
- Distinguish immediate, recurring, projected, known, and unknown financial effects using integer INR.
- Expose stateless `POST /api/interceptor/evaluate`; return stable semantic results and `execution_occurred: false`.
- Add an evaluation-only frontend panel for the latest proposal with accessible decision text, findings, conflicts, trust, consequences, trace, raw JSON, history, loading/error/no-proposal states.
- Derive frontend context from canonical scenario data and the actual cart snapshot, never Worker price claims.
- Test every protected rule, precedence, stability, malformed input, UI decisions, history, errors, and cart/Worker/contract isolation.

## Boundaries

- Do not implement Phase 5 approval, override, recovery, or safe-continuation controls.
- Do not execute actions, mutate cart/contract, or advance Worker steps during evaluation.
- Do not add LLMs, browser automation, authentication, persistence, databases, real navigation, or payment.

## Verification

Run frontend tests, lint, production build, backend pytest, and `git diff --check`. Review the complete diff and audit for execution, mutation, Worker advancement, approval/recovery controls, Phase 5 behavior, external AI, browser automation, and persistence.
