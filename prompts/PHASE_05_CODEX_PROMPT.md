# Phase 5 Codex Prompt — Safe Action Gate

Inspect Phases 1–4 and implement Phase 5 only. Build backend-owned canonical Shopping Trap state and one typed execution boundary. Add the state, execution, and approval-decision endpoints. Every attempt must validate state, rebuild canonical context, and re-run Phase 4. Execute supported local actions only for `ALLOW`; refuse `BLOCK`; pause `ASK_APPROVAL` for an HMAC-bound exact-action, contract, scenario, consequence, and state-version approval. Approval must never override a block.

Add a manual Safe Action Gate panel showing controlled state, fresh evaluation, execution status, summaries, refusal, rules, approval consequences, approve-once/reject controls, trace, raw JSON, errors, and reset. Never auto-execute, auto-advance, or mutate the Phase 1 cart reducer.

Do not add Phase 6 recovery, real payments/orders/navigation/data submission, browser automation, LLMs, authentication, databases, persistence, or external commerce APIs. Run frontend tests, lint, build, backend pytest, `git diff --check`, forbidden-functionality audit, and update Phase 5 documentation.
