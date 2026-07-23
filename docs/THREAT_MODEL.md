# Threat Model

## Protected assets
- User intent and task boundaries
- Budget and payment authority
- Personal and sensitive information
- Approved destination domains
- Integrity of agent actions and audit history

## Threats in scope
- Indirect prompt injection from webpage content
- Hidden, pre-selected, or recurring charges
- Action outside the requested workflow scope
- Budget drift across multiple actions
- Form submission or payment without permission
- Sensitive-data entry without explicit permission
- Redirect to an unapproved domain
- Repeated attempts to bypass an earlier block

## Trust boundaries
1. User instruction is trusted but can be ambiguous.
2. Webpage content is untrusted.
3. Worker-agent proposals are untrusted until evaluated.
4. Policy decisions must be explainable and auditable.
5. Human approval is required for configured consequential actions.

## Action provenance

Phase 3 records the origin of every worker proposal so later safety evaluation can distinguish user instructions, trusted application observations, visible webpage content, hidden untrusted webpage instructions, and naive worker defaults. Source trust describes the evidence origin; it does not make the resulting proposal safe or authorized. All worker proposals remain untrusted until a later Rule Zero evaluation boundary, including proposals derived from trusted application state.

Phase 4 treats provenance as supporting evidence, never standalone authorization. An untrusted webpage instruction that conflicts with the Task Contract is blocked, while trusted application evidence still passes through contract, budget, permission, data, and consequence rules. Controlled scenario prices—not Worker-supplied price claims—form the frontend financial context. Evaluation output cannot mutate state and does not imply that an action was executed.

## Phase 5 execution threats

Frontend state, prices, totals, evaluation output, and claimed eligibility are untrusted. The backend reconstructs consequences from canonical fixtures and re-evaluates before every controlled mutation. Approval IDs are HMAC-bound to scenario, exact action, contract fingerprint, state version, and canonical consequence context. Changed bindings are refused, and approval never overrides `BLOCK`. Real payment, order submission, sensitive-data disclosure, and external navigation remain hard execution boundaries.

## Phase 6 recovery threats

Recovery plans and caller-selected steps are untrusted until their HMAC, scenario, contract fingerprint, triggering action/evaluation, state version, and ordered actions validate. The planner recomputes the trigger evaluation and never accepts a caller recovery decision. Step execution delegates to Phase 5; therefore recovery cannot directly mutate state or transform `BLOCK` into approval. Budget increases, subscriptions, recurring charges, payment retries, order submission, disclosure, and external navigation are absent from recovery actions.

## Phase 7 audit threats

The entire client-carried session and every submitted artifact are untrusted. Append first verifies the complete chain, validates the artifact through its existing typed model, checks references and state continuity, and derives event meaning server-side. Event HMACs bind content, order, state versions, references, and the previous hash. Deterministic redaction removes sensitive-key values, card/identity patterns, authorization tokens, and arbitrary HTML before storage or export. Replay has no operational API path.

## Non-goals for the MVP
- Browsing arbitrary live websites
- Completing real purchases or payments
- Claiming perfect prompt-injection detection
- Inferring criminal intent or assigning blame
- Storing real Aadhaar, card, password, or OTP data

## Phase 8 guided-controller threats

The guided controller is presentation state, not authority. Stage readiness cannot authorize an action, frontend status labels cannot manufacture a decision, and client navigation cannot mutate canonical state. Every proposal, evaluation, execution, approval, recovery, and verification result comes from its existing backend boundary. BLOCK never exposes execution or approval, ASK APPROVAL never auto-approves, and recovery never auto-runs. Audit recording failure is separated from the completed operation so retrying evidence cannot repeat the consequence.

## Phase 9 adversarial evaluation threats

Phase 9 treats evaluation fixtures as hostile: provenance may lie, prices may be disguised in prose, payload prices may be forged, costs may accumulate across steps, redirect targets may conceal a second destination, and sensitive fields may use innocuous labels. Typed schema validation, contract permissions, canonical context, decision precedence, fresh Gate evaluation, signed approval/recovery bindings, and audit verification remain unchanged. Test evidence is not promoted into production authority.

Browser automation is permitted only as a test harness boundary. No browser library, arbitrary URL input, or automation control may be imported by runtime Worker, policy, execution, recovery, audit, or Guided Demo modules.

Release configuration is hostile until validated. Production startup fails closed when CORS origins or signing keys are missing or weak. Browser-visible environment variables are public by definition and may contain only the API origin. Rapid duplicate UI events are treated as replay attempts and stopped at the Guided Demo in-flight boundary; backend state versions and signed approvals remain the authoritative second layer.
