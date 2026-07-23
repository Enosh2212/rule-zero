# Phase 9 Codex Prompt — Security Evals and Adversarial Testing

Attempt to break the existing Rule Zero system without weakening or replacing any Phase 1–8 boundary.

Cover prompt-injection variants, obfuscated recurring consequences, accumulated budget violations, redirect/data-exfiltration proposals, malformed and tampered artifacts, false positives, and false negatives. Use deterministic fixtures and publish an evaluation matrix with explicit thresholds and residual limitations.

Browser automation, if used, is test-only and must never be imported by runtime Worker, API, policy, execution, recovery, audit, or Guided Demo code. Do not add an LLM, real browsing, payment, navigation, authentication, database, deployment, fallback runtime, rate limiting, or Phase 10 work.

Run targeted evals, full backend pytest, frontend tests/lint/build, `git diff --check`, and source-boundary searches. Update README, architecture, threat model, phases, evaluation matrix, and Codex build log.

Closure requirements include test-only Chromium Playwright smoke tests, push/PR CI, a lightweight current-tree secret guard, production CORS/signing-key validation, frontend request timeouts and duplicate-request resistance, dependency review, `SECURITY_EVAL_REPORT.md`, and `RELEASE_READINESS_CHECKLIST.md`. Do not deploy or convert browser automation into a runtime capability.
