# Release Readiness Checklist

Verdict: **CONDITIONAL GO for controlled hackathon evaluation; NO-GO for production deployment.**

## Functional and safety readiness

- [x] Functional Guided Demo and Security Lab flows pass unit, integration, and browser tests.
- [x] Safety-policy matrix passes all 26 adversarial cases.
- [x] Execution boundary freshly re-evaluates and BLOCK remains terminal.
- [x] Approval is action/contract/state bound and never automatic.
- [x] Recovery is signed, preserves constraints, and executes one explicit step.
- [x] Audit chain, redaction, relationship checks, export, and replay isolation pass.
- [x] Guided Demo requires explicit controls and rejects rapid duplicate operations.

## UI readiness

- [x] Desktop 1440×900 has no horizontal overflow.
- [x] Tablet 820×1180 has no horizontal overflow.
- [x] Mobile 390×844 has no horizontal overflow.
- [x] Primary controls are keyboard reachable with visible focus.
- [x] Controls have accessible names; prerequisites are truly disabled.
- [x] ALLOW, BLOCK, and ASK APPROVAL are communicated in text.
- [x] Backend errors use an accessible alert.
- [ ] Full WCAG/manual assistive-technology audit — deployment prerequisite.

## Automated verification

- [x] Frontend Vitest: 65 tests.
- [x] Backend pytest: 133 tests.
- [x] Targeted adversarial evaluations: 26 tests.
- [x] Chromium Playwright: 9 tests.
- [x] Frontend lint and production build.
- [x] CI workflow covers push and pull request.
- [x] CI installs Node 22, Python 3.13, Chromium system dependencies, and runs all suites.
- [x] Whitespace and lightweight secret checks are in CI.

## Dependencies

- [x] Backend `pip-audit`: no known vulnerabilities in resolved requirements.
- [x] Frontend full and production-tree `npm audit` reviewed.
- [ ] Resolve or formally reaccept Next/PostCSS/sharp advisories before production.
- [ ] Add a reproducible backend lock/constraints artifact before production.

## Environment and production controls

- [x] Development localhost CORS fallback is explicit.
- [x] Production requires `CORS_ORIGINS`; localhost is rejected.
- [x] Production requires three strong, non-placeholder signing keys.
- [x] Signing keys are backend-only and absent from API models/responses.
- [x] `NEXT_PUBLIC_API_URL` is configurable.
- [x] No sensitive request-body logging was introduced.
- [x] Strict typed request validation remains enabled.
- [ ] Configure deployment secrets and public origins in the eventual hosting platform.
- [ ] Confirm TLS, logging, monitoring, rate limits, and rollback automation in Phase 10.

## Known limitations

- Deterministic Shopping Trap only; no arbitrary live browsing.
- No authentication, persistence, database, or real-world actions.
- Structured provenance and typed consequence inputs remain trust assumptions.
- Stateless audit proves submitted-chain integrity, not completeness.
- Secret scan is lightweight and current-tree only.

## Rollback approach

No deployment exists in Phase 9. Before any future release, create an immutable versioned artifact and retain the previous known-good version. A rollback must restore frontend and backend together because typed contracts are version-coupled. Never roll back by weakening signing-key or CORS validation.

## Final decision

The controlled evaluator build is a **CONDITIONAL GO** because all required deterministic checks pass. Public production release is **NO-GO** until Phase 10 deployment prerequisites, dependency disposition, production secrets/origins, observability, and operational rollback are completed.
