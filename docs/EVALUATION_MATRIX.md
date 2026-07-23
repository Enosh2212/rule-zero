# Phase 9 Security Evaluation Matrix

## Method

Phase 9 attempts to break the existing Phase 2–8 boundaries using deterministic hostile inputs. Evaluations invoke the same typed APIs and services used by the product. No alternate policy engine, execution path, runtime browser, LLM, or persistence layer is introduced.

Pass threshold: **100% of critical safety cases** and **100% of false-positive controls** in this deterministic MVP matrix. Any critical miss blocks the Phase 9 exit gate.

## Matrix

| Family | Cases | Expected | Covered rules/boundary | Result |
|---|---:|---|---|---|
| Prompt-injection variants | 6 | BLOCK | RZ-SUB-001, RZ-RECUR-001, RZ-SOURCE-001 | PASS |
| Obfuscated recurring costs | 6 | BLOCK regardless of marketing text | Structured consequence, recurring prohibition | PASS |
| Multi-step budget drift | 4 | ≤₹1,500 asks for optional add-on; >₹1,500 blocks | RZ-BUDGET-001, RZ-ADDON-001/002 | PASS |
| Worker price/category spoof | 1 | BLOCK | Controlled category; RZ-CATEGORY-001 | PASS |
| Unknown financial impact | 1 | ASK APPROVAL, never ALLOW | RZ-BUDGET-002 | PASS |
| Redirect chain | 1 | ASK APPROVAL | RZ-NAV-001 | PASS |
| Sensitive-data exfiltration | 5 | BLOCK | RZ-DATA-001 | PASS |
| Trusted-source authority spoof | 1 | Payment BLOCK | RZ-PAY-001, source is not authority | PASS |
| Missing budget | 1 | BLOCK | RZ-DEFAULT-001 | PASS |
| Malformed/extra fields | 2 | HTTP 422 | Pydantic `extra=forbid`, numeric validation | PASS |
| False-positive read-only controls | 4 | ALLOW, no execution | RZ-BASE-001 / RZ-FINISH-001 | PASS |
| False-positive exact-budget product | 1 | ALLOW | Allowed category/action, ₹1,499 ≤ ₹1,500 | PASS |
| Guided end-to-end boundary | 1 | Explicit clicks; BLOCK never executes | Phase 8 mocked integration | PASS |
| Gate/approval/recovery tamper | Existing suites | Refuse/reject | HMAC and fresh re-evaluation | PASS |
| Audit tamper/redaction/replay | Existing suites | Invalid chain or redacted output | Phase 7 integrity boundary | PASS |

## Metrics

- New adversarial cases: 26 pytest cases.
- Critical/deny or schema-rejection cases: 18/18 passed.
- Approval-safe-default cases: 3/3 passed.
- False-positive controls: 5/5 passed.
- Full backend regression: recorded in `docs/CODEX_BUILD_LOG.md`.

## Residual limitations

- Provenance remains structured input supplied by the deterministic Worker; arbitrary live-page extraction is not evaluated.
- Domain allowlists and redirect resolution are not modeled; external navigation therefore pauses for approval.
- The system recognizes typed recurring consequences, not arbitrary natural-language price semantics. The adversarial variants prove deceptive text cannot override a supplied canonical recurring amount.
- Client-carried stateless sessions cannot prove omitted events or provide external non-repudiation.
- Browser automation is not a runtime capability. Phase 9 does not browse arbitrary websites or execute real side effects.

## Reproduction

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_adversarial_evals.py
.\.venv\Scripts\python.exe -m pytest

cd ..\frontend
npm run test
npm run lint
npm run build
npm run test:e2e
python ..\scripts\check_secrets.py
```

Browser closure adds nine Chromium tests: three route/console checks, three responsive viewports, one accessibility smoke, one live security-boundary flow, and one backend-unavailable error check. Browser automation is test-only.
