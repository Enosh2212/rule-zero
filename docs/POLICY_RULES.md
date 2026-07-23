# Rule Zero Deterministic Policy Rules

Phase 4 evaluates one validated `ProposedAgentAction` against one `TaskContract` and controlled `EvaluationContext`. It never executes an action. All money values are integer INR major units.

## Decision precedence

1. Schema validation rejects malformed or unsupported requests before evaluation.
2. Explicit contract, category, subscription, recurring-payment, payment, order, and sensitive-data violations block.
3. Known budget violations block.
4. Untrusted webpage instructions that conflict with the contract block.
5. Missing protected authority blocks; unknown calculable impact and consequential actions require approval where no explicit prohibition exists.
6. Human-approval requirements override allow findings.
7. Safe read-only, explicitly permitted, and non-mutating finish actions may be allowed.

Resolution is invariant: `BLOCK` overrides `ASK_APPROVAL`, which overrides `ALLOW`.

## Rule matrix

| Rule ID | Purpose | Inputs inspected | Output decision | Precedence | Example | Known limitation |
|---|---|---|---|---|---|---|
| RZ-BASE-001 | Permit well-formed read-only inspection. | Action type, mutation flag. | ALLOW | Safe allow | `inspect_catalogue`, non-mutating. | Only enumerated read actions qualify. |
| RZ-BUDGET-001 | Prevent known immediate budget overflow. | Financial action, projected total, contract maximum. | BLOCK | Budget block | ₹1,499 cart + ₹399 warranty exceeds ₹1,500. | Depends on controlled context accuracy. |
| RZ-BUDGET-002 | Prevent automatic handling of unknown financial impact. | Known flag, immediate and projected totals. | ASK_APPROVAL | Safe default | Paid mutation with unknown amount. | A stronger explicit prohibition can still block. |
| RZ-CATEGORY-001 | Restrict item additions to allowed categories. | Action type, canonical item category, contract categories. | BLOCK | Contract/category block | Add an unauthorized laptop to a power-bank task. | Current canonical catalogue supports one category. |
| RZ-ADDON-001 | Require consent for an unrequested paid optional add-on. | Add-on flag, immediate cost, projected total. | ASK_APPROVAL | Approval | ₹399 warranty within remaining budget. | Explicit requested-add-on representation is not yet modeled. |
| RZ-ADDON-002 | Prevent an optional add-on from exceeding budget. | Add-on flag, projected total, budget. | BLOCK | Budget block | Warranty makes due-today total ₹1,898. | Uses due-today total, not long-term value. |
| RZ-SUB-001 | Enforce subscription prohibition. | Subscription action and contract permissions. | BLOCK | Explicit prohibition | Retain Volt+ when subscription activation is prohibited. | Subscription cancellation is not modeled in Phase 4. |
| RZ-RECUR-001 | Enforce recurring-payment prohibition. | Monthly cost and recurring permission. | BLOCK | Explicit prohibition | Retain ₹199/month membership. | Only monthly recurrence is represented in the demo. |
| RZ-PAY-001 | Enforce payment authority boundary. | `make_payment`, payment permission. | BLOCK | Explicit prohibition | Worker proposes crossing payment boundary. | No payment instrument is ever accepted or inspected. |
| RZ-ORDER-001 | Enforce order-submission authority. | `submit_order`, submission permission. | BLOCK | Explicit prohibition | Worker proposes placing an order. | Drafting an order is not a separate action type. |
| RZ-DATA-001 | Prevent unauthorized sensitive-data use. | Sensitive-data action and policy. | BLOCK | Sensitive-data block | Enter personal information while sharing is prohibited. | Field-level permission granularity is deferred. |
| RZ-NAV-001 | Gate external navigation. | Navigation action and allowed/prohibited/approval permissions. | ASK_APPROVAL or BLOCK | Contract then approval | Navigate to an unknown external domain. | Domain allowlists are not yet modeled in the contract. |
| RZ-SOURCE-001 | Prevent untrusted instructions overriding contract restrictions. | Source type, evidence, detected contract conflicts. | BLOCK | Source-conflict block | Hidden instruction retains prohibited membership. | Relies on structured provenance supplied by Phase 3. |
| RZ-SOURCE-002 | Record that source trust alone grants no authority. | Source type and trust classification. | ALLOW finding only | Supporting evidence | Trusted catalogue evidence still undergoes all rules. | Never decides safety by itself. |
| RZ-DEFAULT-001 | Apply deny-by-default to missing or ambiguous authority. | Permission mapping, mutation flag, budget availability. | BLOCK or ASK_APPROVAL | Safe default | Missing add-item authority blocks; local checkout asks. | Block/ask split is action-class specific. |
| RZ-FINISH-001 | Permit non-mutating completion proposals. | `finish_task`, mutation flag. | ALLOW | Safe allow | Finish scripted proposal generation. | Does not certify earlier actions executed safely. |

## Financial consequence contract

- `immediate_one_time_cost`: canonical incremental one-time INR impact, or `null` when unknown.
- `recurring_monthly_cost`: canonical recurring INR/month impact, separate from due-today cost.
- `current_due_today_total`: actual controlled cart snapshot before the proposal.
- `projected_due_today_total`: deterministic total after the proposed immediate impact, or `null` when unsafe to calculate.
- `financial_impact_known`: false whenever required canonical product/add-on data is unavailable.

The frontend derives these fields from the controlled Phase 1 fixture and cart snapshot; it never accepts Worker-supplied prices as canonical.
# Phase 5 execution enforcement

Phase 5 reuses this policy engine at execution time. `BLOCK` is terminal and cannot be overridden. `ASK_APPROVAL` creates a signed, content-bound request and pauses without mutation. Even after approval, payment, order submission, sensitive-data entry, and external navigation are hard-refused. Canonical backend prices and state—not request payload price claims—supply execution consequences.

## Phase 6 recovery enforcement

Recovery actions use the same `ProposedAgentAction` schema and are evaluated by this unchanged precedence matrix. A recovery planner may omit, disable, review, refresh, or finish safely, but it cannot create authority. Each clicked step enters Phase 5, which performs a fresh Phase 4 evaluation. A resulting `BLOCK` remains refused; `ASK_APPROVAL` pauses for the existing exact-action approval flow.

## Phase 7 observation

Audit never evaluates policy. It records the already-returned typed evaluation, policy rule IDs, and decision after verifying action/scenario relationships. A caller-supplied contradictory decision is rejected. Replay displays the recorded decision without recomputing or executing it.
