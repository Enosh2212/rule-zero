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

## Non-goals for the MVP
- Browsing arbitrary live websites
- Completing real purchases or payments
- Claiming perfect prompt-injection detection
- Inferring criminal intent or assigning blame
- Storing real Aadhaar, card, password, or OTP data
