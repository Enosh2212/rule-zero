# Phase 7 Codex Prompt — Tamper-Evident Audit and Replay

Inspect Phases 1–6 and implement Phase 7 only. Create typed actor, phase, event, reference, transition, session, append, verification, outcome, and export schemas. Use `AUDIT_SIGNING_KEY` to HMAC-link canonical redacted events. The stateless client carries the session; every append must verify the complete chain and validate one completed Phase 3–6 typed artifact without invoking any operational service.

Derive event meaning server-side, validate scenario/action/evaluation/approval/recovery and state-version relationships, reject contradictory caller decisions, redact sensitive keys/patterns and HTML, verify modification/deletion/insertion/reordering, and export JSON/Markdown without secrets.

Add an Audit & Replay panel with explicit start/verify/export/reset controls, automatic recording only after operations complete, manual retry on audit failure, chronological hashes and redacted summaries, outcome counts, and manual read-only replay. Replay must never call Worker, Interceptor, Gate, approval, or recovery endpoints or mutate live state. Run all tests/lint/build/diff/security audits, update documentation, and do not begin Phase 8.
