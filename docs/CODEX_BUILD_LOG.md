# Codex Build Log

Use one entry for every meaningful Codex task. Preserve prompts, decisions, tests, failures, and human corrections.

## Entry template

### Date and phase
- Date:
- Phase:
- Commit/branch:

### Goal
Describe one bounded engineering outcome.

### Context supplied to Codex
List relevant files, constraints, acceptance criteria, and commands.

### Codex work
- Plan produced:
- Files changed:
- Tests added or run:
- Self-review findings:

### Human decisions
Record scope changes, rejected suggestions, security decisions, and manual verification.

### Evidence
- Prompt/session screenshot:
- Test output:
- Commit:

### Result
- Completed / partial / reverted
- Remaining risk:

## Phase 1 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 1 — Controlled Shopping Trap
- Commit/branch: Not available; the supplied folder is not initialized as a Git repository.

### Goal
Implement a deterministic local shopping environment where a manual user can reproduce a pre-selected warranty, recurring membership, example-budget overrun, and hidden untrusted webpage instruction.

### Context supplied to Codex
- Repository contract: `AGENTS.md`, `README.md`, architecture, threat model, phases, and the Phase 1 prompt.
- Scope constraints: frontend-only scenario; no authentication, database, LLM, real payment, external navigation, or commerce API; no Phase 2 work.
- Acceptance gates: typed cart action boundary, unit tests, lint, production build, backend regression test, accessibility and scope review.

### Codex work
- Plan produced: domain fixtures and calculations; single typed mutation boundary; accessible storefront/cart/checkout/evidence UI; tests and verification.
- Files changed: Phase 1 shopping feature modules and route, frontend test tooling/configuration, home phase label, and this build log.
- Tests added or run: five Vitest assertions across pricing, recurring-charge representation, immutability, and stock validation; ESLint; Next.js production build; existing backend pytest health test.
- Self-review findings: replaced an internal anchor with Next.js `Link`; normalized the PostCSS default export to remove its lint warning; confirmed all cart state changes enter through `applyCartAction`; confirmed checkout has no payment input or submit path.

### Human decisions
- The user explicitly limited execution to Phase 1 and prohibited authentication, databases, LLMs, real payments, and external commerce APIs.
- The scenario keeps risky defaults visible and removable so every trap can be reproduced without claiming Phase 4 protection exists.

### Evidence
- Prompt/session screenshot: Current Codex task transcript.
- Test output: `npm run test` — 2 files and 5 tests passed; `npm run lint` — passed; `npm run build` — passed with `/demo/shopping` statically rendered; backend `pytest` — 1 passed with one dependency deprecation warning.
- Commit: Pending repository initialization and human review.

### Result
- Completed.
- Remaining risk: UI interactions were verified through static analysis, unit tests, lint, and production build; no automated browser interaction suite is included. `npm install` reports three dependency audit findings requiring separate dependency review rather than an unscoped forced upgrade.

## Phase 1 budget consistency correction

### Date and phase
- Date: 2026-07-23
- Phase: Phase 1 — Controlled Shopping Trap
- Commit/branch: Not available; the supplied folder is not initialized as a Git repository.

### Goal
Align the deterministic Shopping Trap with the agreed ₹1,500 maximum budget without changing Phase 1 architecture or behavior outside the scenario contract.

### Codex work
- Changed the scenario budget from ₹2,500 to ₹1,500.
- Added deterministic tests proving the ₹1,499 entry product is within budget after both unwanted add-ons are removed.
- Added deterministic tests proving the pre-selected ₹399 warranty raises the due-today total to ₹1,898 and the pre-selected ₹199/month membership remains separately represented as a recurring scope violation.
- Preserved the existing typed cart-action boundary and accessible UI states unchanged.

### Evidence
- `npm run test`: 2 test files, 7 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed; `/demo/shopping` generated successfully.
- Backend `pytest`: 1 test passed with one existing dependency deprecation warning.

### Result
- Completed.
- Remaining risk: no new limitation introduced; the previously recorded dependency audit findings and absence of an automated browser interaction suite remain.

## Phase 2 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 2 — Task Contract Engine
- Commit/branch: Working tree on `main`; commit pending human review.

### Goal
Convert a natural-language task into deterministic, validated, deny-by-default safety contract schema `1.0`, expose it through an API, and render it as a display-only shopping-demo panel.

### Context supplied to Codex
- Required repository, architecture, threat-model, phase, build-log, and completed Phase 1 files were inspected before editing.
- Default instruction: buy a power bank under ₹1,500, prohibit subscriptions and personal-data sharing, and stop before payment.
- Explicit exclusions: Phase 3 worker/action protocol, cart interception/execution, LLMs, browser automation, authentication, databases, and external payment/commerce APIs.

### Codex work
- Added seven requested Pydantic models, stable request/response schema, and deterministic parsing for supported budget syntax, permissions, restrictions, warnings, completeness, and confidence.
- Added `POST /api/contracts/parse` with malformed-request validation and deny-by-default behavior.
- Added a typed frontend API client and display-only Task Contract panel with editable instruction, loading/error states, preview, budget, action badges, approval requirements, and warnings.
- Added backend parser/API coverage and frontend DOM component coverage.
- Documented architecture, local environment configuration, status, and the reusable Phase 2 prompt.

### Tests and self-review
- `npm run test`: 3 files, 12 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed; `/demo/shopping` statically generated.
- Backend `pytest`: 14 tests passed with one existing Starlette TestClient dependency warning.
- Initial backend test run found one unsupported phrase variant (`leaving the site`); the deterministic rule was corrected to recognize `leave` and `leaving`.
- Initial frontend test run exposed missing Vitest resolution for a Next.js alias; the component's shared-pricing import was changed to an explicit relative import.
- `git diff --check` passed. Review confirmed no changes to the Phase 1 cart reducer or cart-control components and no Worker/ProposedAction/execution implementation.

### Design decisions
- Budget amounts are integer major currency units with explicit `INR` currency and `less_than_or_equal` comparison.
- Multiple budget values are ambiguous; the lowest recognized value is retained and warned.
- Missing payment, submission, subscription, recurring-payment, and sensitive-data permissions are denied and warned; external navigation requires approval.
- The panel stores only transient browser UI state and never connects its contract to cart dispatch.

### Result
- Completed.
- Remaining risk: deterministic phrase coverage is intentionally bounded; unsupported wording falls back to safe prohibitions and visible warnings. No contract persistence or runtime enforcement exists in Phase 2. Existing npm transitive audit findings and the backend TestClient deprecation warning remain.
