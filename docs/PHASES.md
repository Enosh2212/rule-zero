# Rule Zero — Build Phases

## Phase 0 — Foundation and build contract
- Fresh repository and monorepo structure
- Problem statement, scope, threat model, and non-goals
- Next.js and FastAPI bootstraps
- Health endpoint and baseline test
- Codex build log and phase prompt convention

**Exit gate:** frontend builds, backend health test passes, scope is frozen.

## Phase 1 — Controlled Shopping Trap
- Build a deterministic demo storefront
- Product catalogue, cart, checkout preview
- Pre-selected warranty and recurring membership traps
- Hidden untrusted webpage instruction as structured scenario data
- No real payment or external navigation

**Exit gate:** a user can manually reproduce every attack condition.

## Phase 2 — Task Contract Engine
- Convert natural-language intent into a typed contract
- Budget, allowed item/category, payment boundary, subscription rule
- Sensitive-data permissions, allowed domains, approval thresholds
- Contract validation, defaults, ambiguity flags, unit tests

**Exit gate:** sample instructions produce stable structured contracts.

## Phase 3 — Worker Action Protocol
- Define typed actions: navigate, click, type, select, add-to-cart, submit
- Worker proposes actions but cannot execute them directly
- Include source evidence and expected consequence with every proposal
- Deterministic scripted worker first; LLM planner behind an interface later

**Exit gate:** shopping mission completes when no safety layer blocks it.

## Phase 4 — Rule Zero Interceptor
- Central pre-action gateway
- Deterministic checks for budget, recurring charges, payment, domains, data fields
- Semantic check for instruction conflicts and prompt injection
- Decisions: ALLOW, BLOCK, REQUIRE_APPROVAL
- Machine-readable reason codes and evidence

**Exit gate:** known unsafe actions are blocked before state mutation.

**Status:** implemented as a deterministic evaluation-only boundary; execution and recovery remain unimplemented.

## Phase 5 — Recovery and Human Control
- Remove unsafe add-ons and choose a safe alternative
- Pause for consequential or ambiguous actions
- User approval/rejection interface
- Prevent retry loops and policy bypass

**Exit gate:** agent safely continues or stops after each blocked action.

**Phase 5 implementation note:** the delivered scope is the Safe Action Gate: canonical server revalidation, controlled local execution, exact-action approval/rejection, and terminal `BLOCK` enforcement. Autonomous recovery and safe-alternative generation remain Phase 6 work.

## Phase 6 — Safe Recovery Planner
- Deterministically classify blocked, rejected, stale, and unsupported outcomes
- Preserve the original Task Contract and canonical Shopping Trap data
- Propose HMAC-bound safe replacement actions
- Execute one explicitly selected recovery step through Phases 4 and 5
- Pause for existing approval controls without automatic continuation

**Exit gate:** each failed action has a safe full/partial outcome without bypassing Rule Zero.

**Status:** implemented. Audit/replay and broader Mission Control orchestration remain future phases.

## Phase 7 — Audit, Replay, and Evidence
- Typed tamper-evident event schema and HMAC-linked stateless session
- Existing artifact, relationship, and state-transition validation
- Deterministic redaction and JSON/Markdown export
- Read-only manual replay and outcome summary

**Exit gate:** every decision traces to a contract rule and source evidence.

**Status:** implemented. Its APIs are reused by the Phase 8 guided coordinator.

## Phase 8 — Guided Demo Experience and UI consolidation
- Polished landing page and separate evaluator-focused `/demo`
- Nine explicitly controlled Shopping Trap stages using existing Phase 2–7 APIs
- Prerequisite-gated typed frontend controller
- Safe outcome, HMAC audit proof, and read-only replay summary
- Existing `/demo/shopping` retained as the detailed Security Lab

**Exit gate:** an evaluator can understand the complete safety story in three minutes without weakening any operational boundary.

**Status:** implemented. Additional scenarios remain future work and Phase 9 has not begun.

## Phase 9 — Evals and Adversarial Testing
- Prompt-injection variants
- Obfuscated recurring charges
- Multi-step budget violations
- Domain redirects and sensitive-data exfiltration
- False-positive and false-negative suite
- Codex self-review and security review

**Exit gate:** published evaluation matrix passes the agreed threshold.

**Status:** implemented and release-hardened. The deterministic matrix, browser suite, environment validation, CI, and lightweight secret guard pass. Phase 10A preparation is documented below; no deployment exists.

## Phase 10 — Deployment and Reliability
- Vercel frontend and Render backend
- Public no-login demo
- Seeded fallback session if AI/API is unavailable
- Rate limits, timeouts, safe error states, observability

**Exit gate:** clean-device end-to-end demo succeeds repeatedly.

## Phase 11 — Submission Package
- Public GitHub repository with incremental history
- Three-minute demo video
- Google Doc project description
- Architecture diagram and screenshots
- Codex usage evidence and human contribution statement
- Final submission checklist

**Exit gate:** every mandatory link works in an incognito window.

## Phase 10A delivery note

Deployment preparation is implemented: Render/Vercel settings, fail-closed production configuration, operator guides, and an offline validation script are present. Nothing has been deployed. Live reliability, observability, rate-limit disposition, rollback execution, and clean-device checks remain incomplete, and Phase 11 has not begun.
