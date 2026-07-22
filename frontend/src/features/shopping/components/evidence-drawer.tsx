import type { ShoppingScenario } from "../types";

export function EvidenceDrawer({ scenario }: Readonly<{ scenario: ShoppingScenario }>) {
  return (
    <details className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
      <summary className="cursor-pointer font-mono text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
        Developer / evidence drawer
      </summary>
      <div className="mt-5 border-t border-amber-300/15 pt-5">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">Source: {scenario.untrustedInstruction.source}</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">Page visibility: {scenario.untrustedInstruction.visibility}</span>
          <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-red-200">Untrusted evidence</span>
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          This structured scenario field is intentionally excluded from ordinary storefront content. It is revealed here only for demo inspection.
        </p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-red-300/15 bg-black/30 p-4 font-mono text-xs leading-6 text-red-200">
          {scenario.untrustedInstruction.content}
        </pre>
      </div>
    </details>
  );
}
