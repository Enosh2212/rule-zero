"use client";

import { useState, type FormEvent } from "react";

import { formatInr } from "../../shopping/pricing";

import { parseTaskContract } from "../api";
import type { ActionName, TaskContract } from "../types";

export const DEFAULT_TASK_INSTRUCTION =
  "Buy a power bank under ₹1,500. Do not add subscriptions. Do not share personal information. Stop before payment.";

function formatAction(action: ActionName): string {
  return action.replaceAll("_", " ");
}

function ActionBadges({ actions, tone }: Readonly<{ actions: readonly ActionName[]; tone: "allow" | "deny" | "approval" }>) {
  const tones = {
    allow: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    deny: "border-red-300/20 bg-red-300/10 text-red-100",
    approval: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  };

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <li key={action} className={`rounded-full border px-3 py-1 text-xs capitalize ${tones[tone]}`}>
          {formatAction(action)}
        </li>
      ))}
    </ul>
  );
}

export function ContractPreview({ contract }: Readonly<{ contract: TaskContract }>) {
  return (
    <section aria-labelledby="contract-preview-heading" className="mt-6 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">Schema {contract.schema_version}</p>
          <h3 id="contract-preview-heading" className="mt-1 text-lg font-semibold">Generated safety contract</h3>
          <p className="mt-1 text-sm text-zinc-400">{contract.normalized_intent}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-right">
          <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Maximum budget</span>
          <strong className="mt-1 block text-lg">
            {contract.budget.maximum_amount === null ? "Not recognized" : formatInr(contract.budget.maximum_amount)}
          </strong>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 md:grid-cols-2">
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Allowed actions</dt><dd><ActionBadges actions={contract.permissions.allowed_actions} tone="allow" /></dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Prohibited actions</dt><dd><ActionBadges actions={contract.permissions.prohibited_actions} tone="deny" /></dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Human approval required</dt><dd><ActionBadges actions={contract.permissions.actions_requiring_human_approval} tone="approval" /></dd></div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Parser status</dt>
          <dd className="mt-3 text-sm text-zinc-300">{contract.parser_completeness.replaceAll("_", " ")} · {Math.round(contract.parser_confidence * 100)}% confidence</dd>
          <dd className="mt-1 text-xs text-zinc-500">Sensitive-data sharing: prohibited ({contract.sensitive_data_policy.restriction_source.replaceAll("_", " ")})</dd>
        </div>
      </dl>

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Parse warnings</h4>
        {contract.parse_warnings.length ? (
          <ul className="mt-3 space-y-2">
            {contract.parse_warnings.map((warning) => (
              <li key={`${warning.code}-${warning.field}`} className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3 text-sm text-amber-100">
                <span className="font-mono text-[10px] text-amber-300">{warning.code}</span>
                <p className="mt-1 text-amber-50/80">{warning.message}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-zinc-400">No parse warnings.</p>}
      </div>
    </section>
  );
}

export function TaskContractPanel() {
  const [instruction, setInstruction] = useState(DEFAULT_TASK_INSTRUCTION);
  const [contract, setContract] = useState<TaskContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await parseTaskContract(instruction);
      setContract(response.contract);
    } catch {
      setContract(null);
      setError("Unable to generate the safety contract. Confirm the local backend is running and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-labelledby="task-contract-heading" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.035] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Phase 2 · display only</p><h2 id="task-contract-heading" className="mt-2 text-2xl font-semibold">Task Contract Engine</h2></div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">Not connected to cart actions</span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">Convert the user instruction into deterministic safety constraints. This preview does not authorize, intercept, or execute any action.</p>

      <form onSubmit={handleSubmit} className="mt-5">
        <label htmlFor="task-instruction" className="text-sm font-medium text-zinc-200">User instruction</label>
        <textarea id="task-instruction" value={instruction} onChange={(event) => setInstruction(event.target.value)} required rows={4} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 text-sm leading-6 text-zinc-100 outline-none transition focus:border-cyan-300" />
        <button type="submit" disabled={isLoading || !instruction.trim()} className="mt-3 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200 disabled:cursor-wait disabled:bg-zinc-700 disabled:text-zinc-400">
          {isLoading ? "Generating contract…" : "Generate Safety Contract"}
        </button>
      </form>

      <div aria-live="polite">
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}
        {contract && <ContractPreview contract={contract} />}
      </div>
    </section>
  );
}
