import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Agent proposes",
    body: "The AI agent proposes an action but cannot execute it directly.",
  },
  {
    number: "2",
    title: "Rule Zero checks",
    body: "The action is checked against the user's budget, privacy, and permissions.",
  },
  {
    number: "3",
    title: "Safe action continues",
    body: "Unsafe actions are blocked and a safe alternative can continue.",
  },
] as const;

const primaryCta =
  "rounded-lg bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300";
const secondaryCta =
  "rounded-lg border border-white/25 bg-white/[.04] px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white/50 hover:bg-white/[.09] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-sm font-semibold tracking-[0.2em]">RULE ZERO</span>
        <div className="flex items-center gap-4 text-sm text-zinc-300">
          <a className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4" href="#how-it-works">
            How it works
          </a>
          <Link className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4" href="/demo/shopping">
            Advanced Security Lab
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_.95fr] lg:py-14">
        <div>
          <p className="text-sm font-semibold text-emerald-300">Safety checks before AI actions</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            Stop AI agents before they make unsafe decisions.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
            Rule Zero checks every important action before an AI agent clicks, shares data, activates a subscription,
            or crosses a payment boundary.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/demo" className={primaryCta}>
              See Rule Zero in Action
            </Link>
            <Link href="/demo/shopping" className={secondaryCta}>
              Explore Security Lab
            </Link>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-500">
            This is a controlled simulation. No real purchase, payment, navigation, or personal-data submission occurs.
          </p>
        </div>

        <article
          aria-label="Rule Zero subscription blocking example"
          className="overflow-hidden rounded-3xl border border-white/15 bg-[#111318] shadow-2xl shadow-black/40"
        >
          <div className="border-b border-white/10 px-6 py-4">
            <p className="text-sm font-semibold">A risky action, stopped before execution</p>
          </div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            <section className="bg-[#111318] p-5">
              <h2 className="text-sm font-semibold text-zinc-300">User request</h2>
              <p className="mt-3 text-lg font-medium">Find a power bank under ₹1,500.</p>
              <p className="mt-1 text-sm text-zinc-400">No subscriptions. Stop before payment.</p>
            </section>
            <section className="bg-[#111318] p-5">
              <h2 className="text-sm font-semibold text-zinc-300">Agent attempt</h2>
              <p className="mt-3 text-lg font-medium">Add Premium Membership</p>
              <p className="mt-1 text-sm text-amber-200">₹199/month recurring</p>
            </section>
          </div>
          <section className="border-t border-red-300/20 bg-red-400/[.08] p-5">
            <h2 className="text-sm font-semibold text-zinc-300">Rule Zero decision</h2>
            <p className="mt-3 text-2xl font-semibold text-red-200">BLOCKED</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              <span className="font-semibold text-zinc-100">Reason:</span> Recurring payment was never authorized.
            </p>
          </section>
        </article>
      </section>

      <section id="how-it-works" className="border-y border-white/10 bg-white/[.02]">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-white/10 bg-black/10 p-6">
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-300 text-sm font-bold text-zinc-950">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-7 text-sm leading-6 text-zinc-500 sm:px-10">
        Rule Zero is a controlled hackathon demonstration, not a general-purpose purchasing agent.
      </footer>
    </main>
  );
}
