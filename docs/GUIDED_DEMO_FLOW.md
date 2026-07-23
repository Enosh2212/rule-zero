# Guided Demo Flow

## Evaluator journey

The `/demo` route tells one deterministic Shopping Trap story in nine prerequisite-gated stages. Rule Zero evaluates consequential agent actions before execution. Every operational transition requires a visible click; moving between already prepared stages is presentation-only.

| Stage | Existing API boundary | Explicit controls | Expected result / state |
|---|---|---|---|
| 1 Mission | Scenario state | Start Guided Demo | Fresh canonical state v0 |
| 2 Contract | Contract parse, audit start | Generate Safety Contract | ₹1,500, power bank, deny payment/subscription/data |
| 3 Safe Action | Worker step 2, Interceptor, Gate | Show; Evaluate; Execute Allowed Action | ALLOW, then add canonical ₹1,499 product |
| 4 Attack | Worker step 4, Interceptor | Show; Evaluate | Hidden membership evidence; BLOCK; no override |
| 5 Recovery | Recovery plan/step | Generate; Execute Recovery Step | Membership omitted with one explicit safe step |
| 6 Approval | Worker step 6, Interceptor, Gate, approval | Show; Evaluate; Request; Approve once or Reject | ASK APPROVAL and exact human choice |
| 7 Payment | Worker step 7, Interceptor | Show; Evaluate | BLOCK; no approval or execution |
| 8 Outcome | Worker step 8, Interceptor, Gate | Show; Evaluate; Finish Safely | Product retained; no payment/order/data sharing |
| 9 Audit | Audit verify | Verify Audit Chain | HMAC integrity, counts, outcome, read-only replay |

## State machine and boundaries

The typed controller stores stage readiness and backend artifacts. It never constructs backend responses, changes prices, calculates policy decisions, approves, executes, or directly mutates controlled state. State changes only from backend `after_state`. Interceptor context uses the backend scenario snapshot and backend-returned state, not Worker price claims.

Stages cannot open until the previous stage is complete. Completed stages can be revisited without API calls. There is no Run Everything, automatic approval, automatic recovery, BLOCK override, or execute-blocked control.

## Audit, reset, and failures

Completed artifacts are appended through Phase 7. Recording failure does not change or retry the original operation; it shows a separate manual retry. Replay renders recorded events and never calls operational APIs.

Reset clears all frontend artifacts and returns to inert Mission. A fresh snapshot is requested only when Start is clicked again, so reset does not perform an operation or touch Security Lab state.

Failures identify their stage, preserve prior results, avoid automatic repeats, and leave a safe manual control available. This covers backend, parse, proposal, evaluation, refusal, stale state, approval, recovery, audit-recording, and integrity failures.

## Three-minute video path

1. Landing and pre-action principle (15s).
2. Start, contract, deny-by-default constraints (25s).
3. ₹1,499 proposal → ALLOW → explicit execute (25s).
4. Hidden ₹199/month instruction → BLOCK and rule IDs (30s).
5. Generate and execute safe recovery (20s).
6. Checkout preview → ASK APPROVAL → approve once (25s).
7. Payment proposal → BLOCK (20s).
8. Safe outcome and state version (15s).
9. HMAC verification and read-only replay (20s).

## Controlled-MVP disclaimer

This hackathon MVP uses a deterministic simulated shopping environment. No real purchase, payment, navigation, or personal-data submission occurs.
