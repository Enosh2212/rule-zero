# Safe Recovery Model

## Separate boundary

Evaluation decides whether a proposal is safe. Execution applies one authorized controlled action. Recovery begins only after failure and proposes a replacement; it does not change the earlier decision or mutate state. This preserves five boundaries: Worker proposal, Rule Zero evaluation, human approval when required, Safe Action Gate execution, and Recovery Planner alternatives.

## Triggers and strategies

Supported triggers cover blocked actions, rejected/cancelled approvals, budget violations, prohibited subscription/recurring/payment/order/data behavior, untrusted instructions, stale state, and unsupported actions. Deterministic strategies skip prohibited behavior, disable subscriptions or warranty, restore budget compliance, retain the allowed item, stop before payment, remain local, omit sensitive data, refresh canonical state, or finish with safe partial completion.

## Integrity and contract preservation

The planner first verifies scenario/action/evaluation bindings and recomputes the triggering Phase 4 evaluation from canonical Phase 5 state. The plan records the SHA-256 fingerprint of the original Task Contract; the contract object is never rewritten. The plan ID is an HMAC over all plan content except the ID itself, including scenario, contract fingerprint, trigger/evaluation IDs, bound state version, ordered actions, expected state, trace, and warnings. Any changed step or metadata invalidates execution.

## Canonical data and one-step execution

Product prices, stock, categories, warranty, membership, and state validation come from the backend canonical scenario. `POST /api/recovery/execute-step` checks one index and state version, extracts exactly one typed `ProposedAgentAction`, and calls the Phase 5 gate. Phase 5 rebuilds context, re-runs Phase 4, and is the only mutation boundary. No next step runs automatically.

## Approval and stale state

If a recovery action returns `ASK_APPROVAL`, execution pauses and the existing Phase 5 approval request is shown. Approval remains bound to that exact action, contract, consequence, and state version. Rejection does not retry. Stale-state recovery discards old authority and instructs the client to load a fresh canonical snapshot before generating a new plan.

## Full and partial completion

Removing an unnecessary subscription or warranty can preserve full controlled-task completion. Payment, order, sensitive-data, external-navigation, or rejected-checkout failures produce safe partial completion: the unsafe action is omitted and the simulation may finish without claiming a purchase occurred.

## Prohibited behavior and limitations

Recovery cannot override `BLOCK`, increase budget, activate subscriptions/recurring payments, pay, submit orders, share data, navigate externally, mutate the Task Contract, auto-approve, auto-execute, or auto-advance the Worker. The current deterministic Shopping Trap planner emits one replacement step per failure class. It is stateless: it validates state versions and signed content but does not persist consumed plans globally. `RECOVERY_SIGNING_KEY` must replace the local fallback outside development.
