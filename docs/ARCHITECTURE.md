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
- `TaskContract`
- `ProposedAction`
- `ActionEvidence`
- `PredictedConsequence`
- `PolicyDecision`
- `AuditEvent`
- `RecoveryPlan`
