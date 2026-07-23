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
