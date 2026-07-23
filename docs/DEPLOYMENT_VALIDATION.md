# Deployment Validation — Controlled Demo

Use this checklist only after explicit authorization to deploy. Record hostnames and results outside the repository; do not commit live secrets.

## Automated smoke check

```powershell
python scripts/verify_deployment.py --frontend-url https://<vercel-host> --backend-url https://<render-host>
```

The command must exit zero. It checks backend health, Task Contract parsing, Worker proposal generation, Rule Zero evaluation, the three public frontend routes, positive and negative CORS behavior, and common secret markers. It has bounded request timeouts and does not invoke execution, approval, recovery, payment, order, navigation, or data-submission endpoints.

## Public routes and cold start

- [ ] `GET /health` returns HTTP 200 and `{"status":"ok"}`.
- [ ] `/`, `/demo`, and `/demo/shopping` load without credentials.
- [ ] A Render cold start reaches health within the platform's expected startup window.
- [ ] After a cold start, rerun the automated validator; do not treat an unbounded spinner as success.
- [ ] Backend and frontend platform logs show no signing keys, request secrets, stack traces containing configuration values, or repeated crash loop.

## Guided Demo smoke path

- [ ] Generate the default Task Contract and confirm the ₹1,500 constraint remains unchanged.
- [ ] Obtain and ALLOW the canonical in-budget product proposal; confirm no automatic execution.
- [ ] Explicitly execute the product action and use only the returned backend state.
- [ ] Obtain the recurring-membership proposal from untrusted evidence and confirm BLOCK with no override/execution control.
- [ ] Generate Safe Recovery and explicitly execute exactly one step.
- [ ] Obtain checkout preview, confirm ASK_APPROVAL, request approval, and explicitly Approve Once.
- [ ] Obtain payment and confirm terminal BLOCK with no payment approval/execution path.
- [ ] Reach Safe Outcome, verify the audit chain, and confirm read-only replay makes no operational call.

## Security Lab and device checks

- [ ] Repeat the core contract, proposal, evaluation, controlled execution, recovery, approval, audit, and replay checks in `/demo/shopping`.
- [ ] Test desktop and mobile widths.
- [ ] Test a clean incognito window with no local state.
- [ ] Confirm the controlled-demo disclaimer remains visible and makes no claim of general production security.
- [ ] Confirm no Run Everything, Auto Approve, Override BLOCK, Execute Blocked Action, real checkout, or external navigation control exists.

## CORS and exposure

- [ ] The exact Vercel origin receives its own `Access-Control-Allow-Origin` value.
- [ ] An unrelated origin receives neither its origin nor `*`.
- [ ] No localhost or wildcard appears in production `CORS_ORIGINS`.
- [ ] Browser code and API responses contain no approval, recovery, or audit signing key.
- [ ] `NEXT_PUBLIC_API_URL` uses HTTPS and points to the intended Render service.

## Audit and operational review

- [ ] A fresh Guided Demo audit verifies successfully.
- [ ] A deliberately altered local replay artifact fails verification without changing the completed operation result.
- [ ] Render health/startup/error logs and Vercel build/runtime logs are reviewed.
- [ ] The current frontend and backend deployment identifiers are recorded for paired rollback.

## Final GO / NO-GO

GO only when every automated check passes, the full Guided Demo succeeds twice from clean sessions, Security Lab and mobile/incognito checks pass, CORS is exact, logs disclose no secrets, and paired rollback targets are known.

Any failed safety decision, secret exposure, wildcard CORS, inaccessible public route, schema mismatch, uncontrolled operation, or unverifiable audit is an immediate NO-GO.
