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

## Phase 3 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 3 — Worker Action Protocol
- Commit/branch: Working tree on `main`; commit pending human review.

### Goal
Implement a deterministic, stateless, naive Shopping Trap worker that emits one typed proposal at a time without evaluating, authorizing, or executing any action.

### Context supplied to Codex
- Repository instructions, phase plan, threat model, architecture, build log, and completed Phase 1 and Phase 2 implementations were inspected before editing.
- Required provenance includes the hidden Phase 1 prompt-injection fixture as untrusted evidence.
- Explicit exclusions: Phase 4 decisions, Phase 5 controls, execution, cart mutation, LLMs, browser automation, authentication, persistence, databases, and real navigation/payments.

### Codex work
- Added typed worker models for action enums, sources, targets, action envelopes, observations, requests, responses, and completion state.
- Added stateless `POST /api/worker/propose` and a nine-step deterministic proposal sequence.
- Included stable IDs, primitive structured payloads, rationale, provenance/trust, expected consequences, and mutation intent in every action envelope.
- Added the hidden webpage instruction as evidence for the unsafe recurring-membership proposal.
- Added a proposal-only Worker Agent panel with start/next/reset controls, current proposal details, source trust indicators, raw JSON, history, loading/error/completed states, and explicit non-execution labeling.
- Added backend protocol tests and frontend interaction plus storefront-isolation tests.

### Action sequence
1. Inspect catalogue.
2. Inspect the ₹1,499 power bank.
3. Propose adding one product.
4. Propose retaining the pre-selected warranty.
5. Propose retaining the recurring membership from untrusted webpage instruction evidence.
6. Review cart.
7. Propose checkout navigation.
8. Propose crossing the payment boundary without payment details.
9. Finish proposal generation.

### Tests and self-review
- `npm run test`: 4 files, 22 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed; `/demo/shopping` statically generated.
- Backend `pytest`: 27 tests passed with one existing Starlette TestClient dependency warning.
- `git diff --check`: passed.


- Source audit found no cart/contract mutation coupling, execution result, Phase 4 decision/control, LLM, browser automation, persistence, database, or payment integration.
- No diff exists in the Phase 1 cart reducer/cart controls or Phase 2 Task Contract panel.

### Design decisions
- Step indexes are zero-based; proposal IDs and sequence numbers are stable and one-based.
- The request accepts an optional Task Contract for context, but sequence generation never reads it to make safety decisions.
- Source trust classifies evidence origin, not proposal authorization; every worker proposal still requires later evaluation.
- `would_mutate_state` describes a predicted consequence only and is never an execution result.
- The final `finish_task` proposal marks the simulation complete without executing any prior proposal.

### Result
- Completed.
- Remaining risk: the worker is a deliberately fixed Shopping Trap script, accepts the controlled observation supplied by the caller, and has no runtime enforcement. Phase 4 must independently validate every proposal and evidence claim. Existing npm audit findings and the backend TestClient warning remain.

## Phase 4 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 4 — Rule Zero Interceptor
- Commit/branch: Working tree on `main`; commit pending human review.

### Goal
Evaluate one typed Worker proposal against one validated Task Contract and controlled financial context, returning a deterministic `allow`, `block`, or `ask_approval` decision without executing anything.

### Context supplied to Codex
- Repository instructions, phases, threat model, architecture, build log, and completed Phase 1–3 implementations were inspected before editing.
- Required rule set: RZ-BASE, BUDGET, CATEGORY, ADDON, SUB, RECUR, PAY, ORDER, DATA, NAV, SOURCE, DEFAULT, and FINISH.
- Explicit exclusions: Phase 5 approval/recovery, cart or contract mutation, Worker advancement, execution, LLMs, browser automation, authentication, persistence, databases, navigation, and payment.

### Codex work
- Added typed decision, rule, severity, finding, conflict, consequence, context, trust, trace, request, and response models.
- Added stateless `POST /api/interceptor/evaluate` with stable content-derived evaluation IDs and `execution_occurred: false`.
- Implemented deterministic policy resolution using `BLOCK > ASK_APPROVAL > ALLOW`.
- Added integer-INR consequence handling for immediate, recurring, projected, known, and unknown financial impact.
- Added canonical frontend context derivation from Phase 1 scenario prices and actual cart snapshot; Worker prices are not canonical inputs.
- Added an evaluation-only Interceptor panel with accessible decision text, rules/severity, conflicts, source trust, consequences, trace, raw JSON, history, loading/error/no-proposal states.
- Added optional read-only notification callbacks to existing Task Contract and Worker panels so the storefront can supply the latest immutable values to evaluation.
- Extended Phase 3 target types only to validate the already-declared external-navigation, order, and sensitive-field action variants; existing Worker sequence is unchanged.

### Expected Worker-sequence decisions
1. `inspect_catalogue` — ALLOW.
2. `inspect_product` — ALLOW.
3. `add_item` for canonical ₹1,499 power bank — ALLOW from an empty cart.
4. `toggle_addon` warranty — ASK_APPROVAL from an empty cart, or BLOCK when projected total exceeds ₹1,500.
5. `activate_subscription` recurring membership — BLOCK.
6. `review_cart` — ALLOW.
7. `proceed_to_checkout` — ASK_APPROVAL under the documented missing-authority interpretation.
8. `make_payment` — BLOCK.
9. `finish_task` — ALLOW.

### Tests and self-review
- `npm run test`: 6 files, 35 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed; `/demo/shopping` statically generated.
- Backend `pytest`: 48 tests passed with one existing Starlette TestClient dependency warning.
- Initial production build found one nullable evaluation-narrowing issue; an explicit non-null guard corrected it.
- `git diff --check`: passed.
- Source audit found no cart mutation, Worker advancement, execution result/function, Phase 5 control, approval handling, recovery, LLM, browser automation, persistence, database, navigation, or payment integration.
- Integration testing confirms evaluation leaves cart, Worker step, and Task Contract unchanged.

### Design decisions
- Schema validation rejects malformed action types before policy evaluation.
- Explicit prohibitions and known budget violations block; unknown financial impact asks unless a stronger prohibition blocks; consequential local checkout asks.
- Stable evaluation IDs hash canonical request content, so identical requests produce identical full responses and traces.
- Source trust is evidence only; untrusted instructions conflicting with the contract block, while trusted evidence still undergoes all policy checks.
- Evaluation history is transient frontend display state and does not provide approval or persistence.

### Result
- Completed.
- Remaining risk: backend policy evaluation trusts the typed `EvaluationContext`; the current frontend constructs it canonically, but future clients must provide equivalently controlled context. Domain allowlists, field-level data permissions, explicit requested-add-on representation, and execution remain unimplemented. Existing npm audit findings and TestClient warning remain.

## Phase 5 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 5 — Safe Action Gate
- Commit/branch: Working tree on `main`; commit pending human review.

### Goal
Apply eligible Shopping Trap actions through one backend-owned boundary after fresh Rule Zero evaluation, with explicit exact-action approval and no real-world side effects.

### Codex work
- Added canonical product, price, stock, add-on, state, execution, approval, refusal, and trace models.
- Added deterministic state, action-execution, and approval-decision endpoints.
- Bound approval IDs with HMAC across scenario, full action, Task Contract fingerprint, state version, and canonical consequences.
- Added a manual Safe Action Gate panel with controlled state, execute/approve/reject/reset controls, refusal/trace displays, and raw JSON.
- Kept Phase 1 cart dispatch separate; Phase 5 UI updates only from backend `after_state`.
- Added backend security/transition tests and frontend manual-flow/error tests.

### Security decisions
- Backend canonical data overrides Worker/UI price claims, and every execute/approve attempt re-runs Phase 4.
- `BLOCK` is terminal. Payment, order submission, sensitive-data entry, and external navigation are hard-refused.
- State versions increment only for semantic mutations; read-only, rejected, and refused paths preserve state.
- No Worker auto-advance, automatic execution, recovery, persistence, database, authentication, LLM, or browser automation was added.

### Verification
- `npm run test`: 7 files, 42 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed; `/demo/shopping` statically generated.
- Backend pytest: 66 tests passed with one existing Starlette TestClient deprecation warning.
- `git diff --check`: passed; forbidden-functionality source audit found no Phase 6 recovery or external side-effect integration.

### Result
- Completed.
- Remaining risk: without persistence, the stateless MVP cannot globally detect replay of an entire old request/state pair. Normal reuse against returned newer state is invalidated. The fallback signing key is development-only.

## Phase 6 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 6 — Safe Recovery Planner
- Commit/branch: Working tree on `main`; commit pending human review.

### Goal
Produce deterministic, contract-preserving safe alternatives after verified failure and execute only one explicitly selected replacement through the existing Phase 4 and Phase 5 boundaries.

### Codex work
- Added typed recovery triggers, reasons, strategies, step statuses, completion states, plans, requests/responses, and traces.
- Added deterministic recovery planning for subscriptions, recurring charges, warranty budget failures, payment/order/data boundaries, external navigation, rejected approvals, and stale state.
- Added HMAC plan integrity across scenario, contract fingerprint, trigger/evaluation binding, state version, ordered actions, expected state, trace, and warnings.
- Added plan and execute-one-step endpoints; recovery execution delegates to Phase 5 and never mutates state directly.
- Added a Safe Recovery panel with explicit generate/execute/approve/reject/skip/reset controls, timeline, constraints, outcomes, trace, and raw JSON.
- Lifted only canonical Phase 5 response state into the storefront so Gate and Recovery panels share backend-returned state; Phase 1 cart dispatch remains isolated.
- Added backend integrity/policy/execution tests and frontend manual-flow/isolation tests.

### Security decisions
- Trigger evaluations are recomputed canonically; caller recovery classifications are not accepted.
- The original Task Contract is fingerprinted and never modified or widened.
- Changed plan steps, contracts, or state versions are rejected before Phase 5.
- `BLOCK` remains terminal. No automatic recovery, approval, next-step execution, Worker advancement, payment retry, external side effect, LLM, browser automation, authentication, database, or persistence was added.

### Verification
- `npm run test`: 8 files, 49 tests passed.
- `npm run lint`: passed without warnings.
- `npm run build`: passed; `/demo/shopping` statically generated.
- Backend pytest: 81 tests passed with one existing Starlette TestClient deprecation warning.
- `git diff --check`: passed; complete Phase 6 forbidden-functionality audit recorded in the task handoff.

### Result
- Completed.
- Remaining risk: stateless operation cannot globally record plan consumption; signed content and exact state versions prevent ordinary tampering/reuse against newer state. The deterministic planner currently emits one replacement step per Shopping Trap failure class.

## Phase 7 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 7 — Tamper-Evident Audit and Read-Only Replay
- Commit/branch: Working tree on `main`; commit pending human review.

### Goal
Record completed Phase 3–6 typed results into a stateless cryptographically linked audit chain, verify consistency and state transitions, and replay recorded events without invoking live operations.

### Codex work
- Added typed audit actors, phases, event types, references, transitions, events, sessions, append/verification/outcome/export contracts.
- Added canonical HMAC-SHA256 chaining with sequence, previous hash, payload digest, event count, and head-hash verification.
- Added deterministic redaction for sensitive keys, payment/identity patterns, authorization tokens, and HTML.
- Added observer-only start, append, verify, and JSON/Markdown export endpoints.
- Added completed-artifact observer callbacks across Worker, Interceptor, Gate/approval, and Recovery panels without changing operational behavior.
- Added an Audit & Replay panel with automatic post-result recording, manual retry on recording failure, chain verification, exports, outcome summary, and network-free manual replay.
- Added backend tamper/relationship/redaction/export tests and frontend recording/replay/isolation tests.

### Security decisions
- Audit imports typed response schemas but no Worker, evaluation, execution, approval, or recovery service.
- Server derives event type/status and rejects contradictory client decisions.
- Raw artifacts are never stored; events contain whitelisted redacted summaries only.
- Replay reads `AuditSession.events` and never updates the Task Contract or live controlled state.
- No one-click runner, Phase 8 work, persistence, database, authentication, LLM, browser automation, or real-world side effect was added.

### Verification
- `npm run test`: 9 files, 56 tests passed.
- `npm run lint`: passed without warnings after removing one unused test import.
- `npm run build`: passed; `/demo/shopping` statically generated.
- Backend pytest: 96 tests passed with one existing Starlette TestClient deprecation warning.
- `git diff --check`: passed; observer/replay forbidden-functionality audit recorded in the task handoff.

### Result
- Completed.
- Remaining risk: the stateless client can omit completed artifacts, so HMAC proves integrity of the submitted chain rather than independent completeness. No durable retention or external timestamp/non-repudiation service exists.

## Phase 8 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 8 — Guided Demo Experience and UI consolidation
- Commit/branch: Working tree on `main`; commit pending human review.

### Goal
Create a polished nine-stage evaluator journey while retaining the Phase 1–7 Security Lab and every existing safety boundary.

### Codex work
- Added a landing page and separate `/demo` guided route.
- Added a typed prerequisite-gated frontend controller, responsive three-panel workspace, explicit controls, safe outcome, audit proof, and read-only replay.
- Reused existing contract, Worker, Interceptor, Gate, approval, recovery, and audit APIs; no backend business logic was duplicated.
- Derived financial context from backend scenario/state artifacts, never Worker price claims.
- Preserved `/demo/shopping` and added a Guided Demo/Security Lab mode switch.
- Added landing, controller gating/reset, inert start, backend start/error, semantic progress, and forbidden-control tests.

### Security decisions
- Reset is frontend-only and inert; another explicit Start loads fresh state.
- Revisited stages do not repeat operations.
- BLOCK exposes no execution, approval, or override.
- Audit failure is independent and manually retryable without repeating the completed operation.
- No Phase 9, auto-run, LLM, browser automation, authentication, persistence, or real-world commerce was added.

### Verification
- `npm run test`: 12 files, 62 tests passed.
- `npm run lint`: passed without warnings.
- `npm run build`: passed; `/`, `/demo`, and `/demo/shopping` generated.
- Backend `.venv\Scripts\python.exe -m pytest`: 96 tests passed with one existing Starlette TestClient deprecation warning.
- Bare `pytest` was unavailable on the PowerShell PATH; the repository virtual environment completed the same requested suite.

## Phase 8 acceptance closure

- Added one mocked integration-level frontend test covering all nine guided stages from explicit start through HMAC verification and read-only replay.
- Asserted Worker step indexes `2`, `4`, `6`, `7`, and `8`, five explicit evaluations, three controlled execution requests, one explicit approval, and exactly one recovery-step execution.
- Proved ALLOW does not auto-execute, ASK APPROVAL does not auto-approve, BLOCK exposes no execution/override path, and stage revisits/replay make no operational calls.
- Injected one audit append failure after successful product execution; the controlled backend state remained at v1, the operation was not repeated, and only the audit artifact was manually retried.
- Confirmed the original Task Contract is passed unchanged through evaluation and approval boundaries.
- `npm run test`: 13 files, 63 tests passed.
- `npm run lint`: passed without warnings after removing one unused test import.
- `npm run build`: passed; `/`, `/demo`, and `/demo/shopping` generated.
- Backend pytest through the repository virtual environment: 96 tests passed with one existing Starlette TestClient deprecation warning.
- `git diff --check`: passed.

## Phase 9 implementation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 9 — Security Evals and Adversarial Testing
- Commit/branch: Working tree on `main`; commit pending human review.

### Goal
Attempt to break the existing Phase 2–8 safety boundaries with deterministic hostile inputs, publish results, and make no runtime authority changes.

### Codex work
- Added 26 parameterized adversarial backend cases for prompt injection, recurring-charge obfuscation, cumulative budget drift, price/category spoofing, unknown financial impact, redirect chains, sensitive-data exfiltration, source-trust spoofing, missing budgets, malformed schemas, and false-positive controls.
- Reused the existing Interceptor endpoint and typed models; no policy rule or runtime route was added.
- Published `docs/EVALUATION_MATRIX.md` with a 100% critical and false-positive threshold, coverage mapping, metrics, reproduction commands, and residual limitations.
- Added the reusable Phase 9 prompt and documented the test-only browser-automation boundary.

### Initial evidence
- Targeted adversarial pytest: 26 passed with one existing Starlette TestClient deprecation warning.
- No production defect was found by the new matrix.

### Verification
- Full backend pytest: 122 tests passed with one existing Starlette TestClient deprecation warning.
- `npm run test`: 13 files, 63 tests passed.
- `npm run lint`: passed without warnings.
- `npm run build`: passed; `/`, `/demo`, and `/demo/shopping` generated.
- `git diff --check`: passed.
- Runtime/deployment source audit found no browser-automation import, new endpoint, policy change, deployment configuration, authentication, persistence, LLM, or Phase 10 implementation.

### Result
- Completed; the published deterministic matrix met its 100% critical and false-positive threshold.
- Remaining risks are documented in `docs/EVALUATION_MATRIX.md`; they include structured provenance, no domain redirect resolution, bounded semantic price parsing, and stateless audit completeness.

## Phase 9 acceptance closure

- Added test-only Playwright with nine Chromium cases for three routes, three responsive viewports, accessibility smoke, the live security flow, and backend unavailability.
- Added push/PR GitHub Actions CI using Node 22 and Python 3.13, including unit/regression/browser tests, build/lint, whitespace, and secret checks.
- Added a deterministic lightweight secret scanner and documented its current-tree limitations.
- Centralized backend CORS and signing-key configuration. Production now rejects localhost/missing CORS plus missing, short, and placeholder approval/recovery/audit keys.
- Added frontend request timeouts and a synchronous Guided Demo in-flight lock after browser testing demonstrated a theoretical same-tick duplicate-event window.
- Browser testing found and resolved test isolation issues: Vitest/Playwright discovery overlap, development HMR console noise, and collisions with existing local servers. The final harness uses a production build on isolated ports.
- Dependency review: backend `pip-audit` found no known vulnerabilities; frontend `npm audit` reports one moderate PostCSS and two high Next/sharp aggregate findings. No unsafe forced downgrade was applied.
- Added `SECURITY_EVAL_REPORT.md` and `RELEASE_READINESS_CHECKLIST.md` with a CONDITIONAL GO for controlled evaluation and NO-GO for production deployment.
- Final verification: frontend 14 files / 65 tests; backend 133 tests; targeted adversarial/configuration 37 tests; Chromium 9 tests; lint, build, secret scan, workflow YAML parse, runtime Playwright-import scan, and `git diff --check` all passed.
- Browser viewport results: desktop 1440×900, tablet 820×1180, and mobile 390×844 passed overflow, readability, navigation, status, and overlap checks.

## Phase 10A deployment preparation

### Date and phase
- Date: 2026-07-23
- Phase: Phase 10A — controlled-demo deployment preparation
- Deployment status: not deployed; Phase 11 not started.

### Changes
- Added Render monorepo configuration, Python 3.13 selection, exact dashboard guidance, safe signing-key generation, CORS ordering, validation, and paired rollback instructions.
- Added an operator-side deployment validator for health, contract, Worker proposal, Interceptor evaluation, public frontend routes, positive/negative CORS, timeouts, and common secret disclosure markers.
- Hardened production configuration to reject wildcard CORS and added a regression test.
- Preserved standard Next.js output, public demo routes, the centralized frontend API timeout layer, backend-only signing keys, and every Phase 1–9 typed safety boundary.
- Added no live URL, deployment, static export, runtime automation, real-world action, authentication, database, persistence, or Phase 11 artifact.

### Verification
- Frontend Vitest: 14 files / 65 tests passed.
- Frontend ESLint: passed.
- Frontend production build with `NEXT_PUBLIC_API_URL=https://api.example.invalid`: passed; `/`, `/demo`, and `/demo/shopping` were generated by standard Next.js behavior.
- Backend pytest: 134 passed with one existing Starlette TestClient deprecation warning.
- Targeted adversarial/configuration pytest: 38 passed with the same warning.
- Chromium Playwright: 9 passed; automation remains test-only.
- Deployment validator unit/help/expected-failure tests: 3 passed.

## Evaluator-facing UI rescue patch

### Scope
- Replaced the abstract landing hero with the concrete ₹1,500 power-bank mission, hidden ₹199/month membership attempt, BLOCKED decision, safe-continuation story, and controlled-simulation disclaimer.
- Added visible, high-contrast landing CTAs for the Guided Demo and Security Lab, including hover, focus, and disabled-state classes.
- Reframed the Guided Demo as eight evaluator-facing steps while preserving its existing nine internal API checkpoints and all explicit-operation controls.
- Reduced the Guided Demo to one dominant current scene plus a compact action/decision area, with plain-language attack reasons and a prominent final safety summary.
- Kept `/demo/shopping` unchanged as the Advanced Security Lab.

### Safety and behavior
- No backend API, policy, execution, approval, recovery, audit, deployment, or controlled-state behavior changed.
- No real payment, purchase, order submission, personal-data submission, or navigation capability was added.
- Playwright found one presentation defect during the patch: the simplified header had lost its semantic navigation landmark. A native labelled `nav` was restored.

### Verification
- Frontend Vitest: 14 files / 67 tests passed.
- Frontend ESLint: passed.
- Frontend production build: passed; `/`, `/demo`, and `/demo/shopping` generated.
- Chromium Playwright: 9 passed across desktop, tablet, mobile, accessibility, security-flow, and backend-error cases.
- Backend pytest: 134 passed with one existing Starlette TestClient deprecation warning.
