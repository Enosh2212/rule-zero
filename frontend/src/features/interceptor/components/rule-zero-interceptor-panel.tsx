"use client";

import { useState } from "react";

import { formatInr } from "../../shopping/pricing";
import type { TaskContract } from "../../contracts/types";
import type { ProposedAgentAction } from "../../worker/types";
import { evaluateProposedAction } from "../api";
import type { ActionEvaluationResponse, EvaluationContext, RuleZeroDecision } from "../types";

type RuleZeroInterceptorPanelProps = Readonly<{
  proposedAction: ProposedAgentAction | null;
  contract: TaskContract | null;
  context: EvaluationContext | null;
  onEvaluationChange?: (evaluation: ActionEvaluationResponse) => void;
}>;

const decisionLabels: Record<RuleZeroDecision, string> = {
  allow: "ALLOW",
  block: "BLOCK",
  ask_approval: "ASK APPROVAL",
};

const decisionStyles: Record<RuleZeroDecision, string> = {
  allow: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  block: "border-red-300/30 bg-red-300/10 text-red-100",
  ask_approval: "border-amber-300/30 bg-amber-300/10 text-amber-100",
};

function amount(value: number | null, currency: "INR"): string {
  return value === null ? "Unknown" : currency === "INR" ? formatInr(value) : String(value);
}

function EvaluationDetails({ evaluation }: Readonly<{ evaluation: ActionEvaluationResponse }>) {
  const consequence = evaluation.consequence_assessment;
  return (
    <article aria-labelledby="evaluation-result-heading" className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{evaluation.evaluation_id}</p>
          <h3 id="evaluation-result-heading" className="mt-1 text-lg font-semibold">Evaluated {evaluation.evaluated_action_id}</h3>
        </div>
        <span role="status" className={`rounded-full border px-4 py-2 text-sm font-bold ${decisionStyles[evaluation.decision]}`}>Decision: {decisionLabels[evaluation.decision]}</span>
      </div>
      <p className="mt-4 font-medium text-zinc-200">{evaluation.summary}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{evaluation.explanation}</p>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-zinc-500">Immediate cost</dt><dd className="mt-1 font-semibold">{amount(consequence.immediate_one_time_cost, consequence.currency)}</dd></div>
        <div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-zinc-500">Recurring monthly</dt><dd className="mt-1 font-semibold">{amount(consequence.recurring_monthly_cost, consequence.currency)}</dd></div>
        <div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-zinc-500">Projected due today</dt><dd className="mt-1 font-semibold">{amount(consequence.projected_due_today_total, consequence.currency)}</dd></div>
        <div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-zinc-500">Human approval</dt><dd className="mt-1 font-semibold">{evaluation.human_approval_required ? "Required" : "Not required"}</dd></div>
      </dl>

      <section aria-labelledby="triggered-rules-heading" className="mt-5">
        <h4 id="triggered-rules-heading" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Triggered policy rules</h4>
        <ul className="mt-3 space-y-2">
          {evaluation.triggered_policy_findings.map((finding, index) => (
            <li key={`${finding.rule_id}-${index}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-3 text-sm">
              <span className="font-mono text-xs text-cyan-200">{finding.rule_id}</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-zinc-400">Severity: {finding.severity}</span>
              <span className="basis-full text-zinc-300">{finding.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="contract-conflicts-heading">
          <h4 id="contract-conflicts-heading" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Contract conflicts</h4>
          {evaluation.detected_contract_conflicts.length ? <ul className="mt-2 space-y-2">{evaluation.detected_contract_conflicts.map((conflict, index) => <li key={`${conflict.contract_field}-${index}`} className="rounded-lg border border-red-300/15 bg-red-300/[0.05] p-3 text-sm text-zinc-300">{conflict.explanation}</li>)}</ul> : <p className="mt-2 text-sm text-zinc-400">No contract conflicts detected.</p>}
        </section>
        <section aria-labelledby="source-trust-heading">
          <h4 id="source-trust-heading" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Source trust</h4>
          <p className="mt-2 text-sm capitalize text-zinc-300">{evaluation.action_source_trust_assessment.trust_classification} · {evaluation.action_source_trust_assessment.source_type.replaceAll("_", " ")}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{evaluation.action_source_trust_assessment.summary}</p>
        </section>
      </div>

      <details className="mt-5 rounded-lg border border-white/10 p-3">
        <summary className="cursor-pointer text-sm text-zinc-300">Deterministic decision trace</summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-5 text-zinc-400">{evaluation.decision_trace.precedence.map((step) => <li key={step}>{step}</li>)}</ol>
        <p className="mt-3 text-xs text-zinc-300">{evaluation.decision_trace.resolution}</p>
      </details>
      <details className="mt-3 rounded-lg border border-white/10 p-3">
        <summary className="cursor-pointer text-sm text-zinc-300">Raw evaluation JSON</summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-400">{JSON.stringify(evaluation, null, 2)}</pre>
      </details>
    </article>
  );
}

export function RuleZeroInterceptorPanel({ proposedAction, contract, context, onEvaluationChange }: RuleZeroInterceptorPanelProps) {
  const [evaluation, setEvaluation] = useState<ActionEvaluationResponse | null>(null);
  const [history, setHistory] = useState<ActionEvaluationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function evaluateLatest() {
    if (!proposedAction || !contract || !context) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await evaluateProposedAction({
        scenario_id: "shopping-trap",
        contract,
        proposed_action: proposedAction,
        context,
      });
      setEvaluation(response);
      setHistory((existing) => [...existing, response]);
      onEvaluationChange?.(response);
    } catch {
      setError("Unable to evaluate the proposal. Confirm the local backend is running and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-labelledby="interceptor-heading" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.035] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Phase 4 · deterministic policy</p><h2 id="interceptor-heading" className="mt-2 text-2xl font-semibold">Rule Zero Interceptor</h2></div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">Evaluation only — no action has been executed.</span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">Evaluate the latest Worker proposal against the generated Task Contract and current controlled cart snapshot.</p>

      {!proposedAction ? (
        <p className="mt-5 rounded-lg border border-dashed border-white/15 p-4 text-sm text-zinc-400">No Worker proposal is available. Start the Worker simulation first.</p>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void evaluateLatest()} disabled={isLoading || !contract || !context} className="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">{isLoading ? "Evaluating proposal…" : "Evaluate with Rule Zero"}</button>
          <span className="text-sm text-zinc-500">Latest proposal: {proposedAction.action_id}</span>
          {!contract && <span className="text-sm text-amber-200">Generate a Task Contract before evaluation.</span>}
        </div>
      )}

      <div aria-live="polite">
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}
        {evaluation && evaluation.evaluated_action_id === proposedAction?.action_id && <EvaluationDetails evaluation={evaluation} />}
      </div>

      {history.length > 0 && (
        <section aria-labelledby="evaluation-history-heading" className="mt-6 border-t border-white/10 pt-5">
          <h3 id="evaluation-history-heading" className="text-sm font-semibold">Evaluation history</h3>
          <ol className="mt-3 space-y-2">{history.map((item, index) => <li key={`${item.evaluation_id}-${index}`} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm"><span className="font-mono text-xs text-zinc-500">{String(index + 1).padStart(2, "0")}</span><span>{item.evaluated_action_id}</span><span className="ml-auto font-semibold">{decisionLabels[item.decision]}</span></li>)}</ol>
        </section>
      )}
    </section>
  );
}
