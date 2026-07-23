"use client";

import { useState } from "react";

import { proposeWorkerAction } from "../api";
import type { ProposedAgentAction } from "../types";

const TOTAL_PROPOSALS = 9;

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function ActionDetails({ action }: Readonly<{ action: ProposedAgentAction }>) {
  const isUntrusted = action.source.trust_classification === "untrusted";
  return (
    <article aria-labelledby="current-proposal-heading" className="mt-5 rounded-xl border border-violet-300/20 bg-black/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-300">{action.action_id}</p>
          <h3 id="current-proposal-heading" className="mt-1 text-lg font-semibold capitalize">{formatLabel(action.action_type)}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-zinc-300">{formatLabel(action.source.type)}</span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${isUntrusted ? "border-red-300/30 bg-red-300/10 text-red-200" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"}`}>{action.source.trust_classification} source</span>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
        <div><dt className="text-xs uppercase tracking-wider text-zinc-500">Target</dt><dd className="mt-1 text-zinc-200">{action.target.type}: {action.target.id}</dd></div>
        <div><dt className="text-xs uppercase tracking-wider text-zinc-500">Would mutate state</dt><dd className="mt-1 text-zinc-200">{action.would_mutate_state ? "Yes — if executed later" : "No"}</dd></div>
        <div className="md:col-span-2"><dt className="text-xs uppercase tracking-wider text-zinc-500">Description</dt><dd className="mt-1 leading-6 text-zinc-300">{action.description}</dd></div>
        <div className="md:col-span-2"><dt className="text-xs uppercase tracking-wider text-zinc-500">Rationale</dt><dd className="mt-1 leading-6 text-zinc-300">{action.rationale}</dd></div>
        <div className="md:col-span-2"><dt className="text-xs uppercase tracking-wider text-zinc-500">Source evidence</dt><dd className="mt-1 rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-xs leading-5 text-zinc-400">{action.source.evidence}</dd></div>
        <div className="md:col-span-2"><dt className="text-xs uppercase tracking-wider text-zinc-500">Expected consequence</dt><dd className="mt-1 leading-6 text-zinc-300">{action.expected_consequence}</dd></div>
      </dl>

      <details className="mt-5 rounded-lg border border-white/10 p-3">
        <summary className="cursor-pointer text-sm text-zinc-300">Raw action JSON</summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-400">{JSON.stringify(action, null, 2)}</pre>
      </details>
    </article>
  );
}

export function WorkerAgentPanel({ onProposalChange }: Readonly<{ onProposalChange?: (action: ProposedAgentAction | null) => void }>) {
  const [nextStepIndex, setNextStepIndex] = useState(0);
  const [currentAction, setCurrentAction] = useState<ProposedAgentAction | null>(null);
  const [history, setHistory] = useState<ProposedAgentAction[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestProposal(stepIndex: number) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await proposeWorkerAction(stepIndex);
      setCurrentAction(response.proposed_action);
      onProposalChange?.(response.proposed_action);
      setHistory((existing) => [...existing, response.proposed_action]);
      setNextStepIndex(response.next_step_index);
      setIsComplete(response.is_complete);
    } catch {
      setError("Unable to request the next worker proposal. Confirm the local backend is running and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function startSimulation() {
    setIsStarted(true);
    void requestProposal(0);
  }

  function resetSimulation() {
    setNextStepIndex(0);
    setCurrentAction(null);
    setHistory([]);
    setIsStarted(false);
    setIsLoading(false);
    setIsComplete(false);
    setError(null);
    onProposalChange?.(null);
  }

  return (
    <section aria-labelledby="worker-agent-heading" className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.035] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Phase 3 · naive deterministic worker</p><h2 id="worker-agent-heading" className="mt-2 text-2xl font-semibold">Worker Agent Simulator</h2></div>
        <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs text-violet-100">Proposal only — no action has been executed.</span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">The worker emits one typed proposal at a time. It does not read the contract to make safety decisions and cannot change this storefront.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!isStarted && <button type="button" onClick={startSimulation} disabled={isLoading} className="rounded-lg bg-violet-300 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-violet-200 disabled:cursor-wait disabled:bg-zinc-700">Start Worker Simulation</button>}
        {isStarted && !isComplete && <button type="button" onClick={() => void requestProposal(nextStepIndex)} disabled={isLoading} className="rounded-lg bg-violet-300 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-violet-200 disabled:cursor-wait disabled:bg-zinc-700">{isLoading ? "Requesting proposal…" : "Propose Next Action"}</button>}
        {isStarted && <button type="button" onClick={resetSimulation} disabled={isLoading} className="rounded-lg border border-white/15 px-5 py-3 text-sm text-zinc-300 hover:border-white/30 disabled:cursor-wait disabled:text-zinc-600">Reset Simulation</button>}
        <span className="text-sm text-zinc-500">Sequence position: {history.length} / {TOTAL_PROPOSALS}</span>
      </div>

      <div aria-live="polite">
        {isLoading && !currentAction && <p className="mt-4 text-sm text-zinc-400">Requesting first proposal…</p>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}
        {isComplete && <p className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">Simulation complete. All proposals were displayed; nothing was executed.</p>}
        {currentAction && <ActionDetails action={currentAction} />}
      </div>

      {history.length > 0 && (
        <section aria-labelledby="proposal-history-heading" className="mt-6 border-t border-white/10 pt-5">
          <h3 id="proposal-history-heading" className="text-sm font-semibold">Proposal history</h3>
          <ol className="mt-3 space-y-2">
            {history.map((action) => (
              <li key={action.action_id} className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm"><span className="font-mono text-xs text-zinc-500">{action.sequence_number.toString().padStart(2, "0")}</span><span className="capitalize text-zinc-300">{formatLabel(action.action_type)}</span><span className="ml-auto text-xs text-zinc-500">{action.action_id}</span></li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
