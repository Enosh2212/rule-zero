"use client";

import { useEffect, useState } from "react";

import type { TaskContract } from "../../contracts/types";
import type { ActionEvaluationResponse } from "../../interceptor/types";
import { formatInr } from "../../shopping/pricing";
import type { ProposedAgentAction } from "../../worker/types";
import { decideControlledApproval, executeControlledAction, loadShoppingState } from "../api";
import type { ActionExecutionResponse, ControlledShoppingState } from "../types";

type Props = Readonly<{
  proposedAction: ProposedAgentAction | null;
  contract: TaskContract | null;
  evaluation: ActionEvaluationResponse | null;
  controlledState?: ControlledShoppingState | null;
  onStateChange?: (state: ControlledShoppingState) => void;
  onExecutionChange?: (response: ActionExecutionResponse) => void;
}>;

const statusStyle: Record<string, string> = {
  executed: "text-emerald-200", refused: "text-red-200", approval_required: "text-amber-200",
  rejected: "text-zinc-300", no_operation: "text-cyan-200",
};

export function SafeActionGatePanel({ proposedAction, contract, evaluation, controlledState, onStateChange, onExecutionChange }: Props) {
  const [internalState, setInternalState] = useState<ControlledShoppingState | null>(null);
  const [result, setResult] = useState<ActionExecutionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = controlledState ?? internalState;

  function publishState(nextState: ControlledShoppingState) {
    setInternalState(nextState);
    onStateChange?.(nextState);
  }

  async function resetState() {
    setLoading(true); setError(null); setResult(null);
    try { publishState((await loadShoppingState()).state); }
    catch { setError("Unable to load the controlled Shopping Trap state."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    loadShoppingState()
      .then((snapshot) => {
        if (active) {
          setInternalState(snapshot.state);
          onStateChange?.(snapshot.state);
        }
      })
      .catch(() => { if (active) setError("Unable to load the controlled Shopping Trap state."); });
    return () => { active = false; };
  }, [onStateChange]);

  async function submitAction() {
    if (!state || !proposedAction || !contract) return;
    setLoading(true); setError(null);
    try {
      const response = await executeControlledAction({
        scenario_id: "shopping-trap", contract, proposed_action: proposedAction,
        current_state: state, expected_state_version: state.state_version, approval: null,
      });
      setResult(response);
      publishState(response.after_state);
      onExecutionChange?.(response);
    } catch { setError("The Safe Action Gate could not process this action."); }
    finally { setLoading(false); }
  }

  async function decide(decision: "approve" | "reject") {
    if (!state || !proposedAction || !contract || !result?.approval_request) return;
    setLoading(true); setError(null);
    try {
      const response = await decideControlledApproval({
        scenario_id: "shopping-trap", contract, proposed_action: proposedAction,
        current_state: state, approval_request_id: result.approval_request.approval_request_id, decision,
      });
      setResult(response);
      publishState(response.after_state);
      onExecutionChange?.(response);
    } catch { setError("The approval decision could not be recorded."); }
    finally { setLoading(false); }
  }

  const ready = Boolean(state && proposedAction && contract && evaluation);
  const matchingEvaluation = evaluation?.evaluated_action_id === proposedAction?.action_id ? evaluation : null;

  return (
    <section aria-labelledby="safe-gate-heading" className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.035] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Phase 5 · controlled execution</p><h2 id="safe-gate-heading" className="mt-2 text-2xl font-semibold">Safe Action Gate</h2></div>
        <button type="button" onClick={() => void resetState()} disabled={loading} className="rounded-lg border border-white/15 px-3 py-2 text-xs disabled:opacity-50">Reset controlled state</button>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">The backend re-evaluates every typed proposal against canonical prices and state. Nothing runs automatically.</p>
      <p className="mt-2 text-sm font-medium text-violet-100">No real purchase, payment, navigation, or data submission occurs.</p>

      {state && <section aria-label="Controlled state" className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 p-3"><span className="text-zinc-500">State version</span><strong className="mt-1 block">{state.state_version}</strong></div>
        <div className="rounded-lg border border-white/10 p-3"><span className="text-zinc-500">Controlled cart</span><strong className="mt-1 block">{state.cart_items.length ? state.cart_items.map((line) => `${line.product_id} × ${line.quantity}`).join(", ") : "Empty"}</strong></div>
        <div className="rounded-lg border border-white/10 p-3"><span className="text-zinc-500">Warranty / checkout</span><strong className="mt-1 block">{state.addons.warranty_enabled ? "Enabled" : "Off"} / {state.checkout_preview_reached ? "Preview" : "Not reached"}</strong></div>
      </section>}

      {proposedAction && <p className="mt-4 text-sm text-zinc-300">Current action: <span className="font-mono text-violet-200">{proposedAction.action_id}</span> · {proposedAction.description}</p>}

      {!proposedAction && <p className="mt-5 rounded-lg border border-dashed border-white/15 p-4 text-sm text-zinc-400">Generate a Worker proposal first.</p>}
      {proposedAction && !contract && <p className="mt-5 text-sm text-amber-200">Generate a Task Contract before using the gate.</p>}
      {proposedAction && contract && !matchingEvaluation && <p className="mt-5 text-sm text-amber-200">Evaluate this exact proposal with Rule Zero before using the gate.</p>}

      {matchingEvaluation?.decision === "block" && <p role="status" className="mt-5 rounded-lg border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">BLOCK enforced: this action cannot be executed or approved.</p>}
      {matchingEvaluation && matchingEvaluation.decision !== "block" && <button type="button" onClick={() => void submitAction()} disabled={!ready || loading} className="mt-5 rounded-lg bg-violet-300 px-5 py-3 text-sm font-semibold text-zinc-950 disabled:bg-zinc-700 disabled:text-zinc-400">{loading ? "Processing…" : matchingEvaluation.decision === "allow" ? "Execute allowed action" : "Request explicit approval"}</button>}

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}
      {result && <article aria-live="polite" className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">
        <h3 className={`font-semibold uppercase ${statusStyle[result.status] ?? "text-zinc-100"}`}>Execution status: {result.status.replaceAll("_", " ")}</h3>
        <p className="mt-2 text-sm text-zinc-300">Fresh execution-time decision: {result.fresh_evaluation.decision.toUpperCase()} · State {result.state_changed ? "changed" : "unchanged"}</p>
        {result.refusal_reason && <p className="mt-2 text-sm text-red-200">Refusal reason: {result.refusal_reason.replaceAll("_", " ")}</p>}
        <p className="mt-2 text-xs text-zinc-500">Triggered rules: {result.triggered_rules.length ? result.triggered_rules.join(", ") : "none"}</p>
        <p className="mt-3 text-sm text-zinc-400">Before: {result.before_summary}</p><p className="mt-1 text-sm text-zinc-300">After: {result.after_summary}</p>
        {result.approval_request && <section aria-labelledby="approval-heading" className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/[0.06] p-4">
          <h4 id="approval-heading" className="font-semibold text-amber-100">Approval required for this exact action</h4>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><div><dt className="text-zinc-500">Immediate</dt><dd>{result.approval_request.immediate_one_time_cost === null ? "Unknown" : formatInr(result.approval_request.immediate_one_time_cost)}</dd></div><div><dt className="text-zinc-500">Recurring</dt><dd>{result.approval_request.recurring_monthly_cost === null ? "Unknown" : `${formatInr(result.approval_request.recurring_monthly_cost)}/month`}</dd></div><div><dt className="text-zinc-500">Projected</dt><dd>{result.approval_request.projected_total === null ? "Unknown" : formatInr(result.approval_request.projected_total)}</dd></div></dl>
          <p className="mt-3 text-xs text-zinc-400">Rules: {result.approval_request.triggered_rules.join(", ")}</p><p className="mt-2 text-xs text-amber-100">{result.approval_request.single_use_warning}</p>
          <div className="mt-4 flex gap-3"><button type="button" onClick={() => void decide("approve")} disabled={loading} className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-950">Approve once</button><button type="button" onClick={() => void decide("reject")} disabled={loading} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Reject</button></div>
        </section>}
        {result.approval_record && <p className="mt-3 text-sm text-zinc-300">Approval status: {result.approval_record.status}. {result.approval_record.message}</p>}
        <details className="mt-4 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm">Execution trace and raw result</summary><ol className="mt-3 list-decimal pl-5 text-xs text-zinc-400">{result.execution_trace.steps.map((step) => <li key={step}>{step}</li>)}</ol><pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-500">{JSON.stringify(result, null, 2)}</pre></details>
      </article>}
    </section>
  );
}
