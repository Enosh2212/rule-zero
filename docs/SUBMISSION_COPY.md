# Hackathon Submission Copy

## Project name

Rule Zero

## Tagline

A permission firewall for AI agents.

## One-line description

Rule Zero deterministically checks an AI agent's proposed action against user intent before any controlled execution, approval, recovery, or audit step can occur.

## 50-word description

Rule Zero is a deterministic permission firewall for AI agents. It converts user intent into a typed safety contract, evaluates proposed actions before execution, blocks unauthorized subscriptions and payments, requires explicit approval where appropriate, recovers safely, and produces tamper-evident evidence—all inside a controlled, non-commerce hackathon demonstration with no transactions.

## 150-word description

Rule Zero demonstrates a missing security boundary for AI agents: a model's proposal should never be treated as permission to act. The system converts natural-language intent into a typed, deny-by-default Task Contract, then checks every Worker proposal against budget, privacy, provenance, and action authority. An Interceptor returns ALLOW, BLOCK, or ASK_APPROVAL, while a Safe Action Gate requires human controls and canonical backend state before any mutation. In the Guided Demo, a user requests a power bank under ₹1,500, forbids subscriptions and data sharing, and stops before payment. Rule Zero allows the ₹1,499 product, blocks a ₹199/month membership instruction, blocks payment, and records a safe outcome. Recovery preserves the contract, and HMAC-linked audit replay is read-only. The project is a controlled hackathon demo: it performs no real purchase, payment, order, navigation, or personal-data submission, and makes no claim about arbitrary websites or autonomous agents.

## Problem

Agent systems often collapse four distinct concepts—model output, user intent, approval, and execution—into one pipeline. Prompt injection, hidden recurring charges, price drift, and over-broad tool access can then turn a plausible proposal into an unauthorized consequence.

## Solution

Rule Zero inserts a typed, deterministic authorization boundary before execution. It preserves the user's original contract, treats webpage content as untrusted evidence, binds approvals to exact state, blocks prohibited actions without override, offers constrained recovery, and produces inspectable audit proof.

## What makes it different

- The Worker cannot execute.
- `ALLOW` still requires an explicit execution control.
- `ASK_APPROVAL` requires an exact, one-time approval.
- `BLOCK` has no override, approval, or execution path.
- Backend canonical state—not frontend optimism—controls mutations.
- Recovery cannot weaken the original contract.
- Audit replay is observational, not operational.

## Demo story

A controlled storefront offers a valid ₹1,499 power bank, then exposes an untrusted instruction to retain a ₹199/month membership. Rule Zero allows the product only after an explicit safety check and execution click, blocks the recurring charge, safely continues without it, blocks payment, and displays a verified no-payment/no-order/no-data outcome.

## Screenshots

### Landing page

![Rule Zero landing page](screenshot/01-landing.png)

The landing page introduces the controlled demo and directs evaluators to the guided experience.

### Unauthorized membership blocked

![Unauthorized membership blocked](screenshot/02-membership-blocked.png)

The untrusted ₹199/month recurring membership is blocked because subscriptions are outside the user's authority.

### Payment boundary blocked

![Payment boundary blocked](screenshot/03-payment-blocked.png)

Rule Zero stops at the payment boundary and offers no route to execute the blocked payment.

### Verified safe outcome

![Verified safe outcome](screenshot/04-safe-outcome.png)

The verified outcome shows the product within budget and confirms that no membership, payment, order, or data sharing occurred.

## Architecture summary

Next.js frontend on Vercel → typed FastAPI endpoints on Render → Task Contract → deterministic Worker proposal → Rule Zero Interceptor → explicit Safe Action Gate / one-time approval → Safe Recovery → HMAC-linked audit proof.

## Technologies

Next.js, React, TypeScript, Vitest, Testing Library, Playwright (test-only), FastAPI, Pydantic, pytest, HMAC signing, Vercel, Render, GitHub Actions, and Codex.

## Codex usage

Codex supported phase-scoped repository inspection, implementation, deterministic test creation, adversarial evaluation, diff review, deployment preparation, and release documentation. Humans retained phase boundaries, deployment authority, claim review, and submission control. The repository preserves prompts and build evidence.

## Security posture

Rule Zero demonstrates deny-by-default parsing, typed action boundaries, explicit execution and approval, canonical-state revalidation, untrusted-source handling, constrained recovery, tamper-evident audit chains, safe CORS, and fail-closed production key configuration. It is not production security software.

## Live links

- Demo: https://rule-zero-flax.vercel.app/demo
- Security Lab: https://rule-zero-flax.vercel.app/demo/shopping
- Landing: https://rule-zero-flax.vercel.app
- Backend health: https://rule-zero.onrender.com/health
- Source: https://github.com/Enosh2212/rule-zero
- Video: `[VIDEO_LINK_PLACEHOLDER]`

## Team

- `[TEAM_MEMBER_NAME]` — `[ROLE]`
- `[TEAM_MEMBER_NAME]` — `[ROLE]`

## Submission checklist

- `[ ]` Replace video placeholder with final public link.
- `[ ]` Replace team placeholders.
- `[x]` Capture and add final live screenshots.
- `[ ]` Warm backend and rerun deployment validator.
- `[ ]` Run the three-minute demo from a private window and mobile device.
- `[ ]` Confirm repository visibility and chosen commit.
- `[ ]` Preserve the controlled-demo and non-production disclaimer.
