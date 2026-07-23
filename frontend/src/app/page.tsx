import Link from "next/link";

const capabilities = [
  ["01", "Intercept before execution", "Every consequential proposal crosses a typed Rule Zero boundary first."],
  ["02", "Enforce user intent", "Budget, privacy, subscriptions, payment, and approval remain bound to the Task Contract."],
  ["03", "Recover with audit proof", "Blocked behaviour becomes a safe alternative with a tamper-evident record."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <span className="text-sm font-semibold tracking-[0.24em]">RULE ZERO</span>
        <div className="flex gap-4 text-sm text-zinc-400">
          <a href="#how-it-works">How it works</a>
          <Link href="/demo/shopping">Security Lab</Link>
        </div>
      </nav>
      <section className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.24em] text-emerald-300">Pre-action agent security</p>
          <h1 className="mt-5 text-6xl font-semibold tracking-[-.06em] sm:text-8xl">Rule Zero</h1>
          <p className="mt-5 text-2xl text-zinc-300">A pre-action security layer for autonomous AI agents.</p>
          <p className="mt-6 max-w-2xl leading-7 text-zinc-400">
            Agent actions can drift beyond a user&apos;s budget, privacy, or payment authority. Rule Zero evaluates
            consequential agent actions before execution, then allows, blocks, requests approval, or recovers safely.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/demo" className="rounded-lg bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950">Launch Guided Demo</Link>
            <Link href="/demo/shopping" className="rounded-lg border border-white/15 px-5 py-3 text-sm font-medium">Open Security Lab</Link>
            <a href="#how-it-works" className="rounded-lg px-5 py-3 text-sm text-zinc-400">View Architecture</a>
          </div>
          <p className="mt-5 text-xs text-zinc-500">No login required. No real commerce or payment occurs.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[.035] p-7 shadow-2xl shadow-black">
          <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">Action boundary</p>
          <div className="mt-5 space-y-3">
            {["Worker proposal", "Rule Zero evaluation", "ALLOW · BLOCK · ASK APPROVAL", "Controlled execution", "Audit proof"].map((item, index) => (
              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4" key={item}>
                <span className="font-mono text-xs text-zinc-600">0{index + 1}</span><span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how-it-works" className="border-y border-white/10 bg-white/[.02]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
          <p className="font-mono text-xs uppercase tracking-[.22em] text-zinc-500">How it works</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">One boundary before consequences.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {capabilities.map(([number, title, body]) => <article key={number} className="rounded-2xl border border-white/10 p-6"><span className="font-mono text-xs text-emerald-300">{number}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p></article>)}
          </div>
          <div className="mt-10 rounded-xl border border-white/10 p-5 text-sm text-zinc-400">
            User instruction → Task Contract → Worker proposal → Rule Zero → controlled execution or refusal → recovery → HMAC-linked audit.
          </div>
        </div>
      </section>
      <footer className="mx-auto max-w-7xl px-6 py-8 text-xs leading-5 text-zinc-500 sm:px-10">
        This hackathon MVP uses a deterministic simulated shopping environment. No real purchase, payment, navigation, or personal-data submission occurs.
      </footer>
    </main>
  );
}
