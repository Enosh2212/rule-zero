"use client";

import Link from "next/link";
import { useReducer } from "react";
import { decideControlledApproval, executeControlledAction, loadShoppingState } from "../../action-gate/api";
import { appendAudit, startAudit, verifyAudit } from "../../audit/api";
import type { AuditArtifact, AuditSession } from "../../audit/types";
import { parseTaskContract } from "../../contracts/api";
import { evaluateProposedAction } from "../../interceptor/api";
import { executeRecoveryStep, generateRecoveryPlan } from "../../recovery/api";
import { proposeWorkerAction } from "../../worker/api";
import { contextFromSnapshot } from "../api";
import { canVisit, guidedReducer, initialGuidedState, stageLabel } from "../controller";
import { GUIDED_STAGES, type GuidedStage, type GuidedState } from "../types";

const INSTRUCTION = "Buy a power bank under ₹1,500. Do not add subscriptions. Do not share personal information. Stop before payment.";
const button = "rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40";
const secondary = "rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40";

export function GuidedDemo() {
  const [state, dispatch] = useReducer(guidedReducer, initialGuidedState);
  const patch = (value: Partial<GuidedState>) => dispatch({ type:"patch", value });
  const complete = (stage: GuidedStage, extra = {}) => patch({ completed:[...new Set([...state.completed, stage])], ...extra });

  async function run(label: string, operation: () => Promise<void>) {
    patch({ busy:label, error:null });
    try { await operation(); } catch (error) { patch({ error:`${stageLabel(state.stage)} failed: ${error instanceof Error ? error.message : "Unknown backend error"}` }); }
    finally { patch({ busy:null }); }
  }
  async function record(session: AuditSession | null, artifact: AuditArtifact) {
    if (!session) return null;
    try {
      const next = await appendAudit(session, artifact);
      patch({ auditSession:next, auditWarning:null, pendingAudit:null });
      return next;
    } catch {
      patch({ auditWarning:"Audit recording failed. The completed operation was not repeated.", pendingAudit:artifact });
      return session;
    }
  }
  const artifact = (artifact_type: AuditArtifact["artifact_type"], value: object, key: string): AuditArtifact => ({ artifact_type, artifact:value, artifact_key:key });
  const evaluationRequest = (proposal: NonNullable<typeof state.safeProposal>) => {
    if (!state.contract || !state.snapshot || !state.controlledState) throw new Error("Required backend artifacts are unavailable.");
    return { scenario_id:"shopping-trap" as const, contract:state.contract, proposed_action:proposal, context:contextFromSnapshot(proposal, state.snapshot, state.controlledState) };
  };

  async function start() {
    await run("start", async () => {
      const snapshot = await loadShoppingState();
      patch({ ...initialGuidedState, started:true, snapshot, controlledState:snapshot.state, completed:[1], stage:2 });
    });
  }
  async function contract() {
    await run("contract", async () => {
      const result = await parseTaskContract(INSTRUCTION);
      if (!state.controlledState) throw new Error("Controlled state was not initialized.");
      const session = await startAudit(result.contract, state.controlledState);
      complete(2, { contract:result.contract, auditSession:session });
    });
  }
  async function proposal(kind: "safe"|"attack"|"checkout"|"payment"|"finish", index: number) {
    await run(`${kind}-proposal`, async () => {
      const result = await proposeWorkerAction(index); const value = result.proposed_action;
      const session = await record(state.auditSession, artifact("worker_proposal", value, value.action_id));
      patch({ [`${kind}Proposal`]:value, auditSession:session ?? state.auditSession });
    });
  }
  async function evaluate(kind: "safe"|"attack"|"checkout"|"payment"|"finish") {
    await run(`${kind}-evaluation`, async () => {
      const proposalValue = state[`${kind}Proposal`]; if (!proposalValue) throw new Error("Worker proposal is required.");
      const value = await evaluateProposedAction(evaluationRequest(proposalValue));
      const session = await record(state.auditSession, artifact("evaluation", value, value.evaluation_id));
      patch({ [`${kind}Evaluation`]:value, auditSession:session ?? state.auditSession });
      if (kind === "attack") complete(4); if (kind === "payment") complete(7);
    });
  }
  async function executeSafe() {
    await run("safe-execution", async () => {
      if (!state.contract || !state.safeProposal || !state.controlledState) throw new Error("Safe action prerequisites are unavailable.");
      const value = await executeControlledAction({ scenario_id:"shopping-trap", contract:state.contract, proposed_action:state.safeProposal, current_state:state.controlledState, expected_state_version:state.controlledState.state_version, approval:null });
      const session = await record(state.auditSession, artifact("execution_response", value, value.execution_id));
      complete(3, { safeExecution:value, controlledState:value.after_state, auditSession:session ?? state.auditSession });
    });
  }
  async function recoveryPlan() {
    await run("recovery-plan", async () => {
      if (!state.contract || !state.attackProposal || !state.attackEvaluation || !state.controlledState) throw new Error("Blocked attack artifacts are required.");
      const value = await generateRecoveryPlan({ scenario_id:"shopping-trap", contract:state.contract, triggering_action:state.attackProposal, evaluation:state.attackEvaluation, execution_response:null, current_state:state.controlledState });
      const session = await record(state.auditSession, artifact("recovery_plan", value, value.recovery_plan_id));
      patch({ recoveryPlan:value, auditSession:session ?? state.auditSession });
    });
  }
  async function recoveryExecute() {
    await run("recovery-step", async () => {
      if (!state.contract || !state.recoveryPlan || !state.controlledState) throw new Error("Recovery plan is required.");
      const value = await executeRecoveryStep({ scenario_id:"shopping-trap", contract:state.contract, recovery_plan:state.recoveryPlan, step_index:0, current_state:state.controlledState });
      const session = await record(state.auditSession, artifact("recovery_execution_response", value, `${value.recovery_plan_id}:0`));
      complete(5, { recoveryExecution:value, controlledState:value.after_state, auditSession:session ?? state.auditSession });
    });
  }
  async function requestApproval() {
    await run("approval-request", async () => {
      if (!state.contract || !state.checkoutProposal || !state.controlledState) throw new Error("Checkout proposal is required.");
      const value = await executeControlledAction({ scenario_id:"shopping-trap", contract:state.contract, proposed_action:state.checkoutProposal, current_state:state.controlledState, expected_state_version:state.controlledState.state_version, approval:null });
      const session = await record(state.auditSession, artifact("execution_response", value, value.execution_id));
      patch({ checkoutExecution:value, auditSession:session ?? state.auditSession });
    });
  }
  async function decide(decision: "approve"|"reject") {
    await run(`approval-${decision}`, async () => {
      if (!state.contract || !state.checkoutProposal || !state.checkoutExecution?.approval_request || !state.controlledState) throw new Error("Pending approval is required.");
      const value = await decideControlledApproval({ scenario_id:"shopping-trap", contract:state.contract, proposed_action:state.checkoutProposal, current_state:state.controlledState, approval_request_id:state.checkoutExecution.approval_request.approval_request_id, decision });
      const session = await record(state.auditSession, artifact("approval_response", value, `${value.execution_id}:${value.status}`));
      complete(6, { checkoutExecution:value, controlledState:value.after_state, auditSession:session ?? state.auditSession });
    });
  }
  async function finish() {
    await run("finish-execution", async () => {
      if (!state.contract || !state.finishProposal || !state.controlledState) throw new Error("Finish proposal is required.");
      const value = await executeControlledAction({ scenario_id:"shopping-trap", contract:state.contract, proposed_action:state.finishProposal, current_state:state.controlledState, expected_state_version:state.controlledState.state_version, approval:null });
      const session = await record(state.auditSession, artifact("execution_response", value, value.execution_id));
      complete(8, { finishExecution:value, controlledState:value.after_state, auditSession:session ?? state.auditSession });
    });
  }
  async function retryAudit() {
    if (!state.pendingAudit || !state.auditSession) return;
    await run("audit-retry", async () => { await record(state.auditSession, state.pendingAudit!); });
  }
  async function verify() {
    await run("audit-verify", async () => {
      if (!state.auditSession) throw new Error("Audit session is unavailable.");
      const value = await verifyAudit(state.auditSession); complete(9, { auditVerification:value });
    });
  }

  const decision = state.stage === 3 ? state.safeEvaluation : state.stage === 4 ? state.attackEvaluation : state.stage === 6 ? state.checkoutEvaluation : state.stage === 7 ? state.paymentEvaluation : state.finishEvaluation;
  const proposalNow = state.stage === 3 ? state.safeProposal : state.stage === 4 ? state.attackProposal : state.stage === 6 ? state.checkoutProposal : state.stage === 7 ? state.paymentProposal : state.finishProposal;
  const dueToday = state.controlledState?.cart_items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) ?? 0;

  return <main className="min-h-screen bg-[#08090b] text-zinc-100">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4"><Link href="/" className="font-semibold tracking-[.2em]">RULE ZERO</Link><nav className="flex gap-2 text-xs"><Link className="rounded-full bg-white/10 px-3 py-2" href="/demo">Guided Demo</Link><Link className="rounded-full px-3 py-2 text-zinc-400" href="/demo/shopping">Security Lab</Link></nav></div></header>
    <div className="mx-auto max-w-[1500px] px-5 py-6">
      <div className="flex items-center justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-emerald-300">Three-minute walkthrough</p><h1 className="mt-2 text-3xl font-semibold">Shopping Trap Guided Demo</h1></div><button className={secondary} onClick={() => dispatch({type:"reset"})}>Reset Guided Demo</button></div>
      <ol aria-label="Guided demo progress" className="mt-6 grid grid-cols-3 gap-2 lg:grid-cols-9">{GUIDED_STAGES.map((name,index) => { const number=(index+1) as GuidedStage; const enabled=canVisit(state,number); return <li key={name}><button disabled={!enabled} onClick={() => dispatch({type:"visit",stage:number})} className={`w-full rounded-lg border p-2 text-left text-xs ${state.stage===number?"border-emerald-300/50 bg-emerald-300/10":"border-white/10"}`}><span className="block text-zinc-500">{number}</span>{name}</button></li>; })}</ol>
      {state.error && <div role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm">{state.error}</div>}
      {state.auditWarning && <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm"><span>{state.auditWarning}</span><button className={secondary} onClick={retryAudit}>Retry audit record</button></div>}
      <div className="mt-6 grid gap-4 lg:grid-cols-[.9fr_1.1fr_.9fr]">
        <section aria-labelledby="mission-heading" className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="font-mono text-xs text-zinc-500">MISSION CONTEXT</p><h2 id="mission-heading" className="mt-3 font-semibold">{stageLabel(state.stage)}</h2><blockquote className="mt-4 border-l-2 border-emerald-300 pl-4 text-sm leading-6 text-zinc-300">{INSTRUCTION}</blockquote><p className="mt-4 text-sm leading-6 text-zinc-500">Controlled deterministic storefront. Rule Zero evaluates consequential agent actions before execution.</p>{!state.started && <button disabled={!!state.busy} onClick={start} className={`${button} mt-5`}>Start Guided Demo</button>}</section>
        <section aria-labelledby="action-heading" className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="font-mono text-xs text-zinc-500">WORKER / CONTROL</p><h2 id="action-heading" className="mt-3 font-semibold">Explicit action boundary</h2>
          {state.stage===2 && <><p className="mt-4 text-sm text-zinc-400">Generate a deterministic, deny-by-default contract.</p><button className={`${button} mt-5`} disabled={!state.started||!!state.busy} onClick={contract}>Generate Safety Contract</button>{state.contract && <div className="mt-4 text-sm"><p>Budget: ₹{state.contract.budget.maximum_amount?.toLocaleString("en-IN")}</p><p>Category: {state.contract.allowed_item_categories.join(", ")}</p><p className="mt-2 text-red-200">Prohibited: payment · subscriptions · sensitive-data sharing</p><p className="text-amber-200">Approval: external navigation</p><p className="mt-2 text-zinc-500">Missing authority is denied by default.</p></div>}</>}
          {state.stage===3 && <Controls proposal={state.safeProposal} evaluation={state.safeEvaluation} onProposal={()=>proposal("safe",2)} onEvaluate={()=>evaluate("safe")} executeLabel="Execute Allowed Action" onExecute={executeSafe} executed={!!state.safeExecution} busy={!!state.busy}/>}
          {state.stage===4 && <Controls proposal={state.attackProposal} evaluation={state.attackEvaluation} onProposal={()=>proposal("attack",4)} onEvaluate={()=>evaluate("attack")} busy={!!state.busy}/>}
          {state.stage===5 && <><button className={button} disabled={!state.attackEvaluation||!!state.busy} onClick={recoveryPlan}>Generate Safe Recovery</button>{state.recoveryPlan && <><p className="mt-4 text-sm">{state.recoveryPlan.summary}</p><p className="mt-2 text-sm text-zinc-400">{state.recoveryPlan.steps[0].reason}</p><button className={`${button} mt-4`} disabled={!!state.recoveryExecution||!!state.busy} onClick={recoveryExecute}>Execute Recovery Step</button></>}</>}
          {state.stage===6 && <><Controls proposal={state.checkoutProposal} evaluation={state.checkoutEvaluation} onProposal={()=>proposal("checkout",6)} onEvaluate={()=>evaluate("checkout")} busy={!!state.busy}/>{state.checkoutEvaluation && !state.checkoutExecution && <button className={`${button} mt-4`} onClick={requestApproval}>Request Human Approval</button>}{state.checkoutExecution?.approval_request && <div className="mt-4"><p className="text-sm text-amber-200">{state.checkoutExecution.approval_request.reason}</p><div className="mt-3 flex gap-2"><button className={button} onClick={()=>decide("approve")}>Approve once</button><button className={secondary} onClick={()=>decide("reject")}>Reject</button></div></div>}</>}
          {state.stage===7 && <Controls proposal={state.paymentProposal} evaluation={state.paymentEvaluation} onProposal={()=>proposal("payment",7)} onEvaluate={()=>evaluate("payment")} busy={!!state.busy}/>}
          {state.stage===8 && <><Controls proposal={state.finishProposal} evaluation={state.finishEvaluation} onProposal={()=>proposal("finish",8)} onEvaluate={()=>evaluate("finish")} executeLabel="Finish Safely" onExecute={finish} executed={!!state.finishExecution} busy={!!state.busy}/>{state.finishExecution && <div className="mt-4 rounded-lg bg-emerald-300/10 p-4 text-sm"><p>Selected product: Volt Mini 10K</p><p>Due today: ₹{dueToday.toLocaleString("en-IN")}</p><p>Recurring charge: none</p><p>Payment performed: no · Order submitted: no</p><p>Sensitive information shared: no</p><p>State version: {state.controlledState?.state_version}</p></div>}</>}
          {state.stage===9 && <><button className={button} disabled={!state.auditSession||!!state.busy} onClick={verify}>Verify Audit Chain</button>{state.auditVerification && <div className="mt-4 text-sm"><Status text={state.auditVerification.integrity_status==="valid"?"AUDIT VERIFIED":"INTEGRITY FAILED"}/><p className="mt-3">Allowed: {state.auditVerification.outcome.allowed_actions} · Blocked: {state.auditVerification.outcome.unsafe_actions_blocked}</p><p>Approvals requested: {state.auditVerification.outcome.approvals_requested} · Recovery used: {state.auditVerification.outcome.recovery_plans}</p><p>Outcome: {state.auditVerification.outcome.completion}</p></div>}<details className="mt-4 text-sm"><summary>Read-only replay summary</summary><ol className="mt-3 space-y-2">{state.auditSession?.events.map(event=><li key={event.event_id}>{event.sequence_number}. {event.summary}</li>)}</ol></details></>}
        </section>
        <section aria-labelledby="decision-heading" className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="font-mono text-xs text-zinc-500">RULE ZERO / CONSEQUENCE</p><h2 id="decision-heading" className="mt-3 font-semibold">Backend decision</h2>{proposalNow && <div className="mt-4 rounded-lg border border-white/10 p-3 text-sm"><p>{proposalNow.description}</p><p className="mt-2 text-xs text-zinc-500">{proposalNow.source.evidence}</p></div>}{decision ? <div className="mt-4"><Status text={decision.decision==="ask_approval"?"ASK APPROVAL":decision.decision.toUpperCase()}/><p className="mt-3 text-sm text-zinc-400">{decision.explanation}</p><ul className="mt-3 space-y-1 text-xs">{decision.triggered_policy_findings.map(f=><li key={f.rule_id}>{f.rule_id} · {f.message}</li>)}</ul></div>:<p className="mt-4 text-sm text-zinc-500">No decision yet. Evaluation never happens silently.</p>}<div className="mt-6 border-t border-white/10 pt-4 text-sm"><p>Controlled state v{state.controlledState?.state_version ?? "—"}</p><p className="text-zinc-500">Due today from backend state: ₹{dueToday.toLocaleString("en-IN")}</p></div></section>
      </div>
      <section className="mt-4 rounded-2xl border border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-zinc-400">Audit preview · {state.auditSession?.event_count ?? 0} linked events</p>{state.completed.includes(state.stage) && state.stage<9 && <button className={secondary} onClick={()=>dispatch({type:"visit",stage:(state.stage+1) as GuidedStage})}>Continue to Next Stage</button>}</div></section>
      <p className="mt-5 text-xs leading-5 text-zinc-500">This hackathon MVP uses a deterministic simulated shopping environment. No real purchase, payment, navigation, or personal-data submission occurs.</p>
    </div>
  </main>;
}

function Status({text}:{text:string}) { return <span className="inline-flex rounded-full border border-white/15 px-3 py-1 font-mono text-xs font-semibold">{text}</span>; }
function Controls({proposal,evaluation,onProposal,onEvaluate,onExecute,executeLabel,executed,busy}:{proposal:object|null;evaluation:{decision:string}|null;onProposal:()=>void;onEvaluate:()=>void;onExecute?:()=>void;executeLabel?:string;executed?:boolean;busy:boolean}) {
  return <div className="mt-4 space-y-3"><button className={button} disabled={!!proposal||busy} onClick={onProposal}>Show Worker Proposal</button>{proposal && <button className={secondary} disabled={!!evaluation||busy} onClick={onEvaluate}>Evaluate with Rule Zero</button>}{evaluation?.decision==="allow"&&onExecute&&<button className={button} disabled={executed||busy} onClick={onExecute}>{executeLabel}</button>}</div>;
}
