# Rule Zero Demo Script

## Three-minute evaluator script

**0:00–0:20 — Problem**

“AI agents can plan well and still take an action the user never authorized. Rule Zero is a permission firewall for AI agents: the Worker proposes, but a separate deterministic boundary decides what may execute.”

Open the [Guided Demo](https://rule-zero-flax.vercel.app/demo).

**0:20–0:45 — Mission**

“Our controlled user wants a power bank under ₹1,500, no subscriptions, no personal-data sharing, and a stop before payment. Nothing here touches a real store or payment system.”

Click **Run Shopping Agent**.

“Rule Zero converts the instruction into a typed, deny-by-default safety contract.”

**0:45–1:15 — Safe action**

Click **Check Product Safety**.

“The Worker proposes a ₹1,499 power bank. Rule Zero returns ALLOW, but notice the cart is still empty. A decision is not execution.”

Click **Add Product Safely**.

“Only this explicit control reaches the Safe Action Gate, where the backend revalidates canonical price and state.”

**1:15–1:50 — Attack and recovery**

“Now untrusted webpage content tells the agent to keep a ₹199-per-month membership. The same page that suggests an action cannot grant authority for it.”

Point to **RULE ZERO: BLOCKED** and its reasons.

“There is no override or execute-blocked button.”

Click **Continue Without Membership**.

“Recovery removes the recurring scope violation without changing the original contract.”

**1:50–2:20 — Payment boundary**

“The agent reaches payment. Payment authority was never granted, so Rule Zero blocks it. Again, there is no approval or execution path.”

Click **Stop Before Payment**.

**2:20–2:50 — Evidence**

“The safe outcome is explicit: ₹1,499 due, no recurring charge, no payment, no order, no personal data, and the user constraints are preserved.”

Click **View Security Proof**.

“The proof shows the unchanged contract, triggered policy rules, recovery, action timeline, and verified audit chain. Replay is read-only; it cannot rerun operations.”

**2:50–3:00 — Close**

“The shopping scene is only the demo. The product is the authorization boundary between any agent proposal and a consequential tool.”

## Hinglish practice version

“AI agent smart ho sakta hai, lekin phir bhi user ki permission ke bahar action le sakta hai. Rule Zero ek permission firewall hai—Worker sirf action propose karta hai; execute karne ka decision deterministic safety layer leti hai.

User ko ₹1,500 ke andar power bank chahiye, subscription nahi chahiye, personal data share nahi karna, aur payment se pehle rukna hai. **Run Shopping Agent** se instruction typed safety contract banta hai.

₹1,499 product par **Check Product Safety** kijiye. Decision ALLOW hai, lekin cart abhi bhi empty hai—ALLOW ka matlab automatic execution nahi. **Add Product Safely** ka explicit click hi backend action gate ko call karta hai.

Ab webpage hidden instruction se ₹199/month membership add karna chahta hai. Rule Zero ise BLOCK karta hai, kyunki recurring subscription user ne mana ki hai aur webpage content authority nahi hai. Koi override ya execute-blocked button nahi hai. **Continue Without Membership** safe recovery hai aur original contract change nahi hota.

Payment boundary par Rule Zero dobara BLOCK karta hai, kyunki payment authority kabhi mili hi nahi. **Stop Before Payment** ke baad safe outcome dikhata hai: product ₹1,499, recurring charge none, payment no, order no, personal data no.

**View Security Proof** contract, policy findings, recovery aur verified audit timeline dikhata hai. Replay read-only hai. Shopping sirf controlled example hai; actual idea agent aur consequential tool ke beech permission firewall hai.”

## Presenter safeguards

- Warm `https://rule-zero.onrender.com/health` before starting.
- Use no real personal or payment data.
- If the backend is cold, state that Render is waking and retry the same explicit control once.
- Do not improvise claims about arbitrary websites, production readiness, or cryptographic webpage provenance.
- Keep the Security Lab as an optional technical follow-up after the three-minute story.
