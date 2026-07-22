# Problem Statement

Autonomous AI agents can browse websites, fill forms, select products, and initiate consequential workflows. Their ability to act creates a safety gap: webpages can contain untrusted instructions, interfaces can introduce hidden or pre-selected costs, and an agent can misunderstand or exceed the user's intended permissions.

Most safeguards operate at prompt time or after an incident. Rule Zero introduces a pre-action control layer. Every proposed action is converted into a structured request and evaluated against the user's task contract, deterministic policies, semantic risk signals, and approval boundaries before it can change state.

The hackathon MVP demonstrates this architecture in controlled environments so attacks are reproducible, safe, and easy to evaluate.
