const principles = [
  "Intercept before execution",
  "Enforce the user's task contract",
  "Require approval for consequential actions",
  "Record evidence for every decision",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-10">
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="text-sm font-semibold tracking-[0.24em]">RULE ZERO</div>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-400">Phase 1</span>
        </nav>

        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
              Pre-action security for autonomous agents
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">
              Every action must earn permission.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400">
              Rule Zero evaluates an AI agent&apos;s proposed action against user intent, budget,
              privacy, and approval boundaries before it can change the world.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="/demo/shopping" className="rounded-lg bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950">
                Shopping demo — Phase 1
              </a>
              <span className="rounded-lg border border-white/15 px-5 py-3 text-sm text-zinc-500">
                Repository link pending
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">Safety contract</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="space-y-3">
              {principles.map((principle, index) => (
                <div key={principle} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <span className="font-mono text-xs text-zinc-600">0{index + 1}</span>
                  <p className="text-sm text-zinc-300">{principle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-5 text-xs text-zinc-600">
          Controlled environments. No real payments. Evidence-first decisions.
        </footer>
      </div>
    </main>
  );
}
