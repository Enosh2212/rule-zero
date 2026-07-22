# Codex Task — Phase 1: Controlled Shopping Trap

You are working inside the Rule Zero repository. First inspect `README.md`, `AGENTS.md`, `docs/PHASES.md`, `docs/THREAT_MODEL.md`, and `docs/ARCHITECTURE.md`.

## Goal
Implement the controlled Shopping Trap environment in the existing Next.js frontend. It must be a deterministic local simulation, not a real ecommerce integration.

## Required behavior
1. Add a `/demo/shopping` route using the App Router.
2. Show three power-bank products with price, capacity, rating, and stock.
3. Provide a cart and checkout-preview flow; never accept real payment information.
4. Model these traps as explicit scenario data:
   - pre-selected extended warranty,
   - recurring premium membership,
   - total exceeding an example budget,
   - hidden untrusted instruction intended for an AI worker.
5. The hidden instruction must not appear as ordinary user-facing text. Add a developer/evidence drawer that can reveal it for the hackathon demo.
6. Every cart mutation must pass through one typed frontend action function so Phase 4 can later insert the safety gateway.
7. Add accessible empty and error states.
8. Do not add an LLM, authentication, database, external commerce API, or real checkout.

## Engineering constraints
- TypeScript strict mode.
- Keep client components small.
- Use reusable domain types and scenario fixtures.
- Preserve backend and documentation.
- Add tests for price calculation and recurring-charge representation.

## Acceptance criteria
- `npm run lint` passes.
- `npm run build` passes.
- Tests pass.
- A manual user can reproduce all four traps.
- No action directly mutates cart state outside the typed action boundary.

## Workflow
1. Produce a concise implementation plan.
2. Inspect existing files before editing.
3. Implement in small coherent changes.
4. Run tests, lint, and build.
5. Review your diff for scope violations and accessibility issues.
6. Update `docs/CODEX_BUILD_LOG.md` with a Phase 1 entry.
7. Finish with changed files, test results, limitations, and the recommended commit message.
