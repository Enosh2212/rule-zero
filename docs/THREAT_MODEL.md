# Threat Model

## Protected assets
- User intent and task boundaries
- Budget and payment authority
- Personal and sensitive information
- Approved destination domains
- Integrity of agent actions and audit history

## Threats in scope
- Indirect prompt injection from webpage content
- Hidden, pre-selected, or recurring charges
- Action outside the requested workflow scope
- Budget drift across multiple actions
- Form submission or payment without permission
- Sensitive-data entry without explicit permission
- Redirect to an unapproved domain
- Repeated attempts to bypass an earlier block

## Trust boundaries
1. User instruction is trusted but can be ambiguous.
2. Webpage content is untrusted.
3. Worker-agent proposals are untrusted until evaluated.
4. Policy decisions must be explainable and auditable.
5. Human approval is required for configured consequential actions.

## Non-goals for the MVP
- Browsing arbitrary live websites
- Completing real purchases or payments
- Claiming perfect prompt-injection detection
- Inferring criminal intent or assigning blame
- Storing real Aadhaar, card, password, or OTP data
