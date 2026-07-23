# Audit and Read-Only Replay Model

## Separate observer boundary

Worker proposal, Rule Zero evaluation, human approval, controlled execution, recovery planning, and auditing remain separate. Audit receives only completed typed outputs from the first five boundaries. It records and verifies them but never invokes, retries, or bypasses those operations.

## Event schema and actors

An event records session/sequence/event IDs, type, phase, actor, summary, explanation, scenario and typed references, decision/status, before/after state versions, state-change flag, policy rules, redacted payload summary, payload digest, previous/current hashes, and integrity metadata. Actors cover user, contract engine, Worker, Interceptor, Gate, human approval, Recovery Planner, and system. Event types cover session/contract/proposal/evaluation/decision/approval/execution/recovery/state/outcome/reset lifecycle records.

## HMAC event chain

`AUDIT_SIGNING_KEY` signs canonical HMAC-SHA256 material containing session and sequence identity, type/phase/actor, summaries, references, decision/status, state transition, rules, payload digest, and previous hash. The session stores event count and head hash. Modification, deletion, insertion, reordering, sequence changes, session substitution, and link changes invalidate verification. The development fallback is not suitable for deployment.

## Stateless ownership and artifact validation

No database exists. The frontend carries `AuditSession`; append verifies the complete chain before creating the next server-numbered event. Artifacts are validated through Phase 3–6 Pydantic models. The server derives event type, actor, decision, rules, references, and state transition. Evaluation must reference a recorded action; recovery must reference recorded action/evaluation or plan IDs. Contradictory client decisions are rejected.

## State continuity and redaction

Execution/recovery before versions must match the session final version. Changed state must advance; unchanged state must retain its version. Redaction recursively replaces password, OTP, payment-card/CVV, Aadhaar-like, API/authorization/signing-key/token, and sensitive-field values. Card/identity/token patterns and HTML tags are removed from text. Only whitelisted canonical summaries—not raw artifacts or webpage HTML—enter events and exports.

## Verification, exports, and replay

Verification reports integrity, first invalid sequence, relationship and state findings, scenario consistency, counts, final version, and full/partial outcome. JSON and Markdown exports contain contract summary, timeline, rules, approvals, transitions, recovery, verification, and outcome without secret keys. Replay is a React cursor over recorded events. Previous/Next/Pause/Restart change replay UI state only and issue no operational network calls.

## Failure handling and limitations

If automatic recording of a completed result fails, the result remains untouched; the UI warns and offers manual retry of that artifact. The stateless system cannot independently prove completeness against events a malicious client never submits, globally consume a session, or provide durable retention. HMAC verification proves server-authenticated chain integrity, not external timestamping or non-repudiation.
