# Architecture

## Design rule
The worker never mutates the environment directly. It emits a proposed action. Only the Rule Zero gateway can authorize execution.

```text
User Task
   ↓
Task Contract
   ↓
Worker Planner ───── reads untrusted page evidence
   ↓ proposed action
Action Gateway
   ├─ deterministic policy checks
   ├─ semantic threat review
   └─ consequence calculation
   ↓
ALLOW / BLOCK / REQUIRE_APPROVAL
   ↓
Executor or Recovery/Human Control
   ↓
Immutable Audit Log
```

## Core contracts planned
- `TaskContract` (Phase 2 implemented)
- `ProposedAgentAction` (Phase 3 implemented)
- `ActionEvidence`
- `PredictedConsequence`
- `PolicyDecision`
- `AuditEvent`
- `RecoveryPlan`

## Phase 2 — Task Contract Engine

The Phase 2 engine is a deterministic boundary between natural-language user intent and later agent behavior. It does not plan, intercept, approve, or execute actions.

```text
User instruction
   ↓
POST /api/contracts/parse
   ↓
Deterministic parser (regex + deny-by-default rules)
   ↓
Validated Pydantic TaskContract
   ↓
Display-only contract preview
```

Backend contracts live under `backend/app/contracts/`:

- `ContractParseRequest` and `ContractParseResponse` define the HTTP boundary.
- `TaskContract`, `BudgetConstraint`, `AgentPermissions`, `SensitiveDataPolicy`, and `ParseWarning` define stable schema version `1.0`.
- Monetary limits use integer major currency units and an explicit currency value (`INR`).
- Missing permissions do not become authority. Payment, order/form submission, subscription activation, recurring charges, and sensitive-data sharing are prohibited by default.
- External navigation requires human approval.
- Ambiguous budgets retain the lowest recognized maximum and emit an `AMBIGUOUS_BUDGET` warning.

The frontend uses `NEXT_PUBLIC_API_URL`, defaulting locally to `http://localhost:8000`. The contract panel has no dependency on the Phase 1 cart reducer and cannot mutate or intercept cart actions.

## Phase 3 — Worker Action Protocol

Phase 3 implements proposal generation only. The deterministic worker is intentionally naive: it observes controlled scenario data and emits one stable action envelope per stateless request. It may include the Task Contract as context, but does not use it to suppress unsafe proposals.

```text
Task Contract context + WorkerObservation + step_index
                         ↓
                POST /api/worker/propose
                         ↓
          Deterministic proposal sequence lookup
                         ↓
               ProposedAgentAction envelope
                         ↓
             STOP — no evaluation or execution
```

The `ProposedAgentAction` schema includes:

- schema version, deterministic action ID, sequence number, and scenario ID;
- typed action, target, primitive structured payload, description, and rationale;
- source category, trust classification, and evidence;
- expected consequence and whether later execution would mutate state.

The Shopping Trap sequence proposes catalogue and product inspection, adding the in-budget product, retaining warranty and recurring membership defaults, reviewing cart, checkout navigation, payment, and task completion. The recurring-membership proposal records the hidden Phase 1 instruction as `untrusted_webpage_instruction` evidence.

Boundary guarantees:

1. Worker generation returns proposals and completion metadata only.
2. Rule Zero evaluation is not implemented until Phase 4.
3. Execution is a separate future boundary; the worker API has no cart reducer, browser, navigation, payment, persistence, or execution dependency.
