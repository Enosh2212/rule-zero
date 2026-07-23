# Phase 6 Codex Prompt — Safe Recovery Planner

Inspect Phases 1–5 and implement Phase 6 only. Add typed deterministic recovery triggers, strategies, steps, plans, traces, completion states, requests, and responses. Verify the triggering action/evaluation/current-state binding, recompute the trigger using canonical backend data, preserve the original Task Contract fingerprint, and HMAC-bind every ordered replacement action.

Add `POST /api/recovery/plan` and `POST /api/recovery/execute-step`. Execute exactly one user-selected step by delegating to the existing Phase 5 Safe Action Gate, which must re-run Phase 4. Never mutate state directly, auto-run a next step, auto-approve, retry payment, transform `BLOCK`, raise budget, activate subscriptions, submit orders, disclose data, or navigate externally.

Add a Safe Recovery panel with explicit generate/execute/skip/reset controls, a text-labelled failure-to-outcome timeline, constraints, strategies, ordered steps, expected state, full/partial outcome, warnings, trace, raw JSON, errors, and the existing Phase 5 approval flow. Update recovery documentation and build evidence. Run frontend tests/lint/build, backend pytest, `git diff --check`, complete the forbidden-functionality audit, and do not begin Phase 7.
