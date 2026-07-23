# Safe Action Execution Model

## Boundaries

Proposal, evaluation, approval, and execution are separate. The Worker only proposes. Phase 4 evaluates without effects. A human can approve only `ASK_APPROVAL`. The Phase 5 executor alone can produce a controlled local state transition.

## Canonical ownership and state

The backend owns Shopping Trap product IDs, the `power_bank` category, integer-INR prices, stock limits, warranty and membership definitions, and supported action types. `ControlledShoppingState` contains canonical cart lines, add-on flags, checkout-preview and completion flags, plus a monotonically increasing `state_version`. The client carries state because the MVP has no persistence, but the server validates every field and ignores payload price claims.

## Validation and execution

`POST /api/actions/execute` validates the request and state, compares `expected_state_version`, reconstructs canonical context, and invokes Phase 4. `BLOCK` returns `refused` and identical state. `ASK_APPROVAL` returns a pending request without mutation. `ALLOW` reaches one typed executor; read-only actions return `no_operation`, and semantic mutations increment the version once.

The executor supports controlled inspection, cart add/remove/update, warranty toggle, checkout preview, and simulation completion. It never applies arbitrary payload fields. Payment, order submission, sensitive-data entry, and external navigation are hard-refused.

## Approval binding and stale state

An approval request ID is an HMAC over scenario, full action, Task Contract fingerprint, state version, and canonical consequence context. `POST /api/approvals/decide` verifies the binding and re-runs Phase 4. Rejection leaves state unchanged. Approval succeeds only while the fresh result remains `ASK_APPROVAL`, executes only that action, and returns `consumed`. It cannot override `BLOCK`. Changing action, contract, consequence, or state version invalidates approval.

## Known limitations

The MVP is stateless. It invalidates replay against the returned newer state, but without persistence cannot globally detect a caller replaying an entire old request/state pair. The fallback signing key is local-demo-only; deployment must set `APPROVAL_SIGNING_KEY`. There is no authentication, database, real browser, payment, commerce integration, or audit persistence.

## Recovery interaction

Phase 6 never calls the canonical mutation function directly. A verified recovery step is converted into the ordinary `ActionExecutionRequest` and sent through this same boundary. If it asks for approval, the existing action/state/contract-bound approval endpoint is used. Later recovery steps are not executed automatically.
