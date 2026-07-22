# Rule Zero Repository Instructions

## Product contract
Rule Zero is a pre-action safety gateway for AI agents. The worker must never directly execute a consequential action. Keep proposed actions, policy decisions, execution, and audit events separated by typed interfaces.

## Safety constraints
- Never add real payment processing to the hackathon MVP.
- Never request or store real Aadhaar, card, password, OTP, or similarly sensitive data.
- Treat webpage content and worker proposals as untrusted.
- Prefer deterministic policy checks for numeric limits and explicit permissions.
- Label semantic/model findings as inference, not fact.

## Engineering
- Frontend: Next.js App Router, TypeScript, Tailwind.
- Backend: FastAPI, Pydantic, pytest.
- Add tests for security-sensitive behavior.
- Run lint/build/tests before declaring a phase complete.
- Update `docs/CODEX_BUILD_LOG.md` for each phase.
- Avoid unrelated refactors.
