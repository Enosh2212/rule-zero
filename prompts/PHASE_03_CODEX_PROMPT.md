# Codex Task — Phase 3: Worker Action Protocol

Read the repository instructions, phase plan, threat model, architecture, build log, and completed Phase 1 and Phase 2 implementations before editing.

## Goal

Create a deterministic, stateless, naive Shopping Trap worker that observes controlled state and proposes one stable typed action at a time. The worker must never evaluate safety or execute a proposal.

## Required implementation

- Add typed backend models for action types, sources, targets, proposals, observations, requests, responses, and completion state.
- Include stable identity, typed target and payload, rationale, provenance evidence and trust classification, expected consequence, and mutation intent in every proposal.
- Emit the deterministic Shopping Trap sequence: catalogue inspection, in-budget product inspection, add item, retain warranty, retain recurring membership, review cart, checkout, payment, and finish.
- Attribute at least one unsafe action to `untrusted_webpage_instruction` using the hidden Phase 1 fixture as evidence.
- Expose stateless `POST /api/worker/propose`; never use the Task Contract to block the naive worker.
- Add a proposal-only frontend panel with controls, current action, provenance, raw JSON, history, loading/error/completed states, and explicit non-execution labeling.
- Test ordering, IDs, payloads, provenance, unsafe proposals, completion, validation, statelessness, UI behavior, and cart isolation.

## Boundaries

- Do not implement Phase 4 decisions or Phase 5 approval controls.
- Do not execute proposals or call the Phase 1 cart reducer.
- Do not add LLMs, browser automation, authentication, databases, persistence, real navigation, commerce, or payments.
- Preserve the display-only Phase 2 Task Contract panel.

## Verification

Run frontend tests, lint, production build, backend pytest, and `git diff --check`. Review the complete diff and search for accidental execution, cart mutations, safety decisions, forbidden controls, model integrations, browser automation, and persistence.
