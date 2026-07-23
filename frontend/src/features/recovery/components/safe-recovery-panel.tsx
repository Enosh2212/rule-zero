"use client";

import { useState } from "react";

import { decideControlledApproval } from "../../action-gate/api";
import type { ActionExecutionResponse, ControlledShoppingState } from "../../action-gate/types";
import type { TaskContract } from "../../contracts/types";
import type { ActionEvaluationResponse } from "../../interceptor/types";
import type { ProposedAgentAction } from "../../worker/types";
import { executeRecoveryStep, generateRecoveryPlan } from "../api";
import type { RecoveryExecutionResponse, RecoveryPlan } from "../types";

type Props = Readonly<{
  proposedAction: ProposedAgentAction | null;
  contract: TaskContract | null;
  evaluation: ActionEvaluationResponse | null;
  executionResponse: ActionExecutionResponse | null;
  controlledState: ControlledShoppingState | null;
  onStateChange: (state: ControlledShoppingState) => void;
  onPlanGenerated?: (plan: RecoveryPlan) => void;
  onRecoveryExecution?: (response: RecoveryExecutionResponse) => void;
  onApprovalResponse?: (response: ActionExecutionResponse) => void;
}>;

export function SafeRecoveryPanel({ proposedAction, contract, evaluation, executionResponse, controlledState, onStateChange, onPlanGenerated, onRecoveryExecution, onApprovalResponse }: Props) {
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [stepResult, setStepResult] = useState<RecoveryExecutionResponse | null>(null);
  const [completed, setCompleted] = useState<readonly number[]>([]);
  const [skipped, setSkipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchingExecution = executionResponse?.fresh_evaluation.evaluated_action_id === proposedAction?.action_id ? executionResponse : null;
  const recoverable = evaluation?.decision === "block" || matchingExecution?.status === "refused" || matchingExecution?.status === "rejected";
  if (!recoverable || !proposedAction || !evaluation) return null;

  const currentIndex = plan?.steps.findIndex((_, index) => !completed.includes(index)) ?? -1;
  const currentStep = plan && currentIndex >= 0 ? plan.steps[currentIndex] : null;

  async function generate() {
    if (!contract || !controlledState || !proposedAction || !evaluation) return;
    const boundContract = contract;
    const boundState = controlledState;
    const boundAction = proposedAction;
    const boundEvaluation = evaluation;
    setLoading(true); setError(null); setSkipped(false); setStepResult(null); setCompleted([]);
    try {
      const generated = await generateRecoveryPlan({
        scenario_id: "shopping-trap", contract: boundContract, triggering_action: boundAction,
        evaluation: boundEvaluation, execution_response: matchingExecution, current_state: boundState,
      });
      setPlan(generated);
      onPlanGenerated?.(generated);
    } catch { setError("Unable to generate a safe recovery plan from the canonical backend state."); }
    finally { setLoading(false); }
  }

  async function executeStep() {
    if (!contract || !controlledState || !plan || !currentStep || currentIndex < 0) return;
    setLoading(true); setError(null);
    try {
      const response = await executeRecoveryStep({ scenario_id: "shopping-trap", contract, recovery_plan: plan, step_index: currentIndex, current_state: controlledState });
      setStepResult(response);
      onStateChange(response.after_state);
      onRecoveryExecution?.(response);
      if (response.step_status === "completed") setCompleted((items) => [...items, currentIndex]);
    } catch { setError("Recovery step was refused or the controlled state is stale. Generate a fresh plan."); }
    finally { setLoading(false); }
  }

  async function decide(decision: "approve" | "reject") {
    const approval = stepResult?.execution_response.approval_request;
    if (!approval || !contract || !controlledState || !currentStep || currentIndex < 0) return;
    setLoading(true); setError(null);
    try {
      const response = await decideControlledApproval({ scenario_id: "shopping-trap", contract, proposed_action: currentStep.proposed_action, current_state: controlledState, approval_request_id: approval.approval_request_id, decision });
      onStateChange(response.after_state);
      onApprovalResponse?.(response);
      setStepResult((previous) => previous ? { ...previous, execution_response: response, after_state: response.after_state, state_changed: response.state_changed, step_status: response.status === "executed" || response.status === "no_operation" ? "completed" : response.status === "rejected" ? "refused" : previous.step_status, completion_status: response.status === "executed" || response.status === "no_operation" ? plan?.completion_status ?? previous.completion_status : "in_progress" } : previous);
      if (response.status === "executed" || response.status === "no_operation") setCompleted((items) => [...items, currentIndex]);
    } catch { setError("Recovery approval could not be resolved safely."); }
    finally { setLoading(false); }
  }

  function reset() { setPlan(null); setStepResult(null); setCompleted([]); setSkipped(false); setError(null); }

  const finished = Boolean(plan && completed.length === plan.steps.length);
  return (
    <section aria-labelledby="recovery-heading" className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.035] p-5 sm:p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Phase 6 · deterministic recovery</p>
      <h2 id="recovery-heading" className="mt-2 text-2xl font-semibold">Safe Recovery Planner</h2>
      <p className="mt-3 text-sm text-zinc-400">Recovery is needed because <strong className="text-zinc-200">{proposedAction.action_id}</strong> was blocked, refused, or rejected. Recovery cannot override Rule Zero.</p>
      <p className="mt-2 text-sm text-emerald-100">No automatic recovery, approval, payment, submission, or navigation occurs.</p>

      <ol aria-label="Recovery timeline" className="mt-5 grid gap-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
        {["Unsafe Worker Proposal", "Rule Zero BLOCK", "Safe Recovery Plan", "Recovery Step Evaluation", "Controlled Execution", "Safe Outcome"].map((label) => <li key={label} className="rounded-lg border border-white/10 p-3">{label}</li>)}
      </ol>

      {!plan && !skipped && <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void generate()} disabled={loading || !contract || !controlledState} className="rounded-lg bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 disabled:bg-zinc-700">{loading ? "Generating…" : "Generate Safe Recovery Plan"}</button><button type="button" onClick={() => setSkipped(true)} className="rounded-lg border border-white/15 px-4 py-3 text-sm">Skip Recovery</button></div>}
      {skipped && <p role="status" className="mt-5 rounded-lg border border-white/10 p-4 text-sm">Recovery skipped. Controlled state remains unchanged.</p>}
      {(plan || skipped) && <button type="button" onClick={reset} className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm">Reset Recovery</button>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}

      {plan && <article className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">
        <div className="flex flex-wrap justify-between gap-3"><div><p className="font-mono text-xs text-zinc-500">{plan.recovery_plan_id}</p><h3 className="mt-1 font-semibold">{plan.summary}</h3></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs">{plan.full_task_completion_possible ? "Full completion possible" : "Safe partial completion"}</span></div>
        <p className="mt-3 text-sm text-zinc-400">{plan.explanation}</p>
        <p className="mt-3 text-sm text-zinc-300">Strategy: {plan.strategies.join(" → ")}</p>
        <section className="mt-5"><h4 className="text-xs font-semibold uppercase text-zinc-500">Constraints preserved</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">{plan.preserved_user_constraints.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="mt-5"><h4 className="text-xs font-semibold uppercase text-zinc-500">Ordered recovery steps</h4><ol className="mt-2 space-y-2">{plan.steps.map((step, index) => <li key={step.step_id} className="rounded-lg border border-white/10 p-3 text-sm"><strong>{step.sequence_number}. {step.proposed_action.description}</strong><p className="mt-1 text-zinc-400">{step.reason}</p><span className="mt-2 block text-xs text-zinc-500">Status: {completed.includes(index) ? "completed" : step.execution_status}</span></li>)}</ol></section>
        <p className="mt-4 text-sm text-zinc-300">Expected final state: version {plan.expected_final_state.state_version}, warranty {plan.expected_final_state.addons.warranty_enabled ? "enabled" : "disabled"}, simulation {plan.expected_final_state.simulation_completed ? "complete" : "in progress"}.</p>
        {plan.warnings.map((warning) => <p key={warning} className="mt-2 text-sm text-amber-200">Warning: {warning}</p>)}
        {currentStep && !finished && <button type="button" onClick={() => void executeStep()} disabled={loading} className="mt-5 rounded-lg bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 disabled:bg-zinc-700">{loading ? "Evaluating step…" : "Execute Current Recovery Step"}</button>}
        {stepResult && <section aria-live="polite" className="mt-4 rounded-lg border border-white/10 p-4"><h4 className="font-semibold">Step result: {stepResult.step_status.replaceAll("_", " ")}</h4><p className="mt-2 text-sm text-zinc-400">Fresh decision: {stepResult.fresh_evaluation.decision.toUpperCase()} · State {stepResult.state_changed ? "changed" : "unchanged"}</p>{stepResult.execution_response.approval_request && <div className="mt-3"><p className="text-sm text-amber-100">Explicit Phase 5 approval is required. This step will not advance automatically.</p><div className="mt-3 flex gap-3"><button type="button" onClick={() => void decide("approve")} className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-950">Approve once</button><button type="button" onClick={() => void decide("reject")} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Reject</button></div></div>}</section>}
        {finished && <section aria-label="Safe task outcome" className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-4"><h4 className="font-semibold text-emerald-100">Safe task outcome</h4><p className="mt-2 text-sm">Original goal preserved: {contract?.normalized_intent}. Unsafe action removed. Completion: {plan.completion_status.replaceAll("_", " ")}.</p><p className="mt-1 text-sm text-zinc-400">Final controlled state version: {controlledState?.state_version}.</p></section>}
        <details className="mt-5 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm">Deterministic recovery trace</summary><ol className="mt-3 list-decimal pl-5 text-xs text-zinc-400">{plan.trace.steps.map((item) => <li key={item}>{item}</li>)}</ol></details>
        <details className="mt-3 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm">Raw recovery plan JSON</summary><pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-500">{JSON.stringify(plan, null, 2)}</pre></details>
      </article>}
    </section>
  );
}
